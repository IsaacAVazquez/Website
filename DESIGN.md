---
name: The Working Instrument
description: Editorial precision-instrument system for Isaac Vazquez — limestone paper, graphite ink, one signal accent, hairline rules, mono readouts.
colors:
  signal-orange: "#C93F19"
  signal-soft: "#F6E0D7"
  limestone-paper: "#F6F5F1"
  paper-alt: "#EFEDE6"
  graphite-ink: "#191813"
  ink-muted: "#6F6B60"
  stone: "#D8D4C9"
  rule: "rgba(25, 24, 19, 0.14)"
  positive: "#059669"
  warning: "#D97706"
  negative: "#DC2626"
typography:
  display:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "clamp(2.85rem, 2rem + 4vw, 5.8rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.08em"
  headline:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "clamp(2.15rem, 1.6rem + 2.75vw, 4.2rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.065em"
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "clamp(1.55rem, 1.3rem + 1.25vw, 2.1rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.05em"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "clamp(1.02rem, 0.95rem + 0.35vw, 1.16rem)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  serif:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(3rem, 2rem + 5vw, 6.4rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.08em"
  label:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  xl: "6px"
  2xl: "6px"
  3xl: "8px"
  panel: "10px"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "4rem"
  4xl: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.graphite-ink}"
    textColor: "{colors.limestone-paper}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.limestone-paper}"
  button-secondary:
    backgroundColor: "{colors.limestone-paper}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.signal-soft}"
    textColor: "{colors.graphite-ink}"
  card:
    backgroundColor: "{colors.limestone-paper}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  chip:
    backgroundColor: "{colors.signal-soft}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.6rem"
  input:
    backgroundColor: "{colors.paper-alt}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
---

# Design System: The Working Instrument

## Overview

**Creative North Star: "The Working Instrument"**

This is the visual language of a precision measuring tool that someone actually uses, not a showpiece kept behind glass. Cool limestone paper, graphite ink, hairline rules, and monospace readouts give the site the feel of a well-made analog instrument or a careful field notebook, and a single burnt orange-red accent behaves like the one lit indicator on that instrument, meaning it only appears where something is live, active, or worth acting on. The system is deliberately quiet so that the writing and the data are the loudest things on any screen.

Surfaces earn emphasis through type and hairlines rather than through color washes, gradients, or heavy shadow. Corners are sharp on purpose, radii stay small, and depth comes from thin rules and restrained lifts rather than from glow. The whole system reads as precise and restrained, and that precision is the point, because it signals a builder who cares about exactness. It runs in both light and dark, where light is limestone paper with graphite ink and dark is near-black paper with warm off-white ink, and the accent brightens from a deep vermilion in light to a hotter orange in dark so it stays legible against the darker paper.

The world is intentionally editorial and instrument-like, and it is defined as much by what it refuses as by what it uses. It refuses decorative accent washes, soft pillowy card corners, looping motion, and faked mono bold weights. Instrument Serif exists for exactly one italic gesture per surface, never for body copy, so its rarity keeps it expressive.

**Key Characteristics:**
- Limestone paper, graphite ink, and hairline rules carry the structure; color is not the structure.
- Exactly one accent, Signal Orange, reserved for data, state, and action.
- Sharp plates: radii top out around 8 to 10px, never soft 1rem-plus corners.
- Flat by default; depth is a hairline or a small lift on state, not ambient shadow.
- Monospace readouts with tabular numerals for anything measured or counted.
- One serif italic gesture per surface, and no more.

## Colors

The palette is a warm neutral field of limestone and graphite with a single hot accent, and every non-neutral color beyond that accent is a semantic status tone rather than decoration.

### Primary
- **Signal Orange** (`#C93F19` light, `#FF6B3B` dark): the one accent. It marks links, live indicators, active and selected states, focus rings, the brand dot, and quote borders. It is the only color allowed to pull the eye, and it is never used as a fill behind large areas.
- **Signal Soft** (`#F6E0D7` light, `#462214` dark): a low-tint wash of the accent for chip and badge backgrounds and soft hover states, so the accent can be present without shouting.

### Neutral
- **Limestone Paper** (`#F6F5F1` light, `#151412` dark): the primary background across the whole site.
- **Paper Alt** (`#EFEDE6` light, `#1C1B18` dark): secondary background for chips, code blocks, insets, and subtle panels.
- **Paper Raised** (`color-mix(--home-paper 92%, --home-elev-mix)`): a theme-aware lifted surface for cards and panels, one step above the background. It darkens in dark mode rather than lightening, which is the entire reason it is a mix toward `--home-elev-mix` and never toward literal white.
- **Graphite Ink** (`#191813` light, `#ECEAE2` dark): primary text and strong fills.
- **Ink Muted** (`#6F6B60` light, `#9B9585` dark): secondary and metadata text.
- **Stone** (`#D8D4C9` light, `#45423B` dark): decorative borders and subtle fills where a hairline rule would be too faint.
- **Rule** (`rgba(25,24,19,0.14)` light, `rgba(236,234,226,0.16)` dark): the standard hairline for borders and dividers, the workhorse of the whole system.

