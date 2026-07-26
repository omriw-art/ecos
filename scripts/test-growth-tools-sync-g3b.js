// ecos — deterministic fixtures/tests for the G3B automatic-apply pipeline
// (scripts/sync-growth-tools.js). Plain Node, no framework, no live
// network — the real "innovation-authority-web" adapter is temporarily
// replaced in the registry with a controllable fixture adapter for the
// duration of this process only. All file writes go to a throwaway temp
// directory; the real committed src/data/generated/*.json/.js files are
// never touched by this script.
//
// Run: node scripts/test-growth-tools-sync-g3b.js

const fs = require("fs");
const os = require("os");
const path = require("path");

const { runProviderSync, loadRuntime, writeOverlay, serializeOverlay, defaultOverlayEntry } = require("./sync-growth-tools.js");

let failures = 0;
function check(label, condition) {
  if (condition) console.log("  ok   " + label);
  else { console.log("  FAIL " + label); failures++; }
}
function section(title) { console.log("\n=== " + title + " ==="); }
function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

const runtime = loadRuntime();
const { Store, Adapters } = runtime;
const allTools = Store.getGrowthTools();
const preseed = allTools.find((t) => t.id === "gt-iia-preseed");
const roundA = allTools.find((t) => t.id === "gt-iia-round-a");
const iiaToolIds = allTools.filter((t) => t.providerId === "innovation-authority").map((t) => t.id);

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ecos-growth-tools-g3b-"));
const tmpSourceDataPath = path.join(tmpDir, "growth-tools-source-data.js");

function freshOverlay() {
  const overlay = {};
  allTools.forEach((t) => { overlay[t.id] = defaultOverlayEntry(t); });
  return overlay;
}
function seedTempFile(overlay) {
  writeOverlay(tmpSourceDataPath, overlay, allTools.map((t) => t.id));
}

// Registers a fixture adapter under the real "innovation-authority-web" id
// (last registration wins — see growth-tools-adapters.js's register()),
// so runProviderSync's internal PROVIDER_ADAPTER_ID lookup finds it exactly
// as it would the real one, with fully controlled fetch()/normalize().
function useFixtureAdapter(candidatesByToolId) {
  Adapters.register({
    id: "innovation-authority-web",
    providerId: "innovation-authority",
    sourceType: "manual",
    fetch(context) {
      return Promise.resolve((context.tools || []).map((t) => ({
        toolId: t.id,
        sourceUrl: t.source.url,
        ok: Object.prototype.hasOwnProperty.call(candidatesByToolId, t.id) ? candidatesByToolId[t.id].ok !== false : false,
        html: null,
        error: null,
        fetchedAt: "2026-07-26T12:00:00.000Z",
      })));
    },
    normalize(rows) {
      return rows.map((row) => {
        const c = candidatesByToolId[row.toolId] || {};
        return Object.assign({
          toolId: row.toolId,
          providerId: "innovation-authority",
          externalId: null,
          officialName: null,
          status: null,
          deadline: null,
          applicationUrl: null,
          sourceUrl: row.sourceUrl,
          fetchedAt: row.fetchedAt,
        }, c.raw || {});
      });
    },
  });
}

function run(candidatesByToolId, options) {
  useFixtureAdapter(candidatesByToolId);
  return runProviderSync(runtime, "innovation-authority", Object.assign({ sourceDataPath: tmpSourceDataPath }, options || {}));
}

