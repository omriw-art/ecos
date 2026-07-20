// ecos — promise-based repository seam. Not yet consumed by any store (that
// migration is later, scoped work) — exists now so future backend-readiness
// work has a stable interface to target. Backed today by EcosLocalAdapter;
// a future EcosRemoteAdapter would implement the same shape.

(function () {
  if (window.EcosRepo) return;

  function forCollection(key) {
    const adapter = window.EcosLocalAdapter;

    return {
      list() {
        return adapter.list(key);
      },
      get(id) {
        return adapter.list(key).then((items) => items.find((item) => item.id === id) || null);
      },
      put(record) {
        return adapter.list(key).then((items) => {
          const next = items.filter((item) => item.id !== record.id);
          next.unshift(record);
          return adapter.put(key, next).then(() => record);
        });
      },
      putAll(records) {
        return adapter.put(key, records);
      },
      remove(id) {
        return adapter.list(key).then((items) => {
          const next = items.filter((item) => item.id !== id);
          return adapter.put(key, next).then(() => next);
        });
      },
      clear() {
        return adapter.clear(key);
      },
      seed(defaults) {
        return adapter.list(key).then((items) => {
          if (items.length) return items;
          return adapter.put(key, defaults).then(() => defaults);
        });
      },
    };
  }

  function forDoc(key) {
    const adapter = window.EcosLocalAdapter;

    return {
      get(fallback) {
        return adapter.getDoc(key, fallback);
      },
      put(value) {
        return adapter.put(key, value);
      },
      clear() {
        return adapter.clear(key);
      },
    };
  }

  window.EcosRepo = {
    for: forCollection,
    forDoc: forDoc,
  };
})();
