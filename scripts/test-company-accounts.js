// ecos — deterministic fixtures/tests for Admin Organization Intake + Company
// Accounts MVP. Plain Node, no test framework, no dependencies, no network.
// Run:
//   node scripts/test-company-accounts.js
//
// Loads the real storage.js/local-adapter.js/company-store.js/
// company-account-store.js/submission-store.js under a minimal `window` +
// in-memory localStorage shim (the same technique used by
// scripts/test-growth-tools-sync.js) so tests run against the real stores,
// not synthetic stand-ins.

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

// Minimal seed data company-store.js reads via window.COMPANIES before it
// overwrites the global with its own cached accessor.
window.COMPANIES = [
  { id: "ramon-space", name: "Ramon.Space", organizationType: "startup", membershipStatus: "unclaimed" },
  { id: "spaceil", name: "SpaceIL", organizationType: "nonprofit", membershipStatus: "unclaimed" },
];

require(path.join(__dirname, "..", "src", "services", "storage.js"));
require(path.join(__dirname, "..", "src", "services", "local-adapter.js"));
require(path.join(__dirname, "..", "src", "services", "company-store.js"));
require(path.join(__dirname, "..", "src", "services", "submission-store.js"));
require(path.join(__dirname, "..", "src", "services", "company-account-store.js"));

const CompanyStore = window.CompanyStore;
const CompanyAccountStore = window.CompanyAccountStore;
const SubmissionStore = window.SubmissionStore;

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

// ---------------------------------------------------------------------
section("1-2. Create Admin company, reload, remains");
{
  const created = CompanyStore.createCompany({ name: "New Orbit Co" });
  check("created with unclaimed default", created.membershipStatus === "unclaimed");
  const reloaded = CompanyStore.getCompanies().find((c) => c.id === created.id);
  check("survives reload (re-read from storage)", !!reloaded && reloaded.name === "New Orbit Co");
}

// ---------------------------------------------------------------------
section("3-4. Edit company, reload, edits remain");
{
  const target = CompanyStore.getCompanies().find((c) => c.id === "ramon-space");
  CompanyStore.updateCompany(target.id, { blurb: "Updated blurb", website: "https://ramon.space" });
  const reloaded = CompanyStore.getCompanies().find((c) => c.id === "ramon-space");
  check("edits persisted", reloaded.blurb === "Updated blurb" && reloaded.website === "https://ramon.space");
  check("id unchanged", reloaded.id === "ramon-space");
}

// ---------------------------------------------------------------------
section("5-6. New company defaults unclaimed; no account");
{
  const c = CompanyStore.createCompany({ name: "Quiet Startup" });
  check("defaults to unclaimed", c.membershipStatus === "unclaimed");
  check("no account exists yet", CompanyAccountStore.getByCompanyId(c.id) === null);
}

// ---------------------------------------------------------------------
section("7-9. Claim company: account created, linked, company claimed");
let claimedCompanyId, tempPassword, username;
{
  const c = CompanyStore.getCompanies().find((x) => x.name === "Quiet Startup");
  claimedCompanyId = c.id;
  const result = CompanyAccountStore.createForCompany(c);
  check("account object returned", !!result && !!result.account);
  check("temporaryCredential returned once", typeof result.temporaryCredential === "string" && result.temporaryCredential.length > 0);
  check("no credentialHash leaked on returned account", result.account.credentialHash === undefined);
  username = result.account.username;
  tempPassword = result.temporaryCredential;

  const account = CompanyAccountStore.getByCompanyId(claimedCompanyId);
  check("account linked to correct companyId", account.companyId === claimedCompanyId);

  const reloadedCompany = CompanyStore.getCompanies().find((x) => x.id === claimedCompanyId);
  check("company flipped to claimed", reloadedCompany.membershipStatus === "claimed");
}

// ---------------------------------------------------------------------
section("10. Username collision handled");
{
  const original = CompanyStore.getCompanies().find((c) => c.id === "ramon-space");
  const originalResult = CompanyAccountStore.createForCompany(original);
  check("original claims the base slug username", originalResult.account.username === "ramon-space");

  // Same base slug ("ramon-space") as the seed company's name, different id.
  const dup = CompanyStore.createCompany({ name: "Ramon.Space" });
  const dupResult = CompanyAccountStore.createForCompany(dup);
  check("collision produced a distinct username", dupResult.account.username !== "ramon-space" && dupResult.account.username.indexOf("ramon-space") === 0);
  check("original account untouched by the collision", CompanyAccountStore.getByCompanyId("ramon-space").username === "ramon-space");
}

// ---------------------------------------------------------------------
section("11-12. Reset password/credential; credentials resolve to correct company");
{
  const before = CompanyAccountStore.getByCompanyId(claimedCompanyId);
  const reset = CompanyAccountStore.resetCredential(claimedCompanyId);
  check("reset returns new temporary credential", typeof reset.temporaryCredential === "string" && reset.temporaryCredential !== tempPassword);
  check("username unchanged across reset", reset.account.username === before.username);

  const oldAuth = CompanyAccountStore.authenticate(username, tempPassword);
  check("old password no longer authenticates after reset", oldAuth === null);

  const newAuth = CompanyAccountStore.authenticate(username, reset.temporaryCredential);
  check("new password authenticates", !!newAuth && newAuth.companyId === claimedCompanyId);
}

// ---------------------------------------------------------------------
section("13. Other companies remain unchanged");
{
  // ramon-space was claimed deliberately in section 10 above; spaceil was
  // never touched by any claim/collision in this run and must stay untouched.
  const spaceil = CompanyStore.getCompanies().find((c) => c.id === "spaceil");
  check("spaceil untouched", spaceil.membershipStatus === "unclaimed" && CompanyAccountStore.getByCompanyId("spaceil") === null);
}

// ---------------------------------------------------------------------
section("14. Company demo (acting-company resolution) still works");
{
  const eligible = CompanyStore.getCompanies().filter((c) => c.organizationType !== "nonprofit");
  check("at least one eligible company for acting-company resolution", eligible.length > 0);
}

// ---------------------------------------------------------------------
section("15. Existing submissions remain unchanged");
{
  const sub = SubmissionStore.createSubmission({ companyName: "Pending Co" });
  check("submission created independent of company accounts", SubmissionStore.getSubmissions().some((s) => s.id === sub.id));
  check("submission not linked to any CompanyAccount concept", sub.approvedCompanyId === "");
}

// ---------------------------------------------------------------------
section("16. Seed/reset behavior still valid");
{
  const seeded = CompanyStore.resetCompaniesToSeed();
  check("reset returns exactly the 2 seed companies", seeded.length === 2);
  check("reset companies default unclaimed", seeded.every((c) => c.membershipStatus === "unclaimed"));
  // Accounts created before reset are orphaned data, not wiped — matches
  // "no automated Submission matching / account cleanup" scope of this batch.
  check("orphaned account for reset-away company still resolves by username (documented limitation, not a bug)",
    CompanyAccountStore.getByUsername(username) !== null);
}

// ---------------------------------------------------------------------
console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
