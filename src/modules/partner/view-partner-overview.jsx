// ecos — Partner perspective overview (Partner Environment v1).
// A lightweight, partner-facing landing surface. Partner is NOT a new
// entity/store — it's a lens over CompanyStore filtered by organizationType.
// Reuses existing stores/views; no new data shapes, no new storage keys, no
// store branching on perspective. Perspective only selects WHAT is shown; it
// is never permission.

const PARTNER_ORG_TYPES = new Set(["investor", "accelerator", "academic", "research", "government", "service-provider", "nonprofit"]);
const PARTNER_NEED_TYPES = new Set(["partner", "pilot", "customer", "research", "challenge"]);
// Opportunity publishing (v1) reuses NeedsStore as-is — no schema change.
// sourceType "opportunity" already exists in the store; publishing here just
// writes through the same createNeed() the admin needs board uses.
const OPPORTUNITY_NEED_TYPES = ["pilot", "partner", "research", "customer"];
const OPPORTUNITY_FORM_DEFAULTS = { title: "", description: "", needType: "partner", priority: "medium" };
// Aligned with the same "not externally distributed" phrasing used
// everywhere else this concept appears (Company overview, Opportunity
// Detail, DemoTag badges) — was previously "לא הופץ לגורמים חיצוניים" here
// only, a different wording for the same fact (Opportunity Language
// Consistency v1).
const LOCAL_DEMO_NOTE = "נשמר מקומית בדמו · לא הופץ מחוץ למערכת";

// Preferred demo default when no acting partner org is chosen yet — same
// deliberate-pick convention as APP_PREFERRED_DEFAULT_COMPANY_IDS/
// PREFERRED_DEFAULT_COMPANY_IDS (view-company-overview.jsx etc.) for the
// Company-perspective "acting company", just for the Partner side: Rakia is
// a clear, recognizable example partner org, not whichever nonprofit
// happens to be first in the seed array by accident (that was previously
// SpaceIL). Rakia's organizationType is "nonprofit" — a partner-like type,
// never eligible as an "acting company" in the Company-perspective
// resolvers, which is why this list lives here and not there. Falls
// through safely to eligible[0] if "rakia" doesn't exist.
const PARTNER_PREFERRED_DEFAULT_ORG_IDS = ["rakia"];
function preferredDefaultPartnerOrg(eligible) {
  for (const id of PARTNER_PREFERRED_DEFAULT_ORG_IDS) {
    const found = eligible.find((c) => c.id === id);
    if (found) return found;
  }
  return null;
}

function resolvePartnerOrg(companies, actingCompanyId) {
  // Prefer the selected acting org, but only if it's actually partner-like —
  // EcosPerspective.actingCompanyId is shared across company/partner (see
  // perspective.js), so it may point at a plain company selected in the other
  // perspective. Falls back to the deliberate default above, then the
  // deterministic first match.
  const eligible = companies.filter((c) => PARTNER_ORG_TYPES.has(c.organizationType));
  const acting = actingCompanyId ? eligible.find((c) => c.id === actingCompanyId) : null;
  return acting || preferredDefaultPartnerOrg(eligible) || eligible[0] || null;
}

