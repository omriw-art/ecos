// ecos — deterministic fixtures/tests for Controlled Company Taxonomies v1
// (org-classification-registry.js + company-store.js decoupling +
// match-engine.js label-resolution compatibility layer). Plain Node, no
// test framework, no dependencies, no network. Run:
//   node scripts/test-org-classification.js

const path = require("path");

function makeMemoryLocalStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: (k) => { data.delete(k); },
  };
}

global.window = { localStorage: makeMemoryLocalStorage() };
window.COMPANIES = [
  { id: "ramon-space", name: "Ramon.Space", organizationType: "startup", membershipStatus: "unclaimed", sectors: ["earth-obs"] },
  { id: "orbit-fund", name: "Orbit Ventures", organizationType: "investor", membershipStatus: "unclaimed", sectors: ["earth-obs"], offers: ["Seed funding"] },
];

require(path.join(__dirname, "..", "src", "services", "storage.js"));
require(path.join(__dirname, "..", "src", "services", "local-adapter.js"));
require(path.join(__dirname, "..", "src", "services", "capability-registry.js"));
require(path.join(__dirname, "..", "src", "services", "org-classification-registry.js"));
require(path.join(__dirname, "..", "src", "services", "match-engine.js"));
require(path.join(__dirname, "..", "src", "services", "company-store.js"));
require(path.join(__dirname, "..", "src", "services", "submission-store.js"));
require(path.join(__dirname, "..", "src", "services", "company-account-store.js"));

const Registry = window.OrgClassificationRegistry;
const CompanyStore = window.CompanyStore;
const MatchEngine = window.MatchEngine;
const CompanyAccountStore = window.CompanyAccountStore;
const SubmissionStore = window.SubmissionStore;

let failures = 0;
function check(label, condition) {
  if (condition) console.log("  ok   " + label);
  else { console.log("  FAIL " + label); failures++; }
}
function section(title) { console.log("\n=== " + title + " ==="); }

// ---------------------------------------------------------------------
section("2-4. banks load");
{
  const caps = Registry.getBank("capabilities");
  const techs = Registry.getBank("technologies");
  const needs = Registry.getBank("needs");
  check("capabilities bank loads (13)", caps.length === 13);
  check("technologies bank loads (39)", techs.length === 39);
  check("needs bank loads (8)", needs.length === 8);
  check("capabilities ids unique", new Set(caps.map((o) => o.id)).size === caps.length);
  check("technologies ids unique", new Set(techs.map((o) => o.id)).size === techs.length);
  check("needs ids unique", new Set(needs.map((o) => o.id)).size === needs.length);
}

// ---------------------------------------------------------------------
section("1. sectors still work (unaffected by this batch)");
{
  const c = CompanyStore.createCompany({ name: "SectorCo", sectors: ["comms", "sar"] });
  check("multi-sector create works", JSON.stringify(c.sectors) === JSON.stringify(["comms", "sar"]));
}

// ---------------------------------------------------------------------
section("5-6. Admin selects multiple controlled values; save/reload persists");
let companyId;
{
  const c = CompanyStore.createCompany({
    name: "Multiband Systems",
    organizationType: "startup",
    capabilities: ["comms", "sar"],
    tech: ["phased-array-antenna", "sar-sensor"],
    needs: ["anchor-customer"],
  });
  companyId = c.id;
  check("capabilities saved as ids", JSON.stringify(c.capabilities) === JSON.stringify(["comms", "sar"]));
  check("technologies saved independently from capabilities", JSON.stringify(c.tech) === JSON.stringify(["phased-array-antenna", "sar-sensor"]));
  check("needs saved as ids", JSON.stringify(c.needs) === JSON.stringify(["anchor-customer"]));

  const reloaded = CompanyStore.getCompanies().find((x) => x.id === companyId);
  check("reload preserves capabilities", JSON.stringify(reloaded.capabilities) === JSON.stringify(["comms", "sar"]));
  check("reload preserves technologies", JSON.stringify(reloaded.tech) === JSON.stringify(["phased-array-antenna", "sar-sensor"]));
  check("reload preserves needs", JSON.stringify(reloaded.needs) === JSON.stringify(["anchor-customer"]));
}

// ---------------------------------------------------------------------
section("7. legacy/unknown values preserved safely");
{
  const legacy = CompanyStore.createCompany({
    name: "Legacy Co",
    capabilities: ["Some Old Free Text Capability", "comms"],
    needs: ["A legacy free-text need"],
  });
  check("unknown capability value preserved verbatim", legacy.capabilities.includes("Some Old Free Text Capability"));
  check("known capability id still present alongside it", legacy.capabilities.includes("comms"));
  check("unknown need value preserved verbatim", legacy.needs.includes("A legacy free-text need"));
  check("labelFor unknown value returns the raw value, not blank", Registry.labelFor("capabilities", "Some Old Free Text Capability") === "Some Old Free Text Capability");
}

