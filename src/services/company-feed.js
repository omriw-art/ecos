// ecos — Company Feed read-model (Company Feed v1, F1).
//
// Pure selector: composes existing service-layer globals (NeedsStore,
// GrowthToolsStore, MatchEngine) into one normalized, deterministically
// ordered list. No writes, no direct storage access, no new storage key,
// no new data shape persisted anywhere — every returned item wraps an
// existing record via `raw`.
//
// Ranking is deterministic keyword/capability overlap via the same
// MatchEngine.rankOrganizationsForNeed already used by the Needs Board and
// Company overview's "relevant needs" card — no AI, no randomness, no
// Date.now() in the ordering. Same input data always produces the same
// order.
//
// Deliberately excluded from v1, as a product boundary, not a scope cut:
//   - "recommended partners / similar organizations" — ranking peer orgs by
//     overlap would disclose competitive positioning to the viewing
//     company; that is a competitive-intelligence leak, not a feed item.
//   - "admin-curated updates" — no store emits real announcement content
//     with a genuine timestamp, so there is nothing honest to show.
// Growth tools are a static seed catalog with no per-company relevance
// signal and no real timestamp — they are never scored, never claimed to
// be "new" or "trending", and always sort after every ranked item.

(function () {
  if (window.CompanyFeed) return;

  const MIN_MATCH_SCORE = 15;

  function toArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function confidenceRank(confidence) {
    if (confidence === "high") return 2;
    if (confidence === "medium") return 1;
    if (confidence === "low") return 0;
    return -1;
  }

  function priorityRank(priority) {
    if (priority === "high") return 2;
    if (priority === "medium") return 1;
    if (priority === "low") return 0;
    return -1;
  }

  // Score a single need/opportunity record against one company, reusing
  // the exact primitive the Needs Board and "relevant needs" card already
  // trust — no separate scoring path, no fabricated confidence.
  function scoreForCompany(need, company) {
    if (!window.MatchEngine || typeof window.MatchEngine.rankOrganizationsForNeed !== "function") return null;
    const matchText = [need.title, need.description].filter(Boolean).join(" ");
    if (!matchText.trim()) return null;
    const ranked = window.MatchEngine.rankOrganizationsForNeed(matchText, [company], { minScore: MIN_MATCH_SCORE });
    return ranked.length ? ranked[0] : null;
  }

  function needSourceLabel(need) {
    if (need.sourceOrgName) return `צורך של ${need.sourceOrgName}`;
    if (need.sourceLabel) return need.sourceLabel;
    return "צורך פנימי";
  }

  function opportunitySourceLabel(opportunity) {
    return opportunity.sourceOrgName ? `מקור: ${opportunity.sourceOrgName}` : "הזדמנות מקומית מהאקו-סיסטם";
  }

  // Relevant needs — reuses the same "relevant needs" logic already
  // trusted in the Company overview: only needs the engine can honestly
  // score above the threshold are included. Own needs and closed ("done")
  // needs are excluded, matching existing behavior. Opportunities are a
  // separate feed item type (below) so they are excluded here to avoid
  // showing the same record twice as two different feed items.
  function relevantNeedItems(company, allNeeds) {
    const items = [];
    allNeeds.forEach((need) => {
      if (need.sourceType === "opportunity") return;
      if (need.sourceOrgId === company.id) return;
      if (need.status === "done") return;
      const match = scoreForCompany(need, company);
      if (!match) return;
      items.push({
        id: `need:${need.id}`,
        type: "need",
        title: need.title,
        subtitle: need.needType || null,
        sourceLabel: needSourceLabel(need),
        score: match.score,
        confidence: match.confidence,
        createdAt: need.createdAt || null,
        ranked: true,
        reasons: match.reasons || [],
        actions: ["view"],
        raw: need,
      });
    });
    return items;
  }

  // Ecosystem opportunities — unlike relevant needs, opportunities are
  // browsable local inventory (the existing "ecosystem opportunities"
  // card shows all of them, not only strong matches), so an opportunity
  // the engine can't score above threshold still appears — honestly
  // marked ranked:false / score:null, never a fabricated number.
  function opportunityItems(company, allNeeds) {
    const items = [];
    allNeeds.forEach((need) => {
      if (need.sourceType !== "opportunity") return;
      if (need.sourceOrgId === company.id) return;
      const match = scoreForCompany(need, company);
      items.push({
        id: `opp:${need.id}`,
        type: "opportunity",
        title: need.title,
        subtitle: need.needType || null,
        sourceLabel: opportunitySourceLabel(need),
        score: match ? match.score : null,
        confidence: match ? match.confidence : null,
        createdAt: need.createdAt || null,
        ranked: !!match,
        reasons: match ? (match.reasons || []) : [],
        actions: ["view", "mark-interest"],
        raw: need,
      });
    });
    return items;
  }

  // Growth tools — static seed catalog, no per-company relevance signal,
  // no real timestamp. Always ranked:false / score:null / createdAt:null;
  // never interleaved with ranked items, never implied to be "new".
  function growthToolItems() {
    if (!window.GrowthToolsStore || typeof window.GrowthToolsStore.getGrowthTools !== "function") return [];
    return window.GrowthToolsStore.getGrowthTools().map((tool) => ({
      id: `tool:${tool.id}`,
      type: "growth-tool",
      title: tool.title,
      subtitle: tool.provider || null,
      sourceLabel: "קטלוג דמו מקומי · לא בדיקת זכאות",
      score: null,
      confidence: null,
      createdAt: null,
      ranked: false,
      reasons: [],
      actions: ["view"],
      raw: tool,
    }));
  }

  // Deterministic comparator for Partition A (ranked items): score desc,
  // then confidence desc, then real createdAt newer-first, then real
  // priority desc, then stable id. Sector/segment overlap is not scored
  // separately here — it already feeds into MatchEngine's own score, and
  // adding a second, independent overlap signal would be a second scoring
  // path inconsistent with the one the rest of the app trusts.
  function compareRanked(a, b) {
    if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
    const confDiff = confidenceRank(b.confidence) - confidenceRank(a.confidence);
    if (confDiff !== 0) return confDiff;
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    const aPriority = a.raw ? priorityRank(a.raw.priority) : -1;
    const bPriority = b.raw ? priorityRank(b.raw.priority) : -1;
    if (bPriority !== aPriority) return bPriority - aPriority;
    return a.id.localeCompare(b.id);
  }

  // Stable order for Partition B (unranked catalog): curated seed order
  // first, then title — no rank badge is ever implied by this ordering.
  function compareUnranked(a, b) {
    return a.title.localeCompare(b.title);
  }

  function listCompanyFeed(company, opts) {
    const options = opts || {};
    const includeTypes = Array.isArray(options.types) ? new Set(options.types) : null;
    if (!company || !company.id) return [];
    if (!window.NeedsStore || typeof window.NeedsStore.listNeeds !== "function") return [];

    const allNeeds = toArray(window.NeedsStore.listNeeds());

    let ranked = []
      .concat(includeTypes && !includeTypes.has("need") ? [] : relevantNeedItems(company, allNeeds))
      .concat(includeTypes && !includeTypes.has("opportunity") ? [] : opportunityItems(company, allNeeds));
    ranked = ranked.slice().sort(compareRanked);

    let unranked = includeTypes && !includeTypes.has("growth-tool") ? [] : growthToolItems();
    unranked = unranked.slice().sort(compareUnranked);

    // limit caps ranked (Partition A) items only — it must never crowd out
    // the growth-tools catalog just because the ranked count happens to
    // reach the cap first; the two partitions answer different questions
    // ("best matches" vs. "the full reference catalog").
    if (typeof options.limit === "number") {
      ranked = ranked.slice(0, options.limit);
    }
    return ranked.concat(unranked);
  }

  window.CompanyFeed = {
    listCompanyFeed,
  };
})();
