// ecos — local, admin-editable option lists for the Needs Board.
// Covers spaceSegment / needType / priority / status. sourceType stays fixed
// (internal / organization / opportunity) since it drives real save-path
// branching in view-needs.jsx, not just a display label.
// localStorage-only, no backend, no network.

(function () {
  const STORAGE_KEY = "ecosystemOS.needsTaxonomy.v1";
  const GROUP_KEYS = ["spaceSegment", "needType", "priority", "status"];

  const asArray = (value) => Array.isArray(value) ? value : [];
  const text = (value) => typeof value === "string" ? value.trim() : "";

  const DEFAULTS = {
    spaceSegment: [
      { value: "upstream", label: "Upstream / תשתיות וחלל" },
      { value: "space-in", label: "Space-In / פעילות בחלל" },
      { value: "downstream", label: "Downstream / שירותים ודאטה" },
      { value: "development-research", label: "Development & Research / פיתוח ומחקר" },
      { value: "services-ecosystem", label: "Services Ecosystem / שירותי אקו־סיסטם" },
      { value: "other", label: "אחר" },
    ],
    needType: [
      { value: "pilot", label: "פיילוט" },
      { value: "customer", label: "לקוח" },
      { value: "funding", label: "מימון" },
      { value: "technology", label: "טכנולוגיה" },
      { value: "data", label: "דאטה" },
      { value: "regulation", label: "רגולציה" },
      { value: "partner", label: "שותף" },
      { value: "research", label: "מחקר" },
      { value: "challenge", label: "אתגר" },
      { value: "other", label: "אחר" },
    ],
    priority: [
      { value: "high", label: "גבוהה" },
      { value: "medium", label: "בינונית" },
      { value: "low", label: "נמוכה" },
    ],
    status: [
      { value: "new", label: "חדש" },
      { value: "reviewing", label: "בבדיקה" },
      { value: "matching", label: "בהתאמה" },
      { value: "in-progress", label: "בטיפול" },
      { value: "done", label: "הושלם" },
    ],
  };

  function defaultsFor(groupKey) {
    return asArray(DEFAULTS[groupKey]).map((o) => Object.assign({ isDefault: true, isActive: true }, o));
  }

  function slugify(label) {
    const base = text(label)
      .toLowerCase()
      .replace(/[^a-z0-9֐-׿]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base;
  }

  function readAll() {
    try {
      const raw = window.localStorage && window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (err) {
      console.warn("TaxonomyStore: failed to read options", err);
      return null;
    }
  }

  function writeAll(all) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      console.warn("TaxonomyStore: failed to save options", err);
    }
    return all;
  }

  // Seeds defaults for any missing group on first read (or if localStorage
  // was cleared/corrupted) without touching groups that already exist.
  function getOptions() {
    const stored = readAll() || {};
    let changed = false;
    GROUP_KEYS.forEach((key) => {
      if (!Array.isArray(stored[key]) || !stored[key].length) {
        stored[key] = defaultsFor(key);
        changed = true;
      }
    });
    if (changed) writeAll(stored);
    return stored;
  }

  function getGroup(groupKey) {
    const all = getOptions();
    return asArray(all[groupKey]);
  }

  function getActiveGroup(groupKey, includeValue) {
    return getGroup(groupKey).filter((o) => o.isActive || o.value === includeValue);
  }

  function saveGroup(groupKey, options) {
    const all = getOptions();
    all[groupKey] = options;
    writeAll(all);
    return options;
  }

  function addOption(groupKey, label) {
    const options = getGroup(groupKey);
    const cleanLabel = text(label);
    if (!cleanLabel) return options;
    let value = slugify(cleanLabel) || `opt_${Date.now().toString(36)}`;
    const existingValues = new Set(options.map((o) => o.value));
    if (existingValues.has(value)) value = `${value}_${Date.now().toString(36)}`;
    const next = options.concat([{ value, label: cleanLabel, isDefault: false, isActive: true }]);
    saveGroup(groupKey, next);
    return next;
  }

  function updateOption(groupKey, value, patch) {
    const options = getGroup(groupKey);
    const next = options.map((o) => o.value === value ? Object.assign({}, o, patch, { value: o.value }) : o);
    saveGroup(groupKey, next);
    return next;
  }

  function toggleOption(groupKey, value, isActive) {
    return updateOption(groupKey, value, { isActive: !!isActive });
  }

  function resetGroup(groupKey) {
    const fresh = defaultsFor(groupKey);
    saveGroup(groupKey, fresh);
    return fresh;
  }

  function labelFor(groupKey, value) {
    const found = getGroup(groupKey).find((o) => o.value === value);
    return found ? found.label : (value || "אחר");
  }

  window.TaxonomyStore = {
    key: STORAGE_KEY,
    GROUP_KEYS,
    getOptions,
    getGroup,
    getActiveGroup,
    addOption,
    updateOption,
    toggleOption,
    resetGroup,
    labelFor,
  };
})();
