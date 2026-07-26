// ecos — Growth Tools sync CLI runner (G3B).
//
// Usage:
//   node scripts/sync-growth-tools.js --provider=innovation-authority [--dry-run]
//
// What it does (see src/services/growth-tools-sync-service.js and
// growth-tools-adapters.js for the pipeline this wires together):
//   1. load canonical tools (managed SEED + generated overlay, merged by
//      GrowthToolsStore itself — this script never bypasses that merge)
//   2. load the generated source-data overlay + audit log
//   3. run the requested provider's registered adapter
//   4. validate each raw candidate (rejects bad provider/status/URL/date,
//      or any attempt to touch a managed field)
//   5. diff each valid candidate against the current merged tool
//   6. AUTOMATICALLY apply every valid, non-empty diff (no admin approval
//      step — that is this batch's deliberate product decision) unless
//      --dry-run was passed
//   7. write the updated overlay file ONLY if something actually changed
//      (byte-identical no-op runs never touch the file or the log — see
//      the header of growth-tools-source-data.js)
//   8. append one audit-log entry per changed field
//   9. print a concise summary
//
// No live network access is required for this script to be useful: a
// fully-blocked provider fetch degrades to "0 fetched / N failed", the
// existing overlay is preserved untouched, and the run still exits 0 with
// an honest summary — see the file's PROVIDER_FETCH_FAILURE handling below.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE_DATA_PATH = path.join(ROOT, "src", "data", "generated", "growth-tools-source-data.js");
const SYNC_LOG_PATH = path.join(ROOT, "src", "data", "generated", "growth-tools-sync-log.json");

// Which registered adapter a provider sync actually uses. Kept here (not in
// the adapter registry) since it's a runner policy choice, not part of the
// adapter contract — a provider could have more than one registered adapter
// (e.g. a manual fixture for tests) without ambiguity about which one a
// real sync run should use.
const PROVIDER_ADAPTER_ID = {
  "innovation-authority": "innovation-authority-web",
};

function parseArgs(argv) {
  const args = { provider: null, dryRun: false };
  argv.forEach((arg) => {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.indexOf("--provider=") === 0) args.provider = arg.slice("--provider=".length);
  });
  return args;
}

function loadRuntime() {
  global.window = {};
  // Load order matters, same as ecos.html: overlay data before the store.
  if (fs.existsSync(SOURCE_DATA_PATH)) {
    delete require.cache[require.resolve(SOURCE_DATA_PATH)];
    require(SOURCE_DATA_PATH);
  }
  delete require.cache[require.resolve(path.join(ROOT, "src", "services", "growth-tools-store.js"))];
  require(path.join(ROOT, "src", "services", "growth-tools-store.js"));
  delete require.cache[require.resolve(path.join(ROOT, "src", "services", "growth-tools-adapters.js"))];
  require(path.join(ROOT, "src", "services", "growth-tools-adapters.js"));
  delete require.cache[require.resolve(path.join(ROOT, "src", "services", "growth-tools-sync-service.js"))];
  require(path.join(ROOT, "src", "services", "growth-tools-sync-service.js"));
  return { Store: window.GrowthToolsStore, Adapters: window.GrowthToolsAdapters, Sync: window.GrowthToolsSyncService };
}

function loadOverlayRaw(sourceDataPath) {
  // Re-reads the overlay as a plain object independent of the runtime
  // require() above, so this script edits the actual on-disk source of
  // truth rather than a stale in-memory copy from an earlier load.
  // `sourceDataPath` defaults to the real committed file — tests pass a
  // temp-file path instead so they never touch the real generated data.
  const targetPath = sourceDataPath || SOURCE_DATA_PATH;
  const sandbox = {};
  if (fs.existsSync(targetPath)) {
    const code = fs.readFileSync(targetPath, "utf8");
    const fn = new Function("window", code + "\nreturn window.GrowthToolsSourceData;"); // eslint-disable-line no-new-func
    return fn(sandbox) || {};
  }
  return {};
}

