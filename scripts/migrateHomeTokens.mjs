#!/usr/bin/env node
// Rewrites Working Instrument token references onto their Catalog 97 names,
// using the same mapping as the bridge block in src/app/catalog97.css.
//   node scripts/migrateHomeTokens.mjs src/app/earthquake-pulse/*.tsx
// Unknown --home-* names are left in place and counted, so a leftover shows up.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const MAP = {
  "paper-raised": "field",
  "paper-alt": "field",
  "elev-mix": "field",
  paper: "surface",
  "ink-muted": "ink-2",
  "ink-soft": "label",
  ink: "ink",
  "signal-soft": "accent-soft",
  "signal-ink": "accent",
  signal: "accent",
  "control-rule": "ink-2",
  stone: "rule",
  rule: "rule",
  overlay: "overlay",
  positive: "positive",
  negative: "negative",
  warning: "warning",
};

export function migrateHomeTokens(source) {
  return source.replace(/var\(--home-([a-z-]+)\)/g, (whole, name) =>
    name in MAP ? `var(--c97-${MAP[name]})` : whole,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const file of process.argv.slice(2)) {
    const before = fs.readFileSync(file, "utf8");
    const after = migrateHomeTokens(before);
    if (after !== before) fs.writeFileSync(file, after);
    console.log(`${file}: ${(after.match(/var\(--home-/g) ?? []).length} --home references left`);
  }
}
