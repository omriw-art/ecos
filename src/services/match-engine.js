// ecos — deterministic explainable company match engine.
// Scores current company records without AI, backend calls, or randomness.

(function () {
  const STOPWORDS = new Set(["and", "or", "the", "for", "with", "from", "into", "של", "עם", "את", "על", "ו"]);

  function toArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function getCompanyName(company) {
    return String(company && company.name || "Unnamed company");
  }

  function getCompanyNeeds(company) {
    return toArray(company && company.needs);
  }

  function getCompanyOffers(company) {
    return []
      .concat(toArray(company && company.offers))
      .concat(toArray(company && company.solutions))
      .concat(toArray(company && company.tech))
      .concat(toArray(company && company.capabilities));
  }

  function tokens(values) {
    return new Set(toArray(values).join(" ").toLowerCase()
      .split(/[^a-z0-9\u0590-\u05ff]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)));
  }

  function intersect(a, b) {
    return Array.from(a).filter((item) => b.has(item));
  }

  function capabilityIds(company) {
    if (!window.CapabilityRegistry) return toArray(company && company.sectors);
    return window.CapabilityRegistry.getCompanyCapabilityIds(company);
  }

  function capabilityLabels(ids) {
    const definitions = new Map((window.CapabilityRegistry ? window.CapabilityRegistry.getAllCapabilities() : [])
      .map((cap) => [cap.id, cap.name || cap.id]));
    return toArray(ids).map((id) => definitions.get(id) || id);
  }

  function confidence(score) {
    if (score >= 75) return "high";
    if (score >= 50) return "medium";
    return "low";
  }

  function readinessBonus(a, b) {
    const ready = new Set(["Active", "Strategic", "Verified", "Commercial", "Defense Cleared", "Pilot Ready"]);
    return ready.has(a && a.readiness) || ready.has(b && b.readiness) ? 6 : 0;
  }

  function stageBonus(a, b) {
    const mature = new Set(["Series B", "Series C", "Growth", "Public"]);
    return mature.has(a && a.stage) || mature.has(b && b.stage) ? 4 : 0;
  }

  function complementaryPairs(source, target) {
    const sourceNeeds = getCompanyNeeds(source);
    const targetOffers = getCompanyOffers(target);
    const sourceNeedTokens = tokens(sourceNeeds);
    const targetOfferTokens = tokens(targetOffers);
    const overlap = intersect(sourceNeedTokens, targetOfferTokens);
    if (!overlap.length) return [];
    return sourceNeeds.slice(0, 3).map((need) => ({
      need,
      offer: targetOffers.find((offer) => overlap.some((token) => normalizeText(offer).includes(token))) || targetOffers[0] || "",
    })).filter((pair) => pair.need && pair.offer);
  }

  function scoreCompanyPair(source, target, options) {
    const opts = Object.assign({ sharedWeight: 14, complementWeight: 12, keywordWeight: 2, limitReasons: 4 }, options || {});
    const sourceCaps = capabilityIds(source);
    const targetCaps = capabilityIds(target);
    const sharedCapabilityIds = sourceCaps.filter((id) => targetCaps.includes(id));
    const complementary = complementaryPairs(source, target);
    const reverseComplementary = complementaryPairs(target, source);

    const sourceCorpus = []
      .concat(getCompanyOffers(source), getCompanyNeeds(source), toArray(source && source.sectors), toArray(source && source.tags));
    const targetCorpus = []
      .concat(getCompanyOffers(target), getCompanyNeeds(target), toArray(target && target.sectors), toArray(target && target.tags));
    const keywordOverlap = intersect(tokens(sourceCorpus), tokens(targetCorpus));

    let rawScore = 0;
    rawScore += Math.min(42, sharedCapabilityIds.length * opts.sharedWeight);
    rawScore += Math.min(30, complementary.length * opts.complementWeight);
    rawScore += Math.min(18, reverseComplementary.length * 6);
    rawScore += Math.min(18, keywordOverlap.length * opts.keywordWeight);
    rawScore += readinessBonus(source, target);
    rawScore += stageBonus(source, target);

    const reasons = [];
    if (sharedCapabilityIds.length) reasons.push(`Shared capabilities: ${capabilityLabels(sharedCapabilityIds).slice(0, 3).join(", ")}`);
    if (complementary.length) reasons.push(`${getCompanyName(target)} offers signals matching ${getCompanyName(source)} needs`);
    if (reverseComplementary.length) reasons.push(`${getCompanyName(source)} may answer needs from ${getCompanyName(target)}`);
    if (keywordOverlap.length) reasons.push(`Keyword overlap: ${keywordOverlap.slice(0, 5).join(", ")}`);
    if (readinessBonus(source, target)) reasons.push("At least one side has readiness suitable for active collaboration");
    if (stageBonus(source, target)) reasons.push("Maturity/stage signal supports a practical partnership");

    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    return {
      id: `${source.id || getCompanyName(source)}__${target.id || getCompanyName(target)}`,
      source,
      target,
      targetNeed: complementary[0] ? complementary[0].need : "",
      score,
      confidence: confidence(score),
      reasons: reasons.slice(0, opts.limitReasons),
      sharedCapabilities: capabilityLabels(sharedCapabilityIds),
      sharedCapabilityIds,
      complementaryNeedsOffers: complementary.concat(reverseComplementary).slice(0, 4),
      keywordOverlap: keywordOverlap.slice(0, 8),
    };
  }

  function generateCompanyMatches(companies, options) {
    const list = toArray(companies).filter((company) => company && company.id && getCompanyName(company));
    const opts = Object.assign({ limit: 20, minScore: 20 }, options || {});
    const matches = [];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = 0; j < list.length; j += 1) {
        if (i === j) continue;
        const match = scoreCompanyPair(list[i], list[j], opts);
        if (match.score >= opts.minScore) matches.push(match);
      }
    }
    return matches
      .sort((a, b) => b.score - a.score || getCompanyName(a.source).localeCompare(getCompanyName(b.source)))
      .slice(0, opts.limit);
  }

  function generateMatchesForCompany(company, companies, options) {
    const list = toArray(companies).filter((candidate) => candidate && candidate.id && candidate.id !== company.id);
    const opts = Object.assign({ limit: 8, minScore: 10 }, options || {});
    return list
      .map((candidate) => scoreCompanyPair(company, candidate, opts))
      .filter((match) => match.score >= opts.minScore)
      .sort((a, b) => b.score - a.score || getCompanyName(a.target).localeCompare(getCompanyName(b.target)))
      .slice(0, opts.limit);
  }

  window.MatchEngine = {
    normalizeText,
    toArray,
    getCompanyName,
    getCompanyNeeds,
    getCompanyOffers,
    scoreCompanyPair,
    generateCompanyMatches,
    generateMatchesForCompany,
  };
})();
