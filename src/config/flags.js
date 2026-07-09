// ecos — runtime feature flags, resolved per environment.
// Exposes window.EcosFlags. Loaded after env.js (depends on window.EcosEnv).
//
// Production is the only truly restricted environment for now, and unknown
// hosts always resolve to production (see env.js fail-closed fallback).
// Hiding is soft — this prevents accidents, not attacks.

(function () {
  if (window.EcosFlags) return;

  const OVERRIDES_KEY = "ecosystemOS.flagOverrides.v1";

  // Only flags that gate real, existing code. Add new flags in the same
  // commit that introduces the feature they gate.
  const DEFAULTS = {
    local:      { demoReset: true,  debugPanel: true,  envBadge: true },
    demo:       { demoReset: true,  debugPanel: false, envBadge: true },
    staging:    { demoReset: true,  debugPanel: true,  envBadge: true },
    production: { demoReset: false, debugPanel: false, envBadge: false },
  };

  const envName = (window.EcosEnv && window.EcosEnv.name) || "production";
  const defaults = DEFAULTS[envName] || DEFAULTS.production;

  function readOverrides() {
    try {
      const raw = window.localStorage.getItem(OVERRIDES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  const resolved = Object.assign({}, defaults);
  const overrides = readOverrides();
  Object.keys(overrides).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      resolved[key] = !!overrides[key];
    }
  });

  function isEnabled(name) {
    return !!resolved[name];
  }

  function setOverride(name, enabled) {
    if (!Object.prototype.hasOwnProperty.call(defaults, name)) {
      console.warn("EcosFlags: unknown flag", name);
      return false;
    }
    try {
      const current = readOverrides();
      current[name] = !!enabled;
      window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(current));
      console.info("EcosFlags: override '" + name + "' = " + !!enabled + " — reload to apply.");
      return true;
    } catch (e) {
      console.warn("EcosFlags: failed to persist override", e);
      return false;
    }
  }

  function clearOverrides() {
    try {
      window.localStorage.removeItem(OVERRIDES_KEY);
      console.info("EcosFlags: overrides cleared — reload to apply.");
      return true;
    } catch (e) {
      console.warn("EcosFlags: failed to clear overrides", e);
      return false;
    }
  }

  window.EcosFlags = Object.assign({}, resolved, {
    isEnabled,
    setOverride,
    clearOverrides,
  });
})();
