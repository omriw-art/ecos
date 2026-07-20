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
//
// Perspective Becomes Derived (B4): the *default* lens for a fresh session
// is derived from EcosSession's active membership role, when session
// primitives are loaded — no more hardcoded "admin" default. The setters
// (setPerspective / setActingCompanyId / reset) are operator/dev "view-as"
// only, gated on EcosSession's isOperator flag — this is still not a
// permission check (there is no non-operator identity in the local demo
// today, so this gate is currently a no-op in practice), it only wires the
// mechanism so a future non-operator user is blocked from widening their own
// view the moment real identities exist. setActingCompanyId also no longer
// accepts an arbitrary string — it's validated against CompanyStore.

(function () {
  if (window.EcosPerspective) return;

  const KEY = "ecosystemOS.perspective.v1";
  const PERSPECTIVES = ["admin", "company", "partner"];
  const listeners = new Set();

  function isOperator() {
    const session = window.EcosSession;
    if (!session) return true; // no session primitives loaded — preserve prior unrestricted demo behavior
    const user = session.getUser();
    return !!(user && user.isOperator);
  }

  function sessionDefaultPerspective() {
    const session = window.EcosSession;
    if (!session) return "admin";
    const roleKey = session.getActiveRoleKey();
    return PERSPECTIVES.indexOf(roleKey) !== -1 ? roleKey : "admin";
  }

  function isKnownCompanyId(id) {
    const store = window.CompanyStore;
    if (!store || typeof store.getCompanies !== "function") return true; // store not loaded yet — can't validate, accept as before
    return store.getCompanies().some((c) => c.id === id);
  }

  function normalize(raw) {
    const fallback = { perspective: sessionDefaultPerspective(), actingCompanyId: null };
    if (!raw || typeof raw !== "object") return fallback;
    const perspective = PERSPECTIVES.indexOf(raw.perspective) !== -1 ? raw.perspective : fallback.perspective;
    const actingCompanyId = (typeof raw.actingCompanyId === "string" && raw.actingCompanyId && isKnownCompanyId(raw.actingCompanyId))
      ? raw.actingCompanyId
      : null;
    return { perspective, actingCompanyId };
  }

  function read() {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch (err) {
      return { perspective: sessionDefaultPerspective(), actingCompanyId: null };
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

  // Operator/dev "view-as" only — see the B4 note at the top of this file.
  function setPerspective(perspective) {
    if (!isOperator()) return get();
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

  // Operator/dev "view-as" only. Validated against CompanyStore when it's
  // loaded — no longer accepts an arbitrary string. Still presentational:
  // a valid id only changes what the UI shows, never what a store allows.
  function setActingCompanyId(id) {
    if (!isOperator()) return get();
    const next = id ? String(id) : null;
    if (next && !isKnownCompanyId(next)) return get();
    state = { perspective: state.perspective, actingCompanyId: next };
    persist();
    emit();
    return get();
  }

  // Operator/dev "view-as" only — see the B4 note at the top of this file.
  function reset() {
    if (!isOperator()) return get();
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
