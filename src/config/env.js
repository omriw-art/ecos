// ecos — runtime environment detection (no bundler, no build-time env).
// Exposes window.EcosEnv. Loaded before all other app scripts.
//
// NOTE: hiding is soft — all code ships to the browser and anyone can flip
// the override in DevTools. This prevents accidents, not attacks. Real
// authorization comes later with a backend/auth layer.

(function () {
  if (window.EcosEnv) return;

  const ENV_NAMES = ["local", "demo", "staging", "production"];
  const OVERRIDE_KEY = "ecosystemOS.envOverride.v1";

  // Map known hostnames to environments. Fill in real hosts when they exist,
  // e.g. "demo.example.com": "demo", "staging.example.com": "staging".
  //
  // GitHub Pages (omriw-art.github.io) is this project's current public
  // deployment — for this development/demo phase it is explicitly mapped to
  // "demo" rather than being left to fall through to the "production"
  // default. This is a deliberate, explicit demo-mode decision (see
  // flags.js's DEFAULTS.demo), not an accidental hostname coupling: without
  // this entry, an unrecognized host fails closed to "production" (see
  // fromHostname() below), which would silently disable the perspective
  // switcher/debug panel/env badge/demo-reset on the deployed app. Remove
  // this entry (or repoint it to "production") when this project moves
  // beyond the current internal/demo phase and needs a real, server-side-
  // authorized production deployment — client-side flag hiding here is
  // never a security boundary.
  const HOSTNAME_MAP = {
    "localhost": "local",
    "127.0.0.1": "local",
    "omriw-art.github.io": "demo",
  };

  const isValid = (value) => ENV_NAMES.indexOf(value) !== -1;

  function fromQueryParam() {
    try {
      const value = new URLSearchParams(window.location.search).get("env");
      return isValid(value) ? value : null;
    } catch (e) {
      return null;
    }
  }

  function fromOverride() {
    try {
      const value = window.localStorage.getItem(OVERRIDE_KEY);
      return isValid(value) ? value : null;
    } catch (e) {
      return null;
    }
  }

  function fromHostname() {
    try {
      if (window.location.protocol === "file:") return "local";
      const hostname = window.location.hostname.toLowerCase();
      const mapped = HOSTNAME_MAP[hostname];
      return isValid(mapped) ? mapped : null;
    } catch (e) {
      return null;
    }
  }

  // Detection order: query param → sticky override → hostname → production.
  // Unknown hosts must fail closed to the most restrictive environment.
  const name = fromQueryParam() || fromOverride() || fromHostname() || "production";

  function setOverride(value) {
    if (!isValid(value)) {
      console.warn("EcosEnv: invalid environment name", value);
      return false;
    }
    try {
      window.localStorage.setItem(OVERRIDE_KEY, value);
      console.info("EcosEnv: override set to '" + value + "' — reload to apply.");
      return true;
    } catch (e) {
      console.warn("EcosEnv: failed to persist override", e);
      return false;
    }
  }

  function clearOverride() {
    try {
      window.localStorage.removeItem(OVERRIDE_KEY);
      console.info("EcosEnv: override cleared — reload to apply.");
      return true;
    } catch (e) {
      console.warn("EcosEnv: failed to clear override", e);
      return false;
    }
  }

  window.EcosEnv = {
    name,
    isLocal: name === "local",
    isDemo: name === "demo",
    isStaging: name === "staging",
    isProduction: name === "production",
    setOverride,
    clearOverride,
  };
})();