// ---------------------------------------------------------------------
section("8. arbitrary free text cannot silently enter the approved bank");
{
  const before = Registry.getBank("capabilities").length;
  // isKnownId must reject anything not literally in the bank — proves the
  // Admin UI (TaxonomyPicker) has nothing it could call to "approve" a typed
  // value; only getBank()'s fixed list is ever offered as selectable.
  check("arbitrary text is not a known id", Registry.isKnownId("capabilities", "Some Old Free Text Capability") === false);
  check("bank size unchanged after encountering unknown values", Registry.getBank("capabilities").length === before);
}

// ---------------------------------------------------------------------
section("9. company offers no longer editable (Admin path)");
{
  // Simulates the Admin editor's submit patch for a company-type org: the
  // "offers" key must be entirely absent, and any pre-existing offers value
  // (e.g. from an approved submission) must survive an unrelated edit.
  const submitted = SubmissionStore.toCompanyInput(SubmissionStore.createSubmission({
    companyName: "Was A Submission", offers: ["Legacy offer from submission"],
  }));
  const c = CompanyStore.createCompany(submitted);
  check("submission-derived company keeps its offers at creation (unchanged path)", c.offers.includes("Legacy offer from submission"));

  // Admin patch WITHOUT an "offers" key (as the new CompanyEditor sends for
  // a company-type org) must not clear it.
  const patch = { capabilities: ["comms"], tech: ["ka-ku-band"], needs: [] };
  check("admin patch has no offers key", !Object.prototype.hasOwnProperty.call(patch, "offers"));
  const updated = CompanyStore.updateCompany(c.id, patch);
  check("offers preserved after an admin edit that omits the key", updated.offers.includes("Legacy offer from submission"));

  // A brand new company-type org created via the Admin editor (no offers key
  // at all) must default to empty, never fabricate offers.
  const fresh = CompanyStore.createCompany({ name: "Fresh Co", organizationType: "startup", capabilities: ["ai-data"] });
  check("new company-type org has no offers", JSON.stringify(fresh.offers) === JSON.stringify([]));
}

// ---------------------------------------------------------------------
section("10. partner offers remain intact");
{
  const partner = CompanyStore.getCompanies().find((c) => c.id === "orbit-fund");
  check("existing partner-type org still has its offers", partner.offers.includes("Seed funding"));
  const updatedPartner = CompanyStore.updateCompany("orbit-fund", { offers: ["Seed funding", "Mentorship"] });
  check("partner offers editable and persisted", JSON.stringify(updatedPartner.offers) === JSON.stringify(["Seed funding", "Mentorship"]));
}

// ---------------------------------------------------------------------
section("11-12. company profiles render / matching still works");
{
  const companies = CompanyStore.getCompanies();
  check("companies list non-empty", companies.length > 0);
  const a = CompanyStore.getCompanies().find((c) => c.id === companyId);
  const b = CompanyStore.createCompany({
    name: "Complementary Co", organizationType: "startup",
    needs: [], offers: [], tech: ["phased-array-antenna"], capabilities: ["comms"],
  });
  const matches = MatchEngine.generateMatchesForCompany(a, CompanyStore.getCompanies(), { limit: 5, minScore: 1 });
  check("match engine runs without throwing and returns an array", Array.isArray(matches));
  const offersLabels = MatchEngine.getCompanyOffers(a);
  check("tech id resolved to a human label in match corpus", offersLabels.some((v) => v === "Phased Array Antenna" || v === "SAR Sensor"));
  const needsLabels = MatchEngine.getCompanyNeeds(a);
  check("need id resolved to a human label", needsLabels.includes("Anchor customer"));
}

// ---------------------------------------------------------------------
section("13. CompanyAccount functionality from 1a58ec0 still works");
{
  const c = CompanyStore.getCompanies().find((x) => x.id === companyId);
  const result = CompanyAccountStore.createForCompany(c);
  check("account created", !!result && !!result.account);
  const reloaded = CompanyStore.getCompanies().find((x) => x.id === companyId);
  check("company claimed after account creation", reloaded.membershipStatus === "claimed");
  check("account resolves companyId via authenticate", CompanyAccountStore.authenticate(result.account.username, result.temporaryCredential).companyId === companyId);
}

// ---------------------------------------------------------------------
section("14. SubmissionStore behavior unchanged");
{
  const sub = SubmissionStore.createSubmission({ companyName: "Another Submission", offers: ["X"], needs: ["Y"] });
  check("submission stores offers/needs as free text, untouched by this batch", sub.offers[0] === "X" && sub.needs[0] === "Y");
  const asCompanyInput = SubmissionStore.toCompanyInput(sub);
  check("toCompanyInput still produces offers/needs/capabilities keys", "offers" in asCompanyInput && "needs" in asCompanyInput && "capabilities" in asCompanyInput);
}

// ---------------------------------------------------------------------
section("15. company count unchanged by seed/reset");
{
  const seeded = CompanyStore.resetCompaniesToSeed();
  check("reset returns exactly the 2 seed companies", seeded.length === 2);
}

// ---------------------------------------------------------------------
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
