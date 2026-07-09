// ecos — shared localStorage helper for the browser stores.
// Owns the raw persistence mechanics (availability guard, JSON parse/stringify,
// try/catch) so each store keeps only its own type validation and defaults.
// localStorage-only, no backend, no network.

(function () {
  if (window.EcosStorage) return;

  function available() {
    try {
      return !!window.localStorage;
    } catch (err) {
      return false;
    }
  }

  // Returns the parsed value for `key`, or `fallback` when storage is
  // unavailable, the key is missing, or the stored value fails to parse.
  // Does NOT type-check the parsed value — callers validate shape themselves.
  function read(key, fallback = null) {
    try {
      const raw = available() && window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("EcosStorage: failed to read", key, err);
      return fallback;
    }
  }

  // Serializes and stores `value` under `key`. Returns true on success.
  function write(key, value) {
    if (!available()) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn("EcosStorage: failed to write", key, err);
      return false;
    }
  }

  // Removes `key` from storage. Returns true on success.
  function remove(key) {
    if (!available()) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.warn("EcosStorage: failed to remove", key, err);
      return false;
    }
  }

  window.EcosStorage = {
    available,
    read,
    write,
    remove,
  };
})();