function PartnerOverviewView({ onNav, onOpenCompany, onOpenOpportunity }) {
  const companies = window.CompanyStore ? window.CompanyStore.getCompanies() : (window.COMPANIES || []);
  // Local mirror of EcosPerspective.actingCompanyId — see the same pattern in
  // view-company-overview.jsx for why a plain useMemo isn't enough here.
  const [actingCompanyId, setActingCompanyId] = React.useState(
    () => (window.EcosPerspective ? window.EcosPerspective.get().actingCompanyId : null)
  );
  const partnerOrg = React.useMemo(() => resolvePartnerOrg(companies, actingCompanyId), [companies, actingCompanyId]);
  const partnerOptions = React.useMemo(
    () => companies.filter((c) => PARTNER_ORG_TYPES.has(c.organizationType)),
    [companies]
  );
  const handleSelectPartner = (id) => {
    if (window.EcosPerspective) window.EcosPerspective.setActingCompanyId(id);
    setActingCompanyId(id || null);
  };

  const [showOpportunityForm, setShowOpportunityForm] = React.useState(false);
  const [opportunityForm, setOpportunityForm] = React.useState(OPPORTUNITY_FORM_DEFAULTS);
  const [opportunitiesVersion, setOpportunitiesVersion] = React.useState(0);
  const setOpportunityField = (key, value) => setOpportunityForm((f) => Object.assign({}, f, { [key]: value }));

  const publishedOpportunities = React.useMemo(() => {
    if (!window.NeedsStore) return [];
    const orgId = partnerOrg ? partnerOrg.id : null;
    return window.NeedsStore.listNeeds()
      .filter((n) => n.sourceType === "opportunity" && n.sourceOrgId === orgId)
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerOrg, opportunitiesVersion]);

  const submitOpportunity = (e) => {
    e.preventDefault();
    const title = opportunityForm.title.trim();
    if (!title || !window.NeedsStore) return;
    window.NeedsStore.createNeed({
      title,
      description: opportunityForm.description.trim(),
      needType: OPPORTUNITY_NEED_TYPES.includes(opportunityForm.needType) ? opportunityForm.needType : "partner",
      priority: opportunityForm.priority,
      sourceType: "opportunity",
      sourceOrganizationId: partnerOrg ? partnerOrg.id : null,
    });
    setOpportunityForm(OPPORTUNITY_FORM_DEFAULTS);
    setShowOpportunityForm(false);
    setOpportunitiesVersion((v) => v + 1);
  };

  // Partner Opportunity Management v1 — edit/remove the partner's own
  // published opportunities. Same NeedsStore.updateNeed/deleteNeed the admin
  // needs board already uses (view-needs.jsx); no new store, no schema
  // change, no confirm-dialog (this codebase has no such convention — admin
  // deletes are direct, same here).
  const [editingOpportunityId, setEditingOpportunityId] = React.useState(null);
  const [editForm, setEditForm] = React.useState(OPPORTUNITY_FORM_DEFAULTS);
  const setEditField = (key, value) => setEditForm((f) => Object.assign({}, f, { [key]: value }));

  const startEditOpportunity = (o) => {
    setEditingOpportunityId(o.id);
    setEditForm({
      title: o.title || "",
      description: o.description || "",
      needType: OPPORTUNITY_NEED_TYPES.includes(o.needType) ? o.needType : "partner",
      priority: o.priority || "medium",
    });
  };

  const saveEditOpportunity = (e) => {
    e.preventDefault();
    const title = editForm.title.trim();
    if (!title || !window.NeedsStore || !editingOpportunityId) return;
    window.NeedsStore.updateNeed(editingOpportunityId, {
      title,
      description: editForm.description.trim(),
      needType: OPPORTUNITY_NEED_TYPES.includes(editForm.needType) ? editForm.needType : "partner",
      priority: editForm.priority,
    });
    setEditingOpportunityId(null);
    setOpportunitiesVersion((v) => v + 1);
    window.toast && window.toast("השינויים נשמרו בדמו · לא הופצו מחוץ למערכת", "ok");
  };

  const removeOpportunity = (id) => {
    if (!window.NeedsStore) return;
    window.NeedsStore.deleteNeed(id);
    if (editingOpportunityId === id) setEditingOpportunityId(null);
    setOpportunitiesVersion((v) => v + 1);
    window.toast && window.toast("ההזדמנות הוסרה מהדמו · לא הופצה מחוץ למערכת", "ok");
  };

  const collaborationNeeds = React.useMemo(() => {
    if (!window.NeedsStore) return [];
    return window.NeedsStore.listNeeds().filter((n) => n.needType && PARTNER_NEED_TYPES.has(n.needType)).slice(0, 6);
    // Depends on opportunitiesVersion (not just mount) — a published/edited/
    // removed opportunity can share a needType with this list (e.g. "partner"),
    // so this must stay in sync with create/edit/delete, same as
    // publishedOpportunities below.
  }, [opportunitiesVersion]);

  const growthPreview = window.GrowthToolsStore ? window.GrowthToolsStore.getGrowthTools().slice(0, 3) : [];
  const collaborationCategories = Array.from(PARTNER_NEED_TYPES).map((needType) => ({
    value: needType,
    label: window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", needType) : needType,
  }));

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>סביבת שותף</h2>
          <div className="sub">תצוגת דמו · לא כניסת משתמש</div>
        </div>
      </div>

      {window.DemoFlowStrip && <window.DemoFlowStrip active="partner" />}

      {window.ActingOrgSelector && (
        <window.ActingOrgSelector
          label="שותף בתצוגה"
          options={partnerOptions.map((c) => ({ id: c.id, name: c.name }))}
          value={partnerOrg ? partnerOrg.id : ""}
          onChange={handleSelectPartner}
          emptyText="אין כרגע ארגוני שותפים לדוגמה במאגר המקומי."
        />
      )}

      {/* 1. סביבת שותף */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> מה זו סביבת השותף</div></div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.65 }}>
          תצוגה זו מיועדת לגופים כמו משקיעים, מאיצים, אקדמיה, מחקר, ממשל ונותני שירות המעורבים באקוסיסטם.
          זוהי תצוגת דמו בלבד — החלפת התצוגה אינה כניסת משתמש ואינה מעניקה הרשאות אמיתיות; כל הנתונים מוצגים מהמאגר המקומי.
        </div>
        {partnerOrg && (
          <div className="flex center gap-8 wrap" style={{ marginTop: 10 }}>
            <span className="pill">{window.orgTypeLabel ? window.orgTypeLabel(partnerOrg.organizationType) : partnerOrg.organizationType}</span>
          </div>
        )}
      </div>

      {/* 2. פרופיל השותף */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot" /> פרופיל השותף</div></div>
        {!partnerOrg ? (
          <div className="muted" style={{ padding: "8px 0" }}>לא נמצא ארגון שותף לדוגמה במאגר המקומי כרגע.</div>
        ) : (
          <div className="flex gap-14" style={{ alignItems: "flex-start" }}>
            <window.CoLogo company={partnerOrg} size={44} />
            <div className="col grow" style={{ minWidth: 0, gap: 6 }}>
              <div className="flex center gap-8 wrap">
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{partnerOrg.name}</div>
                <span className="pill">{window.orgTypeLabel ? window.orgTypeLabel(partnerOrg.organizationType) : partnerOrg.organizationType}</span>
              </div>
              {!!(partnerOrg.sectors && partnerOrg.sectors.length) && (
                <div className="flex gap-6 wrap">
                  {partnerOrg.sectors.slice(0, 4).map((s) => <window.SectorPill key={s} id={s} />)}
                </div>
              )}
              {!!partnerOrg.blurb && <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.55 }}>{partnerOrg.blurb}</div>}
              <button className="btn btn-ghost" style={{ fontSize: 12.5, alignSelf: "flex-start" }} onClick={() => onOpenCompany && onOpenCompany(partnerOrg.id)}>
                פתח פרופיל מלא ←
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. הזדמנויות לפרסום — small local-only publishing flow, no real distribution */}
      <div className="card">
        <div className="card-hd">
          <div className="flex center gap-8">
            <div className="card-title"><span className="dot amber" /> הזדמנויות לפרסום</div>
            {!!publishedOpportunities.length && <span className="pill">{publishedOpportunities.length}</span>}
          </div>
          {/* Golden-path entry point for the whole demo loop — primary emphasis
              when closed, ghost "cancel" emphasis once the form is open. */}
          <button type="button" className={showOpportunityForm ? "btn btn-ghost" : "btn btn-primary"} style={{ fontSize: 12.5 }} onClick={() => setShowOpportunityForm((v) => !v)}>
            {showOpportunityForm ? "ביטול" : "פרסמו הזדמנות חדשה"}
          </button>
        </div>
        <div className="flex center gap-6 wrap" style={{ marginBottom: 8 }}>
          {window.DemoTag && <window.DemoTag>נתוני דמו מקומיים</window.DemoTag>}
          {window.DemoTag && <window.DemoTag>לא הופץ מחוץ למערכת</window.DemoTag>}
        </div>
        <div className="muted tiny" style={{ marginBottom: showOpportunityForm ? 12 : 0 }}>
          פרסמו קול קורא, פיילוט, מעבדה פתוחה או צורך לשיתוף פעולה כהזדמנות דמו מקומית. {LOCAL_DEMO_NOTE}.
        </div>

        {showOpportunityForm && (
          <form className="col gap-8" onSubmit={submitOpportunity} style={{ marginTop: 4, marginBottom: 14, padding: 12, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 700 }}>כותרת</label>
              <input className="input" value={opportunityForm.title} onChange={(e) => setOpportunityField("title", e.target.value)}
                     placeholder="לדוגמה: קול קורא לפיילוט משותף" />
            </div>
            <div className="field">
              <label style={{ fontSize: 13, fontWeight: 700 }}>תיאור (אופציונלי)</label>
              <input className="input" value={opportunityForm.description} onChange={(e) => setOpportunityField("description", e.target.value)}
                     placeholder="פרטים נוספים על ההזדמנות" />
            </div>
            <div className="flex gap-8 wrap">
              <div className="field" style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>סוג</label>
                <select className="select" value={opportunityForm.needType} onChange={(e) => setOpportunityField("needType", e.target.value)}>
                  {OPPORTUNITY_NEED_TYPES.map((nt) => (
                    <option key={nt} value={nt}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", nt) : nt}</option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>עדיפות</label>
                <select className="select" value={opportunityForm.priority} onChange={(e) => setOpportunityField("priority", e.target.value)}>
                  {(window.NeedsStore ? window.NeedsStore.PRIORITIES : ["high", "medium", "low"]).map((p) => (
                    <option key={p} value={p}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("priority", p) : p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex center gap-8" style={{ marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={!opportunityForm.title.trim()}>
                <window.I.Plus size={13} /> פרסמו בדמו
              </button>
              <span className="muted tiny">{LOCAL_DEMO_NOTE}</span>
            </div>
          </form>
        )}

        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>הזדמנויות שפורסמו בדמו</div>
        {!publishedOpportunities.length ? (
          <div className="muted" style={{ padding: "6px 0" }}>
            טרם פורסמו הזדמנויות בדמו. הזדמנויות שתפרסמו כאן יופיעו גם ברשימה זו וגם בתצוגת חברה.
          </div>
        ) : (
          <>
            <div className="col gap-8">
              {publishedOpportunities.map((o) => (
                editingOpportunityId === o.id ? (
                  <form key={o.id} className="col gap-8" onSubmit={saveEditOpportunity}
                        style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                    <div className="field">
                      <label style={{ fontSize: 13, fontWeight: 700 }}>כותרת</label>
                      <input className="input" value={editForm.title} onChange={(e) => setEditField("title", e.target.value)} />
                    </div>
                    <div className="field">
                      <label style={{ fontSize: 13, fontWeight: 700 }}>תיאור (אופציונלי)</label>
                      <input className="input" value={editForm.description} onChange={(e) => setEditField("description", e.target.value)} />
                    </div>
                    <div className="flex gap-8 wrap">
                      <div className="field" style={{ flex: 1, minWidth: 160 }}>
                        <label style={{ fontSize: 13, fontWeight: 700 }}>סוג</label>
                        <select className="select" value={editForm.needType} onChange={(e) => setEditField("needType", e.target.value)}>
                          {OPPORTUNITY_NEED_TYPES.map((nt) => (
                            <option key={nt} value={nt}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", nt) : nt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ flex: 1, minWidth: 160 }}>
                        <label style={{ fontSize: 13, fontWeight: 700 }}>עדיפות</label>
                        <select className="select" value={editForm.priority} onChange={(e) => setEditField("priority", e.target.value)}>
                          {(window.NeedsStore ? window.NeedsStore.PRIORITIES : ["high", "medium", "low"]).map((p) => (
                            <option key={p} value={p}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("priority", p) : p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex center gap-8" style={{ marginTop: 4 }}>
                      <button type="submit" className="btn btn-primary" disabled={!editForm.title.trim()}>שמרו שינויים</button>
                      <button type="button" className="btn" onClick={() => setEditingOpportunityId(null)}>ביטול</button>
                      <span className="muted tiny">{LOCAL_DEMO_NOTE}</span>
                    </div>
                  </form>
                ) : (
                  <div key={o.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                    <div className="flex center between" style={{ gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{o.title}</div>
                      <span className="pill" style={{ fontSize: 10.5, flex: "none" }}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", o.needType) : o.needType}</span>
                    </div>
                    {!!o.description && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>{o.description}</div>}
                    <div className="muted tiny" style={{ marginTop: 6 }}>{LOCAL_DEMO_NOTE}</div>
                    {/* Aggregate-only signal — count, never names/contacts/scores/status.
                        Rendered as a pill (not plain text) so it reads at a glance during
                        a live demo walkthrough (Golden Path CTA Polish v1). Partner surfaces
                        must read this through partnerSignalFor, never through raw interest
                        records — see opportunity-interest-store.js for why. */}
                    <div style={{ marginTop: 6 }}>
                      {(() => {
                        const signal = window.OpportunityInterestStore ? window.OpportunityInterestStore.partnerSignalFor(o.id) : { count: 0 };
                        return signal.count > 0
                          ? <span className="pill violet">{`סומנו ${signal.count} התעניינויות בדמו`}</span>
                          : <span className="pill">עדיין לא סומנה התעניינות בדמו</span>;
                      })()}
                    </div>
                    <div className="flex center gap-8 wrap" style={{ marginTop: 6 }}>
                      <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => onOpenOpportunity && onOpenOpportunity(o.id)}>
                        פתח ←
                      </button>
                      <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => startEditOpportunity(o)}>
                        ערוך
                      </button>
                      <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => removeOpportunity(o.id)}>
                        הסר מהדמו
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
            <div className="muted tiny" style={{ marginTop: 10 }}>
              עברו לתצוגת חברה (למעלה, בבורר התצוגה) כדי לראות איך ההזדמנות מופיעה לצד הזדמנויות אחרות.
            </div>
          </>
        )}
      </div>

      {/* 4. צרכים ותחומי עניין */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot violet" /> צרכים ותחומי עניין</div>
          {!!collaborationNeeds.length && <span className="pill">{collaborationNeeds.length}</span>}
        </div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>צרכים מהמאגר המקומי הרלוונטיים לשיתוף פעולה, פיילוטים ומחקר · ללא AI</div>
        {!collaborationNeeds.length ? (
          <div className="muted" style={{ padding: "8px 0" }}>לא נמצאו כרגע צרכים רלוונטיים לשיתוף פעולה במאגר המקומי.</div>
        ) : (
          <div className="col gap-8">
            {collaborationNeeds.map((n) => (
              <div key={n.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{n.title}</div>
                <div className="flex center gap-6 wrap" style={{ marginTop: 4 }}>
                  <span className="pill" style={{ fontSize: 10.5 }}>{window.TaxonomyStore ? window.TaxonomyStore.labelFor("needType", n.needType) : n.needType}</span>
                  {n.sourceOrgName && <span className="mono tiny" style={{ color: "var(--text-4)" }}>{n.sourceOrgName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. שיתופי פעולה */}
      <div className="card">
        <div className="card-hd"><div className="card-title"><span className="dot green" /> שיתופי פעולה</div></div>
        <div className="muted tiny" style={{ marginBottom: 8 }}>קטגוריות שיתוף פעולה נפוצות באקוסיסטם המקומי</div>
        <div className="flex gap-6 wrap" style={{ marginBottom: 12 }}>
          {collaborationCategories.map((c) => <span key={c.value} className="pill">{c.label}</span>)}
        </div>
        <div className="divider" />
        <div className="col gap-8" style={{ marginTop: 10 }}>
          {/* Growth Tools has its own dedicated entry point in the "קטלוג
              משאבים" card directly below — not repeated here to avoid a
              confusing duplicate CTA to the same destination. */}
          <button type="button" className="btn" style={{ justifyContent: "flex-start" }} onClick={() => onNav && onNav("needs")}>
            <window.I.Compass size={13} /> עברו ללוח הצרכים לבדיקת פרטים נוספים
          </button>
        </div>
      </div>

      {/* 6. הזדמנויות צמיחה — read-only reference preview, shared with Company */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title"><span className="dot amber" /> קטלוג משאבים</div>
          <button type="button" className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => onNav && onNav("growth-tools")}>
            לכל ההזדמנויות ←
          </button>
        </div>
        <div className="flex center gap-6 wrap" style={{ marginBottom: 8 }}>
          {window.DemoTag && <window.DemoTag>קטלוג אוצר קבוע</window.DemoTag>}
          {window.DemoTag && <window.DemoTag>לא בדיקת זכאות</window.DemoTag>}
        </div>
        <div className="muted tiny" style={{ marginBottom: 10 }}>
          קטלוג אחיד לכולם, שונה מהזדמנויות שפורסמו על ידי שותפים למעלה. {window.GROWTH_DISCLAIMER || "מאגר הפניות אוצר לצורכי הדגמה · אינו בדיקת זכאות ואינו מחובר למערכות חיצוניות. אמתו מול הגוף הרלוונטי."}
        </div>
        {!growthPreview.length ? (
          <div className="muted" style={{ padding: "6px 0" }}>אין כרגע הזדמנויות צמיחה במאגר המקומי.</div>
        ) : (
          <div className="col gap-8">
            {growthPreview.map((g) => (
              <div key={g.id} style={{ padding: 10, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
                <div className="flex center between" style={{ gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{g.title}</div>
                  <span className="pill" style={{ fontSize: 10.5, flex: "none" }}>{g.category}</span>
                </div>
                <div className="mono tiny" style={{ color: "var(--text-4)", marginTop: 2 }}>{g.provider}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

window.PartnerOverviewView = PartnerOverviewView;
