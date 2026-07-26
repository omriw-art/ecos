// ecos — deterministic fixtures/tests for the Growth Tools sync foundation
// (G3A). Plain Node, no test framework, no dependencies, no network. Run:
//   node scripts/test-growth-tools-sync.js
//
// Loads the real growth-tools-store.js/growth-tools-adapters.js under a
// minimal `window` shim (the same technique used throughout this project's
// ad-hoc validation scripts) so tests run against real Growth Tool records,
// not synthetic stand-ins.

const path = require("path");

global.window = {};
require(path.join(__dirname, "..", "src", "services", "growth-tools-store.js"));
require(path.join(__dirname, "..", "src", "services", "growth-tools-adapters.js"));
require(path.join(__dirname, "..", "src", "services", "growth-tools-sync-service.js"));

const Store = window.GrowthToolsStore;
const Adapters = window.GrowthToolsAdapters;
const Sync = window.GrowthToolsSyncService;

let failures = 0;
function check(label, condition) {
  if (condition) {
    console.log("  ok   " + label);
  } else {
    console.log("  FAIL " + label);
    failures++;
  }
}
function section(title) {
  console.log("\n=== " + title + " ===");
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const allTools = Store.getGrowthTools();
const preseed = allTools.find((t) => t.id === "gt-iia-preseed");
const roundA = allTools.find((t) => t.id === "gt-iia-round-a");

// ---------------------------------------------------------------------
section("Baseline sanity (must hold before/after this whole batch)");
check("21 tools present", allTools.length === 21);
check("unique ids", new Set(allTools.map((t) => t.id)).size === 21);
check("gt-iia-preseed found", !!preseed);
check("preseed status/deadline/applicationUrl/officialName all null (no fabrication)",
  preseed.status === null && preseed.deadline === null && preseed.applicationUrl === null && preseed.officialName === null);

// ---------------------------------------------------------------------
section("A. candidate changes deadline");
{
  const candidate = Sync.normalizeCandidate({ toolId: preseed.id, providerId: "innovation-authority", deadline: "2026-09-30" });
  const validity = Sync.validateCandidate({ toolId: preseed.id, providerId: "innovation-authority", deadline: "2026-09-30" }, preseed);
  const diff = Sync.diffCandidate(preseed, candidate);
  check("candidate valid", validity.valid);
  check("diff proposes deadline change", deepEqual(diff.changes.deadline, { from: null, to: "2026-09-30" }));
  check("no other fields changed", Object.keys(diff.changes).length === 1);
}

// ---------------------------------------------------------------------
section("B. candidate changes applicationUrl");
{
  const raw = { toolId: preseed.id, providerId: "innovation-authority", applicationUrl: "https://innovationisrael.org.il/apply/preseed" };
  const validity = Sync.validateCandidate(raw, preseed);
  const candidate = Sync.normalizeCandidate(raw);
  const diff = Sync.diffCandidate(preseed, candidate);
  check("candidate valid", validity.valid);
  check("diff proposes applicationUrl change", diff.changes.applicationUrl && diff.changes.applicationUrl.to === raw.applicationUrl);
}

// ---------------------------------------------------------------------
section("C. candidate has no deadline -> existing deadline preserved (absence != deletion)");
{
  // Simulate a tool that already has a known deadline from a prior sync.
  const toolWithDeadline = Object.assign({}, preseed, { deadline: "2026-01-01" });
  const raw = { toolId: preseed.id, providerId: "innovation-authority", status: "open" }; // no deadline key at all
  const candidate = Sync.normalizeCandidate(raw);
  check("candidate.deadline normalizes to null (no signal)", candidate.deadline === null);
  const diff = Sync.diffCandidate(toolWithDeadline, candidate);
  check("deadline NOT proposed for change", !diff.changes.deadline);
  check("deadline listed as unchanged", diff.unchanged.indexOf("deadline") !== -1);
}

// ---------------------------------------------------------------------
section("D. candidate with invalid status -> rejected");
{
  const raw = { toolId: preseed.id, providerId: "innovation-authority", status: "maybe-open-ish" };
  const validity = Sync.validateCandidate(raw, preseed);
  check("invalid status rejected", !validity.valid);
  check("error mentions status vocabulary", validity.errors.some((e) => e.indexOf("status") !== -1));
}

// ---------------------------------------------------------------------
section("E. candidate for wrong provider -> rejected");
{
  const raw = { toolId: roundA.id, providerId: "rakia", status: "open" }; // roundA belongs to innovation-authority
  const validity = Sync.validateCandidate(raw, roundA);
  check("provider mismatch rejected", !validity.valid);
  check("error mentions provider mismatch", validity.errors.some((e) => e.indexOf("provider mismatch") !== -1));
}

// ---------------------------------------------------------------------
section("F. approved merge changes source-owned fields but preserves managed metadata");
{
  const raw = { toolId: preseed.id, providerId: "innovation-authority", status: "open", deadline: "2026-09-30", applicationUrl: "https://innovationisrael.org.il/apply/preseed" };
  const validity = Sync.validateCandidate(raw, preseed);
  const candidate = Sync.normalizeCandidate(raw);
  const diff = Sync.diffCandidate(preseed, candidate);
  const merged = Sync.applyMerge(preseed, diff, { syncedAt: "2026-07-26T00:00:00.000Z" });
  check("candidate valid", validity.valid);
  check("merged.status updated", merged.status === "open");
  check("merged.deadline updated", merged.deadline === "2026-09-30");
  check("merged.applicationUrl updated", merged.applicationUrl === raw.applicationUrl);
  check("merged.syncStatus = ok", merged.syncStatus === "ok");
  check("merged.lastSyncedAt set", merged.lastSyncedAt === "2026-07-26T00:00:00.000Z");
  check("purposes preserved", deepEqual(merged.purposes, preseed.purposes));
  check("stages preserved", deepEqual(merged.stages, preseed.stages));
  check("domains preserved", deepEqual(merged.domains, preseed.domains));
  check("type preserved", merged.type === preseed.type);
  check("id/name/provider/division/description preserved",
    merged.id === preseed.id && merged.name === preseed.name &&
    deepEqual(merged.provider, preseed.provider) && merged.division === preseed.division &&
    merged.description === preseed.description);
  check("original tool object not mutated", preseed.status === null && preseed.deadline === null);
}

// ---------------------------------------------------------------------
section("G. malformed URL -> rejected");
{
  const raw = { toolId: preseed.id, providerId: "innovation-authority", applicationUrl: "not a url" };
  const validity = Sync.validateCandidate(raw, preseed);
  check("malformed applicationUrl rejected", !validity.valid);
  check("error mentions URL", validity.errors.some((e) => e.indexOf("URL") !== -1));
}

// ---------------------------------------------------------------------
section("H. unchanged candidate -> empty/no-op diff");
{
  const toolWithValues = Object.assign({}, preseed, { status: "open", deadline: "2026-09-30", applicationUrl: "https://x.example/apply" });
  const raw = { toolId: preseed.id, providerId: "innovation-authority", status: "open", deadline: "2026-09-30", applicationUrl: "https://x.example/apply" };
  const candidate = Sync.normalizeCandidate(raw);
  const diff = Sync.diffCandidate(toolWithValues, candidate);
  check("no changes proposed", Object.keys(diff.changes).length === 0);
  check("all compared fields listed as unchanged", diff.unchanged.length >= 3);
}

// ---------------------------------------------------------------------
section("I. adapter attempts to update a managed field -> rejected");
{
  const raw = { toolId: preseed.id, providerId: "innovation-authority", type: "funding-plus", status: "open" };
  const validity = Sync.validateCandidate(raw, preseed);
  check("managed-field tamper rejected", !validity.valid);
  check("error names the field", validity.errors.some((e) => e.indexOf('"type"') !== -1));
}

// ---------------------------------------------------------------------
section("J. toolId does not resolve -> rejected");
{
  const raw = { toolId: "gt-does-not-exist", providerId: "innovation-authority", status: "open" };
  const validity = Sync.validateCandidate(raw, null);
  check("unresolved toolId rejected", !validity.valid);
}

// ---------------------------------------------------------------------
section("K. adapter registry");
{
  const fixture = Adapters.get("manual-fixture");
  check("manual fixture adapter registered", !!fixture);
  check("fixture has correct providerId", fixture.providerId === "innovation-authority");
  check("byProvider returns it", Adapters.byProvider("innovation-authority").some((a) => a.id === "manual-fixture"));
}

// ---------------------------------------------------------------------
section("L. end-to-end through the fixture adapter (no network, synchronous fixture data)");
{
  const fixture = Adapters.get("manual-fixture");
  fixture.fetch().then((raw) => {
    const rawCandidates = fixture.normalize(raw);
    const rawCandidate = rawCandidates[0];
    const currentTool = allTools.find((t) => t.id === rawCandidate.toolId);
    const validity = Sync.validateCandidate(rawCandidate, currentTool);
    const candidate = Sync.normalizeCandidate(rawCandidate);
    const diff = Sync.diffCandidate(currentTool, candidate);
    check("fixture candidate valid", validity.valid);
    check("fixture candidate produces a real diff", Object.keys(diff.changes).length > 0);

    // ---------------------------------------------------------------
    console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
    process.exit(failures === 0 ? 0 : 1);
  });
}
