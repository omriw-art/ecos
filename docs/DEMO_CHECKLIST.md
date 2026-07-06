# Demo Checklist — Ecosystem OS Local MVP

Open all files directly in browser (no server needed).

## Public Entry
- [ ] Open `index.html` — landing page loads, no console errors
- [ ] Open `join.html` — registration form loads, LinkedIn pre-fill works
- [ ] Submit a sample organization (fill all required fields, click submit)
- [ ] Confirm success banner says "ההגשה נשמרה" (not "נרשמה בהצלחה")

## Admin / Dashboard (`ecos.html`)
- [ ] Open `ecos.html` — app loads, no console errors
- [ ] Go to Onboarding — pending submission appears
- [ ] Approve submission — company appears in Companies view
- [ ] Reject a submission — it moves to rejected state
- [ ] Create a new company manually (+ button in Companies)
- [ ] Edit an existing company and save

## Core Views
- [ ] Dashboard — stats render, no fake live/user signals
- [ ] Capabilities — coverage chart loads
- [ ] Map — companies plotted with no errors
- [ ] Matches — match results appear for a selected company

## Data Toolkit
- [ ] Export companies as JSON
- [ ] Export companies as CSV
- [ ] Import a JSON/CSV file — companies load
- [ ] Reset to seed data — confirm dialog, data restored on reload

## Final Check
- [ ] Open DevTools console — zero uncaught errors after full walkthrough
