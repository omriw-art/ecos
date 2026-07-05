# SRC STRUCTURE

## Purpose

This folder is the future modular source structure for the Ecosystem OS MVP.

## Current Status

The app does not currently run from `src/`.
Runtime files are still loaded from the root through HTML script tags in `ecos.html`, `join.html`, and `index.html`.

## Copied Files (Batch A)

Reference copies only — not active runtime files:

- `src/shared/icons/icons.jsx` ← copy of root `icons.jsx`
- `src/shared/components/atoms.jsx` ← copy of root `atoms.jsx`
- `src/shared/components/tweaks-panel.jsx` ← copy of root `tweaks-panel.jsx`
- `src/shared/styles/styles.css` ← copy of root `styles.css`
- `src/shared/styles/join-styles.css` ← copy of root `join-styles.css`

## Important Rule

Files in `src/` are currently reference copies only.
Do not assume they are active runtime files until HTML `<script>` and `<link>` tags are explicitly updated in a later step.
Do not edit files in `src/` expecting those changes to appear in the running app — edit the root files instead.

## Future Migration Direction

Later phases will migrate runtime usage gradually, one group of files at a time, with manual browser tests after each change:

1. **Batch B** (planned): Update `<link>` tags to point CSS to `src/shared/styles/`
2. **Batch C** (planned): Update `<script>` tags to point shared JSX to `src/shared/`
3. **Batch D** (planned): Move view files to `src/modules/`
4. **Batch E** (planned): Move core files (`app.jsx`, `shell.jsx`, `data.js`)

Each batch requires explicit approval before implementation.
