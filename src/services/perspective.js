// ecos — product view "perspective" (view-as) for the demo.
// Exposes window.EcosPerspective. Distinct from window.EcosEnv:
//   EcosEnv     = deployment environment (local / preview / production).
//   EcosPerspective = which product lens the UI is viewed through
//                     (גוף מנהל / חברה / שותף).
//
// IMPORTANT: this is presentational only. All data ships to the browser and
// lives in one localStorage store; anyone can read every record via DevTools
// or by switching perspective. Perspective decides what the UI *shows* — it
// never decides what a user is *allowed to do*. Never read it as an
// authorization signal, and never branch a store read/write on it. Real
// authorization arrives only with a backend/auth layer.
//
// State is session-only (sessionStorage, its own key) so it can never corrupt
// the persistent data stores and resets cleanly when the tab closes.

(function () {
  if (window.EcosPerspective) return;

  const KEY = "ecosystemOS.perspective.v1";
  const PERSPECTIVES = ["admin", "company", "partner"];
  const listeners = new Set();

  function normalize(raw) {
    const fallback = { perspective: "admin", actingCompanyId: null };
    if (!raw || typeof raw !== "object") return fallback;
    const perspective = PERSPECTIVES.indexOf(raw.perspective) !== -1 ? raw.perspective : "admin";
    const actingCompanyId = typeof raw.actingCompanyId === "string" && raw.actingCompanyId ? raw.actingCompanyId : null;
    return { perspective, actingCompanyId };
  }

  function read() {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch (err) {
      return { perspective: "admin", actingCompanyId: null };
    }
  }

  let state = read();

  function persist() {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      // sessionStorage unavailable (private mode / disabled) — keep in-memory only.
    }
  }

  function get() {
    return { perspective: state.perspective, actingCompanyId: state.actingCompanyId };
  }

  function emit() {
    const snapshot = get();
    listeners.forEach((fn) => {
      try { fn(snapshot); } catch (err) { /* listener errors never break the switch */ }
    });
  }

  function setPerspective(perspective) {
    if (PERSPECTIVES.indexOf(perspective) === -1) return get();
    // actingCompanyId is only meaningful while acting as a company or partner
    // org (both resolve it against CompanyStore, each filtered to its own
    // eligible organizationType set) — cleared for admin, which has no acting
    // entity. Kept across company<->partner switches so a chosen org survives
    // a round trip through the other perspective for the same session.
    const actingCompanyId = (perspective === "company" || perspective === "partner") ? state.actingCompanyId : null;
    state = { perspective, actingCompanyId };
    persist();
    emit();
    return get();
  }

  function setActingCompanyId(id) {
    // Unvalidated on purpose — presentation only. Not checked against a real
    // company and never read as authorization; deeper use lands in a later batch.
    state = { perspective: state.perspective, actingCompanyId: id ? String(id) : null };
    persist();
    emit();
    return get();
  }

  function reset() {
    state = { perspective: "admin", actingCompanyId: null };
    persist();
    emit();
    return get();
  }

  function subscribe(fn) {
    if (typeof fn !== "function") return function () {};
    listeners.add(fn);
    return function () { listeners.delete(fn); };
  }

  window.EcosPerspective = {
    key: KEY,
    PERSPECTIVES,
    get,
    setPerspective,
    setActingCompanyId,
    reset,
    subscribe,
  };
})();
