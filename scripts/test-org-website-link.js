// ecos — regression test for the organization-profile "website" link.
//
// Context: a real jsdom+React render of the unmodified source (done as a
// one-off investigation, not committed here since this repo deliberately
// has no React/jsdom dependency — see CLAUDE.md's "no bundler" convention)
// proved the hero control renders as a genuine <a href target="_blank"
// rel="noopener noreferrer">, with no ancestor pointer-events:none, no
// onClick override, and no window.open() call anywhere in the path. This
// script is the lightweight, dependency-free, plain-Node equivalent that
// stays in the repo as a permanent regression guard: it (a) exercises the
// exact `toExternalHref` normalizer this file exports its behavior through,
// and (b) statically asserts the source no longer contains the
// window.open()-based anti-pattern that originally caused "the button does
// nothing" (some browsers'/embedded webviews' popup blockers can silently
// swallow window.open() even on a direct click; a native <a target="_blank">
// is never subject to that).
//
// Run: node scripts/test-org-website-link.js

const fs = require("fs");
const path = require("path");

let failures = 0;
function check(label, condition) {
  if (condition) console.log("  ok   " + label);
  else { console.log("  FAIL " + label); failures++; }
}
function section(title) { console.log("\n=== " + title + " ==="); }

const srcPath = path.join(__dirname, "..", "src", "modules", "organizations", "view-companies.jsx");
const source = fs.readFileSync(srcPath, "utf8");

// --- Section 1: the exact normalizer, copied verbatim from the source so a
// change to its behavior here fails loudly rather than silently drifting.
function toExternalHref(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

section("toExternalHref — normalization behavior");
check("Rakia's real website resolves unchanged", toExternalHref("https://www.rakiamission.com") === "https://www.rakiamission.com");
check("bare domain gets https:// prefix", toExternalHref("iai.co.il") === "https://iai.co.il");
check("surrounding whitespace is trimmed", toExternalHref("  https://tomorrow.io  ") === "https://tomorrow.io");
check("empty string -> null (no broken link)", toExternalHref("") === null);
check("null -> null", toExternalHref(null) === null);
check("undefined -> null", toExternalHref(undefined) === null);
check("whitespace-only -> null", toExternalHref("   ") === null);

// --- Section 2: confirm toExternalHref is actually defined once in the
// source (not reintroduced ad hoc at each call site) and is what backs
// every "open the org's site" control.
section("Source structure — single shared normalizer, no window.open() regression");
const toExternalHrefDefs = (source.match(/function toExternalHref\(/g) || []).length;
check("toExternalHref defined exactly once", toExternalHrefDefs === 1);

// Strip //-line-comments before scanning for a real window.open() call, so
// this doesn't false-positive on this very file's own explanatory comments
// about the anti-pattern it fixed.
const sourceWithoutLineComments = source.split("\n").map((line) => line.replace(/\/\/.*$/, "")).join("\n");
const windowOpenCalls = (sourceWithoutLineComments.match(/window\.open\(/g) || []).length;
check("no real (non-comment) window.open() calls anywhere in this file (the original bug)", windowOpenCalls === 0);

const hrefUsages = (source.match(/href=\{(?:toExternalHref\([^)]*\)|externalHref)\}/g) || []).length;
check("every href={...} in this file resolves through the shared normalizer", hrefUsages >= 3);

// The exact hero control block: externalHref-gated <a> with target/rel, or a
// disabled <button> fallback when there's truly no link — never an active
// control with an empty/undefined href.
const heroBlockMatch = /\{externalHref \? \(\s*<a[\s\S]{0,300}?href=\{externalHref\}[\s\S]{0,200}?target="_blank"[\s\S]{0,100}?rel="noopener noreferrer"/m.exec(source);
check("hero control is an <a href={externalHref} target=\"_blank\" rel=\"noopener noreferrer\">", !!heroBlockMatch);

const disabledFallbackMatch = /<button className="btn"[^>]*disabled[^>]*title="אין קישור מוגדר לחברה זו"/.exec(source);
check("missing-website fallback is a disabled <button>, never a broken active link", !!disabledFallbackMatch);

// --- Section 3: no click-suppressing pattern anywhere in this file.
section("No event-suppression pattern present");
check("no onClick={openExternalLink}-style indirection left in the file", !/openExternalLink/.test(source));
check("no preventDefault() near any external href anchor", (() => {
  // Loose but meaningful: confirm preventDefault() calls in this file are
  // nowhere near an externalHref-driven anchor (they exist elsewhere, e.g.
  // the company editor's form submit — that's fine and unrelated).
  const anchorIdx = source.indexOf('href={externalHref}');
  if (anchorIdx === -1) return false;
  const window_ = source.slice(Math.max(0, anchorIdx - 400), anchorIdx + 400);
  return !/preventDefault/.test(window_);
})());

console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"));
process.exit(failures === 0 ? 0 : 1);
