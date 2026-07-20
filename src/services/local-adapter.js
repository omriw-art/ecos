// ecos — local adapter over EcosStorage. Sits between EcosRepo and
// EcosStorage: exposes the same synchronous read/write/remove used by the
// existing stores today (readSync/writeSync/removeSync — the only sanctioned
// direct-to-EcosStorage path during this migration window) plus a
// Promise-based surface for EcosRepo and future consumers. A future
// EcosRemoteAdapter would implement the same Promise-based surface.

(function () {
  if (window.EcosLocalAdapter) return;

  function readSync(key, fallback) {
    return window.EcosStorage.read(key, fallback);
  }

  function writeSync(key, value) {
    return window.EcosStorage.write(key, value);
  }

  function removeSync(key) {
    return window.EcosStorage.remove(key);
  }

  function list(key) {
    const value = readSync(key, []);
    return Promise.resolve(Array.isArray(value) ? value : []);
  }

  function getDoc(key, fallback) {
    return Promise.resolve(readSync(key, fallback));
  }

  function put(key, value) {
    writeSync(key, value);
    return Promise.resolve(value);
  }

  function clear(key) {
    removeSync(key);
    return Promise.resolve(true);
  }

  window.EcosLocalAdapter = {
    readSync,
    writeSync,
    removeSync,
    list,
    getDoc,
    put,
    clear,
  };
})();