function loadSyncLog() {
  if (!fs.existsSync(SYNC_LOG_PATH)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(SYNC_LOG_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function defaultOverlayEntry(tool) {
  return {
    officialName: null,
    status: null,
    deadline: null,
    applicationUrl: null,
    sourceUrl: tool.source ? tool.source.url : null,
    externalId: tool.source ? tool.source.externalId : null,
    lastSyncedAt: null,
    syncStatus: "never",
  };
}

// Deterministic serialization: same field order every time, one entry per
// canonical tool id in canonical (SEED) order, so a no-op run's rebuilt
// text is byte-identical to what's already on disk and a real change
// produces the smallest possible diff.
function serializeOverlay(overlay, orderedToolIds) {
  const lines = [];
  lines.push("// ecos — Growth Tools generated source-owned data (G3B).");
  lines.push("// AUTO-GENERATED / machine-writable by scripts/sync-growth-tools.js — do");
  lines.push("// not hand-edit values here for long, they will be overwritten by the next");
  lines.push("// sync run. Holds ONLY source-owned fields (see");
  lines.push("// growth-tools-sync-service.js's MANAGED_FIELDS/SOURCE_OWNED_FIELDS) —");
  lines.push("// never curated matching metadata, which stays in growth-tools-store.js's");
  lines.push("// SEED, untouched by this file or by sync.");
  lines.push("//");
  lines.push("// `lastSyncedAt` only updates when a sync run actually applies a real field");
  lines.push("// change to that tool — never bumped on a no-op/successful-but-unchanged");
  lines.push("// run, so a daily sync with nothing new produces zero Git diff.");
  lines.push("");
  lines.push("window.GrowthToolsSourceData = {");
  orderedToolIds.forEach((id) => {
    const e = overlay[id];
    if (!e) return;
    lines.push(`  "${id}": {`);
    lines.push(`    officialName: ${JSON.stringify(e.officialName)},`);
    lines.push(`    status: ${JSON.stringify(e.status)},`);
    lines.push(`    deadline: ${JSON.stringify(e.deadline)},`);
    lines.push(`    applicationUrl: ${JSON.stringify(e.applicationUrl)},`);
    lines.push(`    sourceUrl: ${JSON.stringify(e.sourceUrl)},`);
    lines.push(`    externalId: ${JSON.stringify(e.externalId)},`);
    lines.push(`    lastSyncedAt: ${JSON.stringify(e.lastSyncedAt)},`);
    lines.push(`    syncStatus: ${JSON.stringify(e.syncStatus)},`);
    lines.push(`  },`);
  });
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

// Runs one provider sync. Exposed as a function (not only a CLI script) so
// scripts/test-growth-tools-sync.js can exercise it deterministically
// against fixtures without shelling out.
function runProviderSync({ Store, Adapters, Sync }, providerId, options) {
  const opts = Object.assign({ dryRun: false }, options || {});
  const allTools = Store.getGrowthTools();
  const providerTools = allTools.filter((t) => t.providerId === providerId);
  const adapterId = PROVIDER_ADAPTER_ID[providerId];
  const adapter = adapterId ? Adapters.get(adapterId) : null;

  const result = {
    providerId,
    toolsRequested: providerTools.length,
    toolsFetched: 0,
    sourceFailures: 0,
    validCandidates: 0,
    invalidCandidates: 0,
    warnings: [],
    toolsChanged: 0,
    fieldsUpdated: 0,
    auditEntries: [],
    dirty: false,
  };

  if (!adapter) {
    result.warnings.push(`no adapter registered for provider "${providerId}"`);
    return Promise.resolve({ result, overlay: null });
  }
  if (!providerTools.length) {
    result.warnings.push(`no canonical Growth Tools found for provider "${providerId}"`);
    return Promise.resolve({ result, overlay: null });
  }

  const overlay = loadOverlayRaw(opts.sourceDataPath);
  allTools.forEach((t) => { if (!overlay[t.id]) overlay[t.id] = defaultOverlayEntry(t); });

  return Promise.resolve(adapter.fetch({ tools: providerTools })).then((rawResults) => {
    const rows = Array.isArray(rawResults) ? rawResults : [];
    rows.forEach((row) => {
      if (row && typeof row.ok === "boolean") {
        if (row.ok) result.toolsFetched++; else result.sourceFailures++;
      }
    });

    const rawCandidates = adapter.normalize(rows) || [];
    rawCandidates.forEach((rawCandidate) => {
      const currentTool = allTools.find((t) => t.id === rawCandidate.toolId);
      const validity = Sync.validateCandidate(rawCandidate, currentTool);
      if (!validity.valid) {
        result.invalidCandidates++;
        validity.errors.forEach((e) => result.warnings.push(`${rawCandidate.toolId || "(unknown tool)"}: ${e}`));
        return;
      }
      result.validCandidates++;
      if (!currentTool) return;

      const candidate = Sync.normalizeCandidate(rawCandidate);
      const diff = Sync.diffCandidate(currentTool, candidate);
      const changedKeys = Object.keys(diff.changes);
      if (!changedKeys.length) return; // no-op for this tool — untouched, no log entry

      result.toolsChanged++;
      result.fieldsUpdated += changedKeys.length;

      if (opts.dryRun) {
        changedKeys.forEach((key) => {
          result.warnings.push(`[dry-run] would update ${currentTool.id}.${key}: ${JSON.stringify(diff.changes[key].from)} -> ${JSON.stringify(diff.changes[key].to)}`);
        });
        return;
      }

      const merged = Sync.applyMerge(currentTool, diff, { syncStatus: "ok", syncedAt: rawCandidate.fetchedAt || new Date().toISOString() });
      overlay[currentTool.id] = {
        officialName: merged.officialName,
        status: merged.status,
        deadline: merged.deadline,
        applicationUrl: merged.applicationUrl,
        sourceUrl: merged.source ? merged.source.url : overlay[currentTool.id].sourceUrl,
        externalId: merged.source ? merged.source.externalId : overlay[currentTool.id].externalId,
        // source.url/externalId only change if the candidate proposed them
        // (diff.changes would contain "source.url"/"source.externalId");
        // applyMerge only rewrites merged.source when one of those fired.
        lastSyncedAt: merged.lastSyncedAt,
        syncStatus: merged.syncStatus,
      };
      result.dirty = true;

      changedKeys.forEach((key) => {
        result.auditEntries.push({
          timestamp: merged.lastSyncedAt,
          providerId,
          toolId: currentTool.id,
          field: key,
          previousValue: diff.changes[key].from,
          newValue: diff.changes[key].to,
          sourceUrl: rawCandidate.sourceUrl || (currentTool.source && currentTool.source.url) || null,
        });
      });
    });

    return { result, overlay };
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.provider) {
    console.error("Usage: node scripts/sync-growth-tools.js --provider=<id> [--dry-run]");
    process.exit(1);
  }

  const runtime = loadRuntime();
  const allToolIds = runtime.Store.getGrowthTools().map((t) => t.id);

  runProviderSync(runtime, args.provider, { dryRun: args.dryRun }).then(({ result, overlay }) => {
    if (result.dirty && overlay) {
      const nextText = serializeOverlay(overlay, allToolIds);
      const prevText = fs.existsSync(SOURCE_DATA_PATH) ? fs.readFileSync(SOURCE_DATA_PATH, "utf8") : null;
      if (nextText !== prevText) {
        fs.writeFileSync(SOURCE_DATA_PATH, nextText);
      }
      if (result.auditEntries.length) {
        const log = loadSyncLog().concat(result.auditEntries);
        fs.writeFileSync(SYNC_LOG_PATH, JSON.stringify(log, null, 2) + "\n");
      }
    }

    const label = args.provider.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    console.log(`\n${label} sync${args.dryRun ? " (dry-run)" : ""}`);
    console.log(`${result.toolsRequested} tools`);
    console.log(`${result.toolsFetched} fetched`);
    console.log(`${result.sourceFailures} source failures`);
    console.log(`${result.validCandidates} valid`);
    console.log(`${result.invalidCandidates} invalid`);
    console.log(`${result.toolsChanged} tools changed`);
    console.log(`${result.fieldsUpdated} fields updated`);
    console.log(`${result.warnings.length} warnings`);
    if (result.warnings.length) {
      result.warnings.forEach((w) => console.log("  - " + w));
    }
    // G3C — GitHub Actions annotation (harmless plain text outside CI):
    // a fully-blocked provider is a known, expected external condition
    // (e.g. Innovation Authority's 403), not a bug in this pipeline — the
    // run still completes/exits 0 (see G3C decision doc in the workflow
    // file) so a blocked provider never shows as a broken CI run, but it
    // must still be clearly visible in the Action's own log, not silently
    // swallowed.
    if (result.toolsRequested > 0 && result.toolsFetched === 0 && result.sourceFailures === result.toolsRequested) {
      console.log(`::warning::${label} sync: provider fully unreachable this run (${result.sourceFailures}/${result.toolsRequested} source failures) — existing generated data left untouched.`);
    } else if (result.sourceFailures > 0) {
      console.log(`::warning::${label} sync: ${result.sourceFailures}/${result.toolsRequested} sources failed this run — their existing data was left untouched.`);
    }
    process.exit(0);
  }).catch((err) => {
    console.error("sync-growth-tools: unexpected failure —", err && err.stack || err);
    process.exit(1);
  });
}

function writeOverlay(sourceDataPath, overlay, orderedToolIds) {
  fs.writeFileSync(sourceDataPath, serializeOverlay(overlay, orderedToolIds));
}

module.exports = { runProviderSync, loadRuntime, loadOverlayRaw, loadSyncLog, serializeOverlay, defaultOverlayEntry, writeOverlay };

if (require.main === module) {
  main();
}