async function main() {
  // -----------------------------------------------------------------
  section("A. source deadline changes -> artifact updates");
  seedTempFile(freshOverlay());
  {
    const { result, overlay } = await run({ "gt-iia-preseed": { raw: { deadline: "2026-09-30" } } });
    check("dirty", result.dirty);
    check("overlay deadline updated", overlay["gt-iia-preseed"].deadline === "2026-09-30");
    check("toolsChanged=1", result.toolsChanged === 1);
  }

  // -----------------------------------------------------------------
  section("B. source applicationUrl changes -> artifact updates");
  seedTempFile(freshOverlay());
  {
    const { result, overlay } = await run({ "gt-iia-preseed": { raw: { applicationUrl: "https://innovationisrael.org.il/apply/preseed" } } });
    check("dirty", result.dirty);
    check("overlay applicationUrl updated", overlay["gt-iia-preseed"].applicationUrl === "https://innovationisrael.org.il/apply/preseed");
  }

  // -----------------------------------------------------------------
  section("C. source status changes -> artifact updates");
  seedTempFile(freshOverlay());
  {
    const { result, overlay } = await run({ "gt-iia-preseed": { raw: { status: "open" } } });
    check("dirty", result.dirty);
    check("overlay status updated", overlay["gt-iia-preseed"].status === "open");
  }

  // -----------------------------------------------------------------
  section("D. missing deadline -> previous deadline preserved");
  {
    const seeded = freshOverlay();
    seeded["gt-iia-preseed"] = Object.assign({}, seeded["gt-iia-preseed"], { deadline: "2026-01-01", syncStatus: "ok", lastSyncedAt: "2026-06-01T00:00:00.000Z" });
    seedTempFile(seeded);
    // Reload runtime so Store reflects the seeded overlay as "current".
    const rt2 = loadRuntime2WithOverlay(tmpSourceDataPath);
    const { result, overlay } = await runProviderSyncWithFixture(rt2, { "gt-iia-preseed": { raw: { status: "open" } } }); // no deadline field at all
    check("preseed deadline unchanged", overlay["gt-iia-preseed"].deadline === "2026-01-01");
    check("status still updated independently", overlay["gt-iia-preseed"].status === "open");
  }

  // -----------------------------------------------------------------
  section("E. malformed deadline -> previous deadline preserved");
  {
    const seeded = freshOverlay();
    seeded["gt-iia-preseed"] = Object.assign({}, seeded["gt-iia-preseed"], { deadline: "2026-01-01" });
    seedTempFile(seeded);
    const rt2 = loadRuntime2WithOverlay(tmpSourceDataPath);
    const { result, overlay } = await runProviderSyncWithFixture(rt2, { "gt-iia-preseed": { raw: { deadline: "soon" } } });
    check("malformed deadline rejected as invalid candidate", result.invalidCandidates >= 1);
    check("preseed deadline unchanged", overlay["gt-iia-preseed"].deadline === "2026-01-01");
    check("not marked dirty for preseed's deadline", !result.dirty);
  }

  // -----------------------------------------------------------------
  section("F. provider mismatch -> rejected");
  seedTempFile(freshOverlay());
  {
    const { result } = await run({ "gt-iia-preseed": { raw: { deadline: "2026-09-30", providerId: "rakia" } } });
    check("rejected as invalid", result.invalidCandidates === 1);
    check("no change applied", result.toolsChanged === 0);
  }

  // -----------------------------------------------------------------
  section("G. managed-field tampering -> rejected");
  seedTempFile(freshOverlay());
  {
    const { result } = await run({ "gt-iia-preseed": { raw: { deadline: "2026-09-30", type: "something-else" } } });
    check("rejected as invalid", result.invalidCandidates === 1);
    check("no change applied", result.toolsChanged === 0);
  }

  // -----------------------------------------------------------------
  section("H. one source failure -> other tools continue");
  seedTempFile(freshOverlay());
  {
    const { result, overlay } = await run({
      "gt-iia-preseed": { ok: false },
      "gt-iia-round-a": { raw: { deadline: "2026-10-15" } },
    });
    check("sourceFailures counted", result.sourceFailures >= 1);
    check("round-a still updated", overlay["gt-iia-round-a"].deadline === "2026-10-15");
    check("preseed left untouched", overlay["gt-iia-preseed"].deadline === null);
  }

  // -----------------------------------------------------------------
  section("I. no changes -> artifact remains byte-identical");
  {
    const overlay0 = freshOverlay();
    seedTempFile(overlay0);
    const before = fs.readFileSync(tmpSourceDataPath, "utf8");
    const { result } = await run({}); // no candidates propose any change
    check("not dirty", !result.dirty);
    const after = fs.readFileSync(tmpSourceDataPath, "utf8");
    check("file byte-identical (untouched)", before === after);
  }

  // -----------------------------------------------------------------
  section("J. actual change -> exactly one audit entry per changed field");
  seedTempFile(freshOverlay());
  {
    const { result } = await run({ "gt-iia-preseed": { raw: { deadline: "2026-09-30", status: "open" } } });
    check("2 audit entries (deadline + status)", result.auditEntries.length === 2);
    check("entries reference correct tool", result.auditEntries.every((e) => e.toolId === "gt-iia-preseed"));
    check("entries have previousValue/newValue/sourceUrl", result.auditEntries.every((e) => "previousValue" in e && "newValue" in e && !!e.sourceUrl));
  }

  // -----------------------------------------------------------------
  section("K. matching metadata remains unchanged after a real change");
  seedTempFile(freshOverlay());
  {
    const { overlay } = await run({ "gt-iia-preseed": { raw: { deadline: "2026-09-30", status: "open", applicationUrl: "https://x.example/apply" } } });
    // runProviderSync itself never writes to disk (only the CLI's main()
    // does) — persist here exactly as main() would, so section L's reload
    // sees the applied change.
    writeOverlay(tmpSourceDataPath, overlay, allTools.map((t) => t.id));
    const rt2 = loadRuntime2WithOverlay(tmpSourceDataPath);
    const preseedAfter = rt2.Store.getGrowthTools().find((t) => t.id === "gt-iia-preseed");
    check("purposes unchanged", deepEqual(preseedAfter.purposes, preseed.purposes));
    check("stages unchanged", deepEqual(preseedAfter.stages, preseed.stages));
    check("domains unchanged", deepEqual(preseedAfter.domains, preseed.domains));
    check("type unchanged", preseedAfter.type === preseed.type);
    check("division unchanged", preseedAfter.division === preseed.division);
    check("name unchanged", preseedAfter.name === preseed.name);
  }

  // -----------------------------------------------------------------
  section("L. GrowthToolsStore runtime merge sees the updated source field");
  {
    const rt2 = loadRuntime2WithOverlay(tmpSourceDataPath);
    const preseedAfter = rt2.Store.getGrowthTools().find((t) => t.id === "gt-iia-preseed");
    check("deadline visible through GrowthToolsStore", preseedAfter.deadline === "2026-09-30");
    check("status visible through GrowthToolsStore", preseedAfter.status === "open");
    check("applicationUrl visible through GrowthToolsStore", preseedAfter.applicationUrl === "https://x.example/apply");
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
  process.exit(failures === 0 ? 0 : 1);
}

// Helpers used by D/E which need a fresh runtime reload so Store reflects a
// pre-seeded overlay as "current" before diffing against a new candidate.
function runProviderSyncWithFixture(rt, candidatesByToolId) {
  rt.Adapters.register({
    id: "innovation-authority-web",
    providerId: "innovation-authority",
    sourceType: "manual",
    fetch(context) {
      return Promise.resolve((context.tools || []).map((t) => ({ toolId: t.id, sourceUrl: t.source.url, ok: true, html: null, error: null, fetchedAt: "2026-07-26T12:00:00.000Z" })));
    },
    normalize(rows) {
      return rows.map((row) => {
        const c = candidatesByToolId[row.toolId] || {};
        return Object.assign({
          toolId: row.toolId, providerId: "innovation-authority", externalId: null,
          officialName: null, status: null, deadline: null, applicationUrl: null,
          sourceUrl: row.sourceUrl, fetchedAt: row.fetchedAt,
        }, c.raw || {});
      });
    },
  });
  return runProviderSync(rt, "innovation-authority", { sourceDataPath: tmpSourceDataPath });
}
function loadRuntime2WithOverlay(sourceDataPath) {
  global.window = {};
  delete require.cache[require.resolve(sourceDataPath)];
  require(sourceDataPath);
  const root = path.join(__dirname, "..");
  delete require.cache[require.resolve(path.join(root, "src", "services", "growth-tools-store.js"))];
  require(path.join(root, "src", "services", "growth-tools-store.js"));
  delete require.cache[require.resolve(path.join(root, "src", "services", "growth-tools-adapters.js"))];
  require(path.join(root, "src", "services", "growth-tools-adapters.js"));
  delete require.cache[require.resolve(path.join(root, "src", "services", "growth-tools-sync-service.js"))];
  require(path.join(root, "src", "services", "growth-tools-sync-service.js"));
  return { Store: window.GrowthToolsStore, Adapters: window.GrowthToolsAdapters, Sync: window.GrowthToolsSyncService };
}

main();
