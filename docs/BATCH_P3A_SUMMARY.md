# Batch P3A Summary — Capability Registry

## Commit

`52f1b8c feat: add capability registry`

## What Was Implemented

- Added a canonical browser-global capability registry:
  - `src/services/capability-registry.js`
- The registry exposes:
  - `getAllCapabilities()`
  - `normalizeCapabilityId(value)`
  - `getCompanyCapabilityIds(company)`
  - `getCompanyCapabilities(company)`
  - `getCapabilityCoverage(companies)`
- Capabilities now have stable fields:
  - `id`
  - `name`
  - `category`
  - `description`
  - `keywords`
  - `examples`
- `ecos.html` now loads the registry before app modules.
- `CapabilitiesView` now uses `CapabilityRegistry.getCapabilityCoverage(...)` instead of keeping its own duplicated hardcoded capability definitions.
- Existing companies continue to work through compatibility with:
  - `sectors`
  - `tech`
  - `offers`
  - `needs`
  - `capabilities`
  - `tags`
  - `solutions`
- Company persistence now preserves explicit `capabilities`, `tags`, and `solutions` fields.
- The Companies create/edit form now stores entered capability/tag text as both `tech` and `capabilities`.
- Approved join submissions now carry explicit `capabilities` and `tags` into company creation.
- Unknown explicit capabilities can appear as safe custom capabilities.

## Files Changed In Commit

- `ecos.html`
- `src/services/capability-registry.js`
- `src/services/company-store.js`
- `src/services/submission-store.js`
- `src/modules/capabilities/view-capabilities.jsx`
- `src/modules/organizations/view-companies.jsx`

## Validation Passed

```text
git status --short
git log --oneline -8
node --check src/data/data.js
node --check src/services/company-store.js
node --check src/services/submission-store.js
node --check src/services/capability-registry.js
git diff --check
git diff --cached --check
```

Additional registry workflow check passed:

```text
capability registry ok earth-obs,quantum-clock-sync,ai-data 1
```

HTTP checks passed:

```text
http://localhost:5176/ecos.html  -> 200 OK
http://localhost:5176/join.html  -> 200 OK
http://localhost:5176/index.html -> 200 OK
```

## Remaining Uncommitted Files

```text
 M ecos-qr.png
?? docs/BATCH_O_RECOVERY_REPORT.md
?? docs/BATCH_O_REPORT.md
?? docs/BATCH_P2_1_SUMMARY.md
?? docs/BATCH_P3A_SUMMARY.md
?? docs/ECOSYSTEM_OS_FUNCTIONAL_REALITY_AUDIT.md
```

## Known Limitations

- The registry is still browser-local/static config, not backend-managed.
- The Capabilities page now uses registry selectors, but Dashboard and Matches still use their existing lightweight logic.
- Custom capabilities are supported, but there is not yet an admin merge/rename workflow for custom entries.
- Full browser manual testing was not available in this environment.
