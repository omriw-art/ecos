// ecos — JSON/CSV import & export for local company/submission data.
// Owns parsing, shape detection/validation, field sanitization, and
// export-payload assembly. File reading (FileReader), Blob/anchor download
// mechanics, and all UI state/toasts stay in the Dashboard component.

(function () {
  if (window.ImportExportService) return;

  const EXPORT_APP_NAME = "Ecosystem OS";
  const MAX_IMPORT_FILE_SIZE_BYTES = 20 * 1024 * 1024; // soft cap, ~20MB

  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => (value == null ? "" : String(value)).trim();

  // Only these fields are ever written to CompanyStore/SubmissionStore from
  // an imported file. CompanyStore.normalizeCompany/SubmissionStore's
  // normalizeSubmission merge unknown keys through unchanged (by design, for
  // internal callers like the company editor) — but an imported file is
  // untrusted input, and some unexpected keys (e.g. a crafted "logo" field)
  // can reach unescaped rendering elsewhere in the app. Whitelisting here
  // keeps that risk out of the import path without changing the stores.
  const COMPANY_FIELDS = [
    "id", "name", "country", "flag", "hq", "stage", "size", "founded",
    "fundingM", "score", "strategic", "readiness", "organizationType",
    "spaceSegment", "sectors", "tech", "capabilities", "tags", "solutions",
    "offers", "needs", "customers", "partners", "overlap", "blurb",
    "website", "linkedin",
  ];
  const SUBMISSION_FIELDS = [
    "id", "createdAt", "reviewedAt", "status", "companyName", "name",
    "sector", "sectors", "blurb", "description", "location", "hq",
    "country", "website", "stage", "offers", "needs", "capabilities", "tags",
    "contactName", "contactRole", "email", "contact", "approvedCompanyId",
  ];

  function pickFields(record, fields) {
    const picked = {};
    fields.forEach((key) => {
      if (record && Object.prototype.hasOwnProperty.call(record, key)) picked[key] = record[key];
    });
    return picked;
  }

  function uniqueId(suffix, name, used) {
    const base = text(name).toLowerCase().replace(/[^a-z0-9֐-׿]+/g, "-").replace(/^-+|-+$/g, "") || "co";
    let id = `${base}-${suffix}`;
    let n = 2;
    while (used.has(id)) id = `${base}-${suffix}-${n++}`;
    used.add(id);
    return id;
  }

  // Whitelists fields and fills in a unique id for any record missing one
  // (an empty/duplicate id would otherwise collide with `find(c => c.id === id)`
  // lookups used throughout the app).
  function sanitizeCompanies(companies, idSuffix) {
    const used = new Set();
    return asArray(companies).map((c) => {
      const picked = pickFields(c, COMPANY_FIELDS);
      if (text(picked.id)) used.add(picked.id);
      return picked;
    }).map((picked) => {
      if (!text(picked.id)) picked.id = uniqueId(idSuffix, picked.name, used);
      return picked;
    });
  }

  function sanitizeSubmissions(submissions) {
    return asArray(submissions).map((s) => pickFields(s, SUBMISSION_FIELDS));
  }

  // ── CSV import ──

  function parseCSVLine(line) {
    const cells = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        i++;
        let field = "";
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else { field += line[i++]; }
        }
        cells.push(field.trim());
        if (line[i] === ",") i++;
      } else {
        const end = line.indexOf(",", i);
        if (end === -1) { cells.push(line.slice(i).trim()); break; }
        cells.push(line.slice(i, end).trim());
        i = end + 1;
      }
    }
    if (line.endsWith(",")) cells.push("");
    return cells;
  }

  const CSV_COL_MAP = {
    name: "name", company: "name", companyname: "name", "שם": "name", "שםחברה": "name",
    description: "blurb", blurb: "blurb", about: "blurb", summary: "blurb", "תיאור": "blurb",
    website: "website", url: "website", link: "website", "אתר": "website",
    city: "hq", companyscity: "hq", companycity: "hq", "עיר": "hq",
    location: "location", "מיקום": "location",
    country: "country", "מדינה": "country",
    stage: "stage", fundingstage: "stage",
    yearestablished: "founded", founded: "founded",
    sector: "sector", sectors: "sector", industry: "sector", category: "sector", "תחום": "sector", "סקטור": "sector",
    subcategory: "subCategory",
    capabilities: "tech", capability: "tech", tags: "tech", tag: "tech", tech: "tech", technology: "tech", technologies: "tech",
    "טכנולוגיות": "tech", "יכולות": "tech", "תגיות": "tech",
    needs: "needs", need: "needs", "צרכים": "needs", "צורך": "needs",
    offers: "offers", offer: "offers", solutions: "offers", "הצעה": "offers", "פתרונות": "offers",
  };

  const SECTOR_COL_MAP = {
    // Space/tech → canonical sector IDs
    eo: "earth-obs", earthobs: "earth-obs",
    communication: "comms", comms: "comms",
    defense: "defense",
    launchpropulsion: "propulsion", launchers: "launchers", propulsion: "propulsion",
    spacesystemmanufacturing: "manufacturing", manufacturing: "manufacturing",
    groundsystems: "manufacturing", inspacerdmanufacturing: "manufacturing",
    inspaceservicesinfrastructure: "manufacturing", explorationresourceutilization: "manufacturing",
    aidata: "ai-data", computingsoftwareanddatasolutions: "ai-data", pnt: "ai-data",
    healthtech: "life-sci",
    energy: "energy", sar: "sar",
    // Non-canonical → honest descriptive labels (not real sector IDs)
    education: "education", educationoutreach: "education",
    research: "research", researchanddevelopment: "research",
    academic: "academic", academicandresearchinstitutions: "academic",
    accelerator: "accelerator", acceleratorsinnovationhubs: "accelerator",
    investment: "investment", investmentventuresupport: "investment",
    consulting: "consulting", consultingengineeringservices: "consulting",
    government: "government",
    legal: "legal", legalinsurancepolicy: "legal",
  };

  function normCol(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9֐-׿]/g, "");
  }

  function parseCSVCompanies(csvText) {
    const clean = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText;
    const rows = clean.split(/\r?\n|\r/).filter((l) => l.trim()).map(parseCSVLine);
    const nameKeys = new Set(["name", "company", "companyname", "שם", "שםחברה"]);
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      if (rows[i].slice(0, 6).some((c) => nameKeys.has(normCol(c)))) { headerIdx = i; break; }
    }
    const headers = rows[headerIdx].map(normCol);
    const usedIds = new Set();
    const companies = rows.slice(headerIdx + 1).map(function (row) {
      const raw = {};
      headers.forEach(function (h, i) {
        const field = CSV_COL_MAP[h];
        const val = row[i] ? row[i].trim() : "";
        if (field && val) raw[field] = val;
      });
      if (!raw.name) return null;
      const sectorKey = normCol(raw.subCategory || raw.sector || "");
      const rawSectorText = (raw.subCategory || raw.sector || "").trim();
      const sector = SECTOR_COL_MAP[sectorKey] || rawSectorText || "other";
      const splitMV = function (v) { return v ? String(v).split(/[,;|]/).map(function (s) { return s.trim(); }).filter(Boolean) : []; };
      const base = raw.name.toLowerCase().replace(/[^a-z0-9֐-׿]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "co";
      let id = base + "-csv";
      let n = 2;
      while (usedIds.has(id)) id = base + "-csv-" + n++;
      usedIds.add(id);
      return {
        id: id,
        name: raw.name,
        blurb: raw.blurb || "",
        website: raw.website || "",
        hq: raw.hq || raw.location || raw.country || "Israel",
        country: raw.country || "Israel",
        stage: raw.stage || "Seed",
        founded: Number(raw.founded) || 0,
        sectors: [sector],
        tech: splitMV(raw.tech),
        needs: splitMV(raw.needs),
        offers: splitMV(raw.offers),
      };
    }).filter(function (c) { return c && c.name; });
    return sanitizeCompanies(companies, "csv");
  }

  // ── JSON import ──

  function parseJSONImport(rawText) {
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      return { ok: false, error: "שגיאת קריאת JSON — " + (err.message || err) };
    }

    if (parsed && parsed.app && parsed.app !== EXPORT_APP_NAME) {
      return { ok: false, error: "הקובץ אינו מיצוא של Ecosystem OS" };
    }

    let companies, submissions, importType, exportedAt;
    if (parsed && parsed.app === EXPORT_APP_NAME) {
      if (!Array.isArray(parsed.companies)) {
        return { ok: false, error: "קובץ לא תקין — חסר מערך companies" };
      }
      companies = parsed.companies;
      submissions = Array.isArray(parsed.submissions) ? parsed.submissions : [];
      importType = "ecosystem-os";
      exportedAt = parsed.exportedAt || null;
    } else if (Array.isArray(parsed)) {
      companies = parsed;
      submissions = [];
      importType = "external-json";
      exportedAt = null;
    } else if (parsed && Array.isArray(parsed.companies)) {
      companies = parsed.companies;
      submissions = [];
      importType = "external-json";
      exportedAt = null;
    } else {
      return { ok: false, error: "קובץ לא תקין — לא נמצאו חברות" };
    }

    const valid = companies
      .filter((c) => c && typeof c === "object" && !Array.isArray(c))
      .map((c) => importType === "external-json"
        ? Object.assign({}, c, { name: text(c.name || c.companyName || c.company || "") })
        : c)
      .filter((c) => text(c.name || ""));
    if (!valid.length) {
      return { ok: false, error: "לא נמצאו חברות תקינות בקובץ" };
    }

    return {
      ok: true,
      importType,
      exportedAt,
      companies: sanitizeCompanies(valid, "json"),
      submissions: sanitizeSubmissions(submissions),
    };
  }

  // ── Export ──

  function buildExportPayload() {
    return {
      exportedAt: new Date().toISOString(),
      app: EXPORT_APP_NAME,
      companies: window.CompanyStore ? window.CompanyStore.getCompanies() : asArray(window.COMPANIES),
      submissions: window.SubmissionStore ? window.SubmissionStore.getSubmissions() : [],
    };
  }

  function buildCSVTemplate() {
    const headers = "name,description,website,sector,location,capabilities,needs,offers";
    const example = [
      "Example Company",
      "Short description of what the company does",
      "https://example.com",
      "earth-obs",
      "Tel Aviv",
      "SAR imaging;AI analysis",
      "Pilot customers;Funding",
      "Remote sensing data",
    ].map((v) => `"${v}"`).join(",");
    return "﻿" + headers + "\n" + example + "\n";
  }

  // ── Apply import (write + rollback) ──

  function applyImport(companies, submissions) {
    const prevCompanies = window.CompanyStore ? window.CompanyStore.getCompanies() : [];
    const prevSubmissions = window.SubmissionStore ? window.SubmissionStore.getSubmissions() : [];
    try {
      window.CompanyStore.saveCompanies(companies);
      window.SubmissionStore.saveSubmissions(submissions);
      return { ok: true };
    } catch (err) {
      try {
        window.CompanyStore && window.CompanyStore.saveCompanies(prevCompanies);
        window.SubmissionStore && window.SubmissionStore.saveSubmissions(prevSubmissions);
      } catch (_) {}
      return { ok: false, error: err.message || String(err) };
    }
  }

  window.ImportExportService = {
    MAX_IMPORT_FILE_SIZE_BYTES,
    parseCSVCompanies,
    parseJSONImport,
    buildExportPayload,
    buildCSVTemplate,
    applyImport,
  };
})();
