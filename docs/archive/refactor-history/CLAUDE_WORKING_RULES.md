# CLAUDE_WORKING_RULES

Last updated: 2026-07-05

These rules apply to every Claude Code task in this project. Read them before starting any task.

---

## 1. Prime Directive

**Never recreate the project from scratch. Evolve the existing demo carefully.**

The prototype is live, the demo has value, and the visual design is intentional. Changes must be additive and reversible wherever possible. If a task would require rebuilding from scratch, stop and ask.

---

## 2. Do Not Change Without Explicit Permission

The following must not change unless the user explicitly approves it in writing for that specific task:

- **Architecture** — flat file structure, no build system, runtime Babel
- **Routing** — there is no client-side router; view switching is a React `useState`
- **File locations** — do not move any file to a new path
- **Script load order** — the `<script>` tag sequence in `ecos.html`, `index.html`, `join.html` is load-bearing; re-ordering breaks the app silently
- **Package dependencies** — do not add, remove, or upgrade any package or CDN dependency
- **Visual design** — do not change colors, typography, spacing, layout, or component structure
- **Data model shape** — do not rename fields, change field types, or remove fields from company objects or other data structures in `data.js`
- **Global `window.*` APIs** — do not rename or remove any `window.*` export without updating every consumer
- **Logo paths** — do not move or rename anything under `logos/`

---

## 3. Work in Small Steps

Each task must:

1. Modify the **smallest possible number of files** to accomplish the goal
2. **Explain every change** before and after (file name, what changed, why)
3. **Stop after completion** — do not automatically continue into the next task
4. **Not assume** that permission for one task implies permission for a related task
5. Report what was done and what the next recommended step is — then wait

If a task touches more than 3 files, pause and confirm with the user before proceeding.

---

## 4. Current Architecture Constraints

- All scripts are loaded via `<script src="...">` tags in HTML files — there is no bundler or module system
- Components are attached to `window` (e.g., `window.Sidebar`, `window.I`, `window.toast`) and consumed by later scripts
- All shared data comes from `data.js`, which runs before any component script
- Script load order in HTML is the implicit dependency graph — it is fragile and must not be changed without a plan
- `index.html` is self-contained (inline CSS + JS); `ecos.html` and `join.html` share `styles.css`

---

## 5. Refactor Rules

Before moving any file or changing any script tag:

1. Write a plan listing every `<script>` tag affected in all three HTML files
2. Map every `window.*` dependency that the moved file exports or consumes
3. List expected risks (silent failure, load order breakage, undefined globals)
4. Change one group of files at a time — not everything at once
5. After each phase, manually verify that `ecos.html`, `index.html`, and `join.html` all load without errors
6. Do not proceed to the next phase until the current one is confirmed working

---

## 6. Product Rules

Preserve the following product decisions in all future work:

- **Current demo feeling** — the app looks and feels like a real internal tool; do not make it look like a prototype
- **Invite-only MVP direction** — public access is limited; the register flow is intentionally gated
- **Company/admin dual-track** — admin sees all data; companies control what is visible publicly
- **Admin sees all** — the `ecos.html` dashboard is an admin view with full ecosystem visibility
- **Company controls public profile** — companies submit data via `join.html`; what is shown publicly is a subset
- **Funds are not trusted by default** — investment/fund companies are visible but not given elevated access
- **Government API ingestion is future-facing** — any integration with government data sources is review-first, not automatic

---

## 7. Stop Conditions

Stop immediately and ask the user before taking any of the following actions:

- Changing `package.json` or adding new npm packages
- Adding a build tool (Vite, webpack, esbuild, Parcel, etc.)
- Adding Supabase, Firebase, or any backend integration
- Changing client-side routing (adding React Router, etc.)
- Moving `app.jsx`, `ecos.html`, `shell.jsx`, or `data.js`
- Replacing `data.js` with an API call or database fetch
- Redesigning any UI component or page layout
- Deleting any file listed in `docs/BASELINE_STATUS.md § 5`
- Adding authentication or session management
- Modifying CI/CD, deployment scripts, or environment config