### Tertiary (status)
- **Positive** (`#059669` light, `#34D399` dark): gains, wins, success, passing states.
- **Warning** (`#D97706` light, `#FBBF24` dark): caution, ties, deadlines.
- **Negative** (`#DC2626` light, `#F87171` dark): losses, errors, failing states.

### Named Rules
**The One Signal Rule.** Signal Orange appears on no more than about 10% of any screen and only where something is genuinely data, state, or action. Its rarity is what makes it read as a signal. If it is being used as a decorative fill or a section background, it is being used wrong.

**The Mix-Toward-Token Rule.** Intermediate tones are produced with `color-mix()` toward another token, never toward literal `white` or `black`. Elevated surfaces mix toward `--home-elev-mix`, which flips to white in light and black in dark, so a lifted panel darkens correctly in dark mode instead of glowing.

**The Legacy-Accent Prohibition.** The old accents `--home-haze` (blue), `--home-acid` (yellow-green), and `--home-moss` survive only as token definitions for pre-redesign consumers. Do not use them in new work. Categorical needs resolve to ink and stone mixes, and status resolves to the positive, warning, and negative tokens.

## Typography

**Display Font:** Instrument Sans (with system-ui, sans-serif)
**Serif Accent:** Instrument Serif (with Georgia, serif)
**Label / Mono Font:** Fragment Mono (with ui-monospace, monospace)

**Character:** Instrument Sans does nearly all the work, from oversized display headlines down to body and dense dashboard text, tightened with negative tracking at large sizes so headlines feel set rather than typed. Fragment Mono carries the instrument's readouts and micro-labels, and Instrument Serif appears italic exactly once per surface as a single expressive gesture.

### Hierarchy
- **Display** (600, `clamp(2.85rem, 5.8rem)`, line-height ~1, `-0.08em`): hero headings and the wordmark. Uppercase for the wordmark at up to `-0.08em` tracking.
- **Headline** (600, `clamp(2.15rem, 4.2rem)`, `-0.065em`, max ~12ch): section titles.
- **Title** (600, `clamp(1.55rem, 2.1rem)`, `-0.05em`): project and writing card titles.
- **Body** (400, `clamp(1.02rem, 1.16rem)`, line-height 1.65, max ~40rem measure): standard reading copy.
- **Serif Manifesto** (400, `clamp(3rem, 6.4rem)`, `-0.08em`): large ghost-weight display moments; the italic word inside uses Instrument Serif at full ink.
- **Label** (400, `0.72rem`, `+0.14em`, uppercase): mono kickers, metadata, and micro-labels above headings.

Micro-type is tokenized and never arbitrary: `text-3xs` (10px) and `text-2xs` (11px) are fixed and non-fluid for dense labels and table cells, and `text-1xs` (12px) exists for labels that must not scale. Never ship a raw `text-[Npx]` value.

### Named Rules
**The One Gesture Rule.** Instrument Serif italic appears at most once per surface, as a single dek word or a closing statement, and never as body copy. One gesture keeps it expressive; two make it decoration.

**The Honest Mono Rule.** Fragment Mono is weight 400 only. Do not fake bold mono by stacking weight; if emphasis is needed, use Instrument Sans instead.

## Layout

The spatial model is a centered editorial column at one of three widths, chosen by reading density. The primary shell (`.home-shell`) caps at 86rem for full-width sections, the narrow shell at 76rem for intermediate sections, and the tight shell at 70rem for dense reading. All shells are full width with auto inline margins and responsive inline padding that steps from 1rem, to 1.5rem at the small breakpoint, to 2rem at large.

Vertical rhythm is fluid and restrained, with standard sections using `padding-block: clamp(1.25rem, 2vw, 2rem)`, and the spacing scale runs `xs` 0.5rem through `4xl` 6rem for internal spacing. The root wrapper (`.home-page`) is flat limestone paper with no ambient gradient, because surfaces are meant to earn emphasis through hairlines and type rather than through washes. Section heading and copy pairs frequently use a two-column intro grid on wide screens that collapses to a single column on mobile.

## Elevation & Depth

The system is flat by default and conveys depth through hairline rules, tonal layering (paper, then paper-alt, then paper-raised), and small state-driven lifts, not through ambient shadow. Shadows exist in the token scale but are soft and low, and they appear mostly as a response to state such as a card lifting on hover.

### Shadow Vocabulary
- **Subtle** (`--shadow-sm`, `0 1px 2px rgba(0,0,0,0.05)` light): resting shadow for the softer card variants.
- **Card** (`--shadow-md`, `0 4px 6px -1px rgba(0,0,0,0.07)` light): default card shadow where one is used.
- **Lifted** (`--shadow-lg`, `0 10px 15px -3px rgba(0,0,0,0.08)` light): hover and elevated panels.
- **Floating** (`--shadow-xl`, `0 20px 25px -5px rgba(0,0,0,0.08)` light): the headshot frame and rare floating surfaces. Dark mode uses heavier alpha counterparts.

