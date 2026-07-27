// ecos — deterministic fixtures/tests for the G3D provider adapters
// (Rakia, Growth Administration, MAFAT) plus cross-provider orchestration
// (--provider=all, isolation, no-op, managed-metadata preservation). Plain
// Node, no framework, no live network — every fixture below is a small
// hand-written HTML snippet, never a copy of a real page body. All file
// writes go to a throwaway temp directory; the real committed
// src/data/generated/*.js/.json files are never touched by this script.
//
// Run: node scripts/test-growth-tools-sync-g3d.js

const fs = require("fs");
const os = require("os");
const path = require("path");

const { runProviderSync, loadRuntime, writeOverlay, defaultOverlayEntry, ALL_PROVIDER_IDS } = require("./sync-growth-tools.js");

let failures = 0;
function check(label, condition) {
  if (condition) console.log("  ok   " + label);
  else { console.log("  FAIL " + label); failures++; }
}
function section(title) { console.log("\n=== " + title + " ==="); }
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

const runtime = loadRuntime();
const { Store, Adapters } = runtime;
const allTools = Store.getGrowthTools();
const rakiaEvents = allTools.find((t) => t.id === "gt-rakia-events-exhibitions");
const gaDataInfra = allTools.find((t) => t.id === "gt-growth-admin-data-infra");
const mafatMeimad = allTools.find((t) => t.id === "gt-mafat-meimad");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ecos-growth-tools-g3d-"));
const tmpSourceDataPath = path.join(tmpDir, "growth-tools-source-data.js");

function freshOverlay() {
  const overlay = {};
  allTools.forEach((t) => { overlay[t.id] = defaultOverlayEntry(t); });
  return overlay;
}
function seedTempFile(overlay) {
  writeOverlay(tmpSourceDataPath, overlay, allTools.map((t) => t.id));
}

// -----------------------------------------------------------------------
// Section 1: pure extraction-function unit tests (no fetch, hand-written
// HTML fixtures only).
// -----------------------------------------------------------------------
section("Rakia extraction — pure fixtures");
{
  const single = '<html><body><h1>אירועים ותערוכות</h1><p>תוכן</p></body></html>';
  const rakia1 = Adapters._extractRakiaFields(single);
  check("page parses without crash", !!rakia1);
  check("officialName extracted from single h1", rakia1.officialName === "אירועים ותערוכות");
  check("no deadline without a deadline keyword", rakia1.deadline === null);

  const multiEventDates = '<html><body><h1>אירועים ותערוכות</h1>' +
    '<div>אירוע ב-12/03/2026</div><div>אירוע נוסף ב-01/04/2026</div><div>עוד אירוע ב-2026-05-20</div>' +
    '</body></html>';
  const rakia2 = Adapters._extractRakiaFields(multiEventDates);
  check("multiple event dates do NOT become a false global deadline", rakia2.deadline === null);

  const explicitDeadline = '<html><body><h1>מסלול הגשה</h1><p>מועד אחרון להגשה: 30/09/2026</p></body></html>';
  const rakia3 = Adapters._extractRakiaFields(explicitDeadline);
  check("single explicit labeled deadline IS extracted", rakia3.deadline === "2026-09-30");

  const noHtml = Adapters._extractRakiaFields(null);
  check("null html does not crash", noHtml.officialName === null && noHtml.deadline === null);
}

