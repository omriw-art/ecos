# Batch P2.1 Summary — Join Submission Hardening

## Commit

`358c08c fix: harden join submission approval flow`

## What Was Implemented

- Added normalized company-name duplicate detection before approving join submissions.
- Duplicate detection trims whitespace, lowercases names, and collapses repeated spaces.
- If a duplicate company already exists:
  - no new company is created
  - the submission remains pending
  - admins see a clear warning message in the onboarding area
  - a toast message is shown
- Added submission counts in Admin Onboarding:
  - pending submissions
  - approved submissions
  - rejected submissions
- Added a rejected submissions history section in Admin Onboarding.
- Rejected submissions remain visible after refresh because they stay in `localStorage`.
- Approval and rejection continue to persist through `SubmissionStore`.

## Files Changed In Commit

- `src/services/company-store.js`
- `src/services/submission-store.js`
- `src/modules/onboarding/view-onboard.jsx`

## Validation Passed

```text
git status --short
git log --oneline -6
node --check src/data/data.js
node --check src/services/company-store.js
node --check src/services/submission-store.js
git diff --check
git diff --cached --check
```

Additional service workflow check passed:

```text
duplicate guard and submission counts ok 110 111 {"pending":0,"approved":1,"rejected":1}
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
?? docs/ECOSYSTEM_OS_FUNCTIONAL_REALITY_AUDIT.md
?? docs/BATCH_P2_1_SUMMARY.md
```

## Known Limitations

- Still localStorage only, no backend.
- Duplicate handling blocks approval but does not provide a merge workflow.
- Approved submissions are counted and preserved, but only rejected submissions have a visible history list.
- No full browser manual test was available in this environment.