### Named Rules
**The Flat-By-Default Rule.** Surfaces sit flat at rest and are separated by hairline rules and tonal steps. A shadow or a lift is a response to state (hover, focus, elevation), not a resting decoration. The canonical instrument panel is a `--home-rule` hairline border over a `--home-paper-raised` fill with a 10px radius and no resting shadow at all.

## Shapes

The form language is sharp editorial plates. Radii are deliberately small, running `sm` 2px through `3xl` 8px, with a `panel` value of 10px for the signature hairline panel and a `pill` of 999px reserved for genuinely round controls such as buttons, chips, and the live dot. Borders are almost always a single hairline in `--home-rule`, and structural emphasis comes from a heavier ink rule or a 3px signal-orange left border on quotes and callouts. There is no clipping, no organic geometry, and no soft pillowy corners.

### Named Rules
**The Sharp Plate Rule.** Card and panel corners stay at or below roughly 8 to 10px. Do not reintroduce soft 1rem-plus card radii; the sharpness is what makes the surfaces read as instrument plates rather than as generic web cards. Buttons and chips are the exception and stay fully pill-shaped.

## Components

Components feel precise and restrained. They lead with hairlines and type, hold a single accent in reserve, and respond to state cleanly rather than decoratively.

### Buttons
- **Shape:** fully pill (999px), 48px minimum height, Instrument Sans 600 at ~0.95rem.
- **Primary:** graphite-ink fill with limestone-paper text; on hover the fill blends toward Signal Orange.
- **Secondary:** limestone-paper background with a stone hairline border and ink text; on hover it gains a Signal Soft tint.
- **Dark:** a transparent variant with dark-ink text for use on dark sections.
- **Hover / Focus:** transitions are scoped to background, border, color, and transform (never `transition-all` in shared primitives); focus-visible shows a 3px accent ring.

### Chips
- **Style:** Signal Soft background with graphite-ink text, pill-shaped, used for tags (`resume-chip`) and small numbered badges (`home-pill`).
- **State:** active or selected chips read through the accent; inactive chips stay in ink and stone tones rather than a second color.

### Cards / Containers
- **Corner Style:** the signature instrument panel is a 10px radius; a softer legacy card variant exists at larger radii but new work uses the sharp panel.
- **Background:** `--home-paper-raised` (theme-aware lifted paper) over the page's limestone paper.
- **Shadow Strategy:** flat at rest per the Flat-By-Default Rule; a small `translateY(-4px)` lift with a `--shadow-lg` on hover for interactive cards.
- **Border:** a single `--home-rule` hairline.
- **Internal Padding:** ~1.5rem for project cards; smaller inset cards use ~1.1rem.

### Inputs / Fields
- **Style:** paper-alt background, a `--home-rule` hairline border, small 2px radius.
- **Focus:** border shifts toward the accent with a 3px accent focus ring; no glow.

### Navigation
- **Style:** a hairline-bottom-bordered header. The brand is Instrument Sans ~640 in normal case with a Signal Orange dot prefix. Nav links are quiet ink-muted sans; the active link gets an inset 2px Signal Orange underline; the mobile menu panel sits on `--home-paper-raised`.

### Signature: Mono Readout Row
The instrument's defining custom pattern is the mono readout row, a line of Fragment Mono label plus a tabular-numeral value, often stacked into stat strips and ledger rows separated by hairline cell dividers. This is where "instrument" becomes literal: measured values are set in mono with aligned digits so columns of numbers read like a real gauge.

## Do's and Don'ts

### Do:
- **Do** use the `--home-*` tokens directly in new code (`--home-paper`, `--home-ink`, `--home-ink-muted`, `--home-rule`, `--home-signal`), never raw hex.
- **Do** keep Signal Orange to data, state, and action, and to roughly 10% of a screen at most.
- **Do** build depth from hairlines and tonal steps first, and add a shadow or lift only on state.
- **Do** set measured values in Fragment Mono with tabular numerals, and keep it at weight 400.
- **Do** mix intermediate tones toward another token or toward `--home-elev-mix`, so dark mode inverts correctly.
- **Do** keep card and panel radii sharp (≤10px), 44px minimum touch targets, one page-level `h1` and `main` per self-shell route, and a reduced-motion guard on every animation.

### Don't:
- **Don't** use Signal Orange, or any color, as a decorative background wash or gradient.
- **Don't** reintroduce soft 1rem-plus card corners; the plates stay sharp.
- **Don't** use the legacy accents `--home-haze`, `--home-acid`, or `--home-moss` in new work.
- **Don't** `color-mix()` toward literal `white` or `black`; it breaks the lifted surfaces in dark mode.
- **Don't** use Instrument Serif for body copy or use it more than once per surface, and don't fake a bold Fragment Mono weight.
- **Don't** ship arbitrary `text-[Npx]` micro-type or `transition-all` in shared primitives.