section("Growth Administration extraction — pure fixtures");
{
  const realistic = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@graph":[
      {"@type":"WebPage","name":"קול קורא: תשתיות בתחומי הקלאסטרים","datePublished":"2024-09-09T15:42:45+00:00","dateModified":"2025-09-10T15:17:26+00:00","potentialAction":[{"@type":"ReadAction","target":["https://israelgrowth.org.il/calling-voice/"]}]}
    ]}
  </script></head><body>text</body></html>`;
  const ga1 = Adapters._extractGrowthAdminFields(realistic);
  check("officialName extracted from WebPage.name", ga1.officialName === "קול קורא: תשתיות בתחומי הקלאסטרים");
  check("page-update date (datePublished/dateModified) ignored as deadline", ga1.deadline === null);
  check("generic ReadAction ignored as applicationUrl", ga1.applicationUrl === null);

  const withExplicitDeadlineAndApply = `<html><head><script type="application/ld+json">
    {"@context":"https://schema.org","@graph":[
      {"@type":"WebPage","name":"קול קורא לדוגמה","datePublished":"2024-01-01T00:00:00+00:00","potentialAction":[{"@type":"ApplyAction","target":["https://israelgrowth.org.il/apply/example"]}]},
      {"@type":"Event","validThrough":"2026-11-30T23:59:00+00:00"}
    ]}
  </script></head><body>text</body></html>`;
  const ga2 = Adapters._extractGrowthAdminFields(withExplicitDeadlineAndApply);
  check("explicit deadline (non-WebPage node) parses", ga2.deadline === "2026-11-30");
  check("clear non-ReadAction CTA becomes applicationUrl", ga2.applicationUrl === "https://israelgrowth.org.il/apply/example");

  const noJsonLd = "<html><body>no structured data here</body></html>";
  const ga3 = Adapters._extractGrowthAdminFields(noJsonLd);
  check("missing JSON-LD yields all-null, no crash", ga3.officialName === null && ga3.deadline === null && ga3.applicationUrl === null);
}

section("MAFAT extraction — pure fixtures");
{
  const closed = '<html><body><h1 class="ProgramHeroSectionComponent_programTitle__R7KWx">תוכנית מימד</h1><h1 class="AiChatComponent_title__abc">Mafat AI</h1><div class="ClosedRegistration__xaK2x">ההרשמה נסגרה</div></body></html>';
  const mafat1 = Adapters._extractMafatFields(closed);
  check("officialName picks the program-title h1, not the chatbot h1", mafat1.officialName === "תוכנית מימד");
  check("explicit closed status recognized", mafat1.status === "closed");

  const open = '<html><body><h1 class="ProgramHeroSectionComponent_programTitle__xyz">תוכנית לדוגמה</h1><div>ההרשמה פתוחה</div></body></html>';
  const mafat2 = Adapters._extractMafatFields(open);
  check("explicit open status recognized", mafat2.status === "open");

  const ambiguous = '<html><body><h1 class="programTitle">תוכנית</h1><p>אין מידע על מצב ההרשמה</p></body></html>';
  const mafat3 = Adapters._extractMafatFields(ambiguous);
  check("no status guessed when wording is ambiguous", mafat3.status === null);
}

// -----------------------------------------------------------------------
// Section 2: cross-provider orchestration via runProviderSync + fixture
// adapters (no live network).
// -----------------------------------------------------------------------
function registerFixture(adaptersInstance, providerId, adapterId, candidatesByToolId) {
  adaptersInstance.register({
    id: adapterId,
    providerId,
    sourceType: "manual",
    fetch(context) {
      return Promise.resolve((context.tools || []).map((t) => ({
        toolId: t.id,
        sourceUrl: t.source.url,
        ok: Object.prototype.hasOwnProperty.call(candidatesByToolId, t.id) ? candidatesByToolId[t.id].ok !== false : false,
        html: null,
        error: null,
        fetchedAt: "2026-07-27T09:00:00.000Z",
      })));
    },
    normalize(rows) {
      return rows.map((row) => {
        const c = candidatesByToolId[row.toolId] || {};
        return Object.assign({
          toolId: row.toolId, providerId, externalId: null, officialName: null,
          status: null, deadline: null, applicationUrl: null,
          sourceUrl: row.sourceUrl, fetchedAt: row.fetchedAt,
        }, c.raw || {});
      });
    },
  });
}

// Reloads growth-tools-store.js (+ adapters + sync-service) fresh against
// a given overlay file — used so every cross-provider assertion below
// reflects the TEMP-seeded state, never whatever the real committed
// generated file happens to currently hold (this suite must pass
// identically whether run before or after a real sync has updated that
// file).
function loadRuntimeFromOverlay(sourceDataPath) {
  global.window = {};
  delete require.cache[require.resolve(sourceDataPath)];
  require(sourceDataPath);
  const root = path.join(__dirname, "..");
  delete require.cache[require.resolve(path.join(root, "src", "services", "growth-tools-store.js"))];
  require(path.join(root, "src", "services", "growth-tools-store.js"));
  delete require.cache[require.resolve(path.join(root, "src", "services", "growth-tools-adapters.js"))];
  require(path.join(root, "src", "services", "growth-tools-adapters.js"));
  delete require.cache[require.resolve(path.join(root, "src", "services", "growth-tools-sync-service.js"))];
  require(path.join(root, "src", "services", "growth-tools-sync-service.js"));
  return { Store: window.GrowthToolsStore, Adapters: window.GrowthToolsAdapters, Sync: window.GrowthToolsSyncService };
}

async function main() {
  section("Cross-provider: failure in one provider does not stop another");
  seedTempFile(freshOverlay());
  {
    const rt = loadRuntimeFromOverlay(tmpSourceDataPath);
    registerFixture(rt.Adapters, "rakia", "rakia-web", { "gt-rakia-events-exhibitions": { ok: false } });
    registerFixture(rt.Adapters, "growth-administration", "growth-administration-web", { "gt-growth-admin-data-infra": { raw: { officialName: "עודכן" } } });
    const rRakia = await runProviderSync(rt, "rakia", { sourceDataPath: tmpSourceDataPath });
    const rGa = await runProviderSync(rt, "growth-administration", { sourceDataPath: tmpSourceDataPath });
    check("rakia source failure recorded", rRakia.result.sourceFailures >= 1);
    check("growth-administration still succeeded independently", rGa.result.toolsChanged === 1);
  }

  section("Cross-provider: --provider=all deterministic orchestration");
  seedTempFile(freshOverlay());
  {
    const rt = loadRuntimeFromOverlay(tmpSourceDataPath);
    registerFixture(rt.Adapters, "innovation-authority", "innovation-authority-web", {});
    registerFixture(rt.Adapters, "rakia", "rakia-web", { "gt-rakia-events-exhibitions": { raw: { officialName: "A" } } });
    registerFixture(rt.Adapters, "growth-administration", "growth-administration-web", { "gt-growth-admin-data-infra": { raw: { officialName: "B" } } });
    registerFixture(rt.Adapters, "ddrd-mafat", "mafat-web", { "gt-mafat-meimad": { raw: { status: "closed" } } });
    const results = [];
    for (const pid of ALL_PROVIDER_IDS) {
      results.push((await runProviderSync(rt, pid, { sourceDataPath: tmpSourceDataPath })).result);
    }
    check("all 4 canonical providers ran", results.length === 4);
    check("providers ran in the documented order", deepEqual(ALL_PROVIDER_IDS, ["innovation-authority", "rakia", "growth-administration", "ddrd-mafat"]));
    const totalChanged = results.reduce((a, r) => a + r.toolsChanged, 0);
    check("total tools changed across all providers is deterministic (3)", totalChanged === 3);
  }

  section("No-op remains byte-identical across a multi-provider run");
  {
    const overlay0 = freshOverlay();
    seedTempFile(overlay0);
    const rt = loadRuntimeFromOverlay(tmpSourceDataPath);
    const before = fs.readFileSync(tmpSourceDataPath, "utf8");
    registerFixture(rt.Adapters, "rakia", "rakia-web", {});
    registerFixture(rt.Adapters, "growth-administration", "growth-administration-web", {});
    registerFixture(rt.Adapters, "ddrd-mafat", "mafat-web", {});
    await runProviderSync(rt, "rakia", { sourceDataPath: tmpSourceDataPath });
    await runProviderSync(rt, "growth-administration", { sourceDataPath: tmpSourceDataPath });
    await runProviderSync(rt, "ddrd-mafat", { sourceDataPath: tmpSourceDataPath });
    const after = fs.readFileSync(tmpSourceDataPath, "utf8");
    check("file byte-identical after 3 no-op provider runs", before === after);
  }

  section("Generated overlay merge still preserves managed metadata");
  seedTempFile(freshOverlay());
  {
    const rt = loadRuntimeFromOverlay(tmpSourceDataPath);
    registerFixture(rt.Adapters, "ddrd-mafat", "mafat-web", { "gt-mafat-meimad": { raw: { status: "closed", officialName: "תוכנית מימד" } } });
    const { overlay } = await runProviderSync(rt, "ddrd-mafat", { sourceDataPath: tmpSourceDataPath });
    writeOverlay(tmpSourceDataPath, overlay, allTools.map((t) => t.id));
    const rt2 = loadRuntimeFromOverlay(tmpSourceDataPath);
    const meimadAfter = rt2.Store.getGrowthTools().find((t) => t.id === "gt-mafat-meimad");
    check("status updated", meimadAfter.status === "closed");
    check("stages (managed) unchanged", deepEqual(meimadAfter.stages, mafatMeimad.stages));
    check("purposes (managed) unchanged", deepEqual(meimadAfter.purposes, mafatMeimad.purposes));
    check("type (managed) unchanged", meimadAfter.type === mafatMeimad.type);
    check("name (managed) unchanged", meimadAfter.name === mafatMeimad.name);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
  process.exit(failures === 0 ? 0 : 1);
}

main();
