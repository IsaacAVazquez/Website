---
version: 1
slug: "src-components-catalog97-catalog97toolshell-tsx"
primary_target: "src/components/catalog97/Catalog97ToolShell.tsx"
related_targets: ["src/components/ConditionalLayout.tsx","src/components/catalog97/Catalog97Shell.tsx","src/app/catalog97.css"]
---

# Catalog 97 tool shell surface brief

**Scope.** `src/components/catalog97/Catalog97ToolShell.tsx`, rendered by `ConditionalLayout` around every route that is not one of the seven designed Catalog 97 pages, `/admin` included. It is `Catalog97Shell` plus an optional title band and the build-note aside, so an edit here changes 57 routes at once.

**Visitor mode.** Operate. The shell is chrome around a working tool, so it should be quiet and let the dashboard or the calculator be the loudest thing on screen.

**Visual world: Catalog 97, not Working Instrument.** `DESIGN.md` still describes the Working Instrument as of 2026-09-16 and will until the close-out PR regenerates it. Judging this file or any route inside it against `DESIGN.md` manufactures false findings. Tokens live in `src/app/catalog97.css`.

**The bridge, and what it means for findings.** Every route inside this shell still renders components written against `--home-*` tokens. The bridge block in `catalog97.css` (between the `BRIDGE START` and `BRIDGE END` markers) aliases each of those onto the Catalog 97 value for the enclosing surface, zeroes the radii, removes the shadows, and swaps the fonts. So a finding that reads "this card uses `--home-paper-raised`" is not a defect on its own, since that token resolves to the bone field here. The defect to look for is a layout idea the bridge cannot repaint, meaning a signal-orange semantic that reads wrong as oxblood, a shadow drawn with a literal rgba, a raw hex, or a radius set in a Tailwind class like `rounded-xl` instead of through a `--radius-*` token. Those are what the family migrations exist to fix, and each family's PR is the place to record them.

**Status colour has a large-text-only rule on four surfaces.** Light camel, light stone, light tobacco, and dark stone are mid-tones, and the status tokens measure 3.45 to 4.00 on them. On those four the tokens are only used for marks or text at `--c97-fs-h2` and above, and body-size status text uses ink. The chip modifiers are stricter and stay in ink on camel, stone, and tobacco in both themes, since a chip is always label-size.

**The band is opt-in and off by default.** Every route on the site already draws its own `h1`, so the shell adds none. A family migration passes `band` when it moves a route's hero into the shell, and at that point the route's own `h1` must go, because the sweep asserts exactly one per route.

**Commands worth running.** `critique` and `audit`, on a route rendered inside the shell and not on this file, since the file has no visual content of its own. Never `document` here.

**Verified state at creation (2026-09-16).** Recorded in Task 9 of `docs/superpowers/plans/2026-09-16-catalog97-bridge.md`.
