/**
 * Design-system adherence rules, imported from the Claude Design project
 * "Working Instrument Design System" (00466307-2745-4bc3-b1fc-7af6cadd0349).
 *
 * The design app publishes these as `_adherence.oxlintrc.json`, an oxlint
 * config generated from the same prop contracts that `.design-sync/gen-contracts.mjs`
 * uploads. This repo lints with ESLint and has no oxlint dependency, so the
 * rules are ported here instead of the config being copied verbatim. They are
 * core ESLint rules (`no-restricted-syntax`) and the selectors are esquery, which
 * is the same selector language oxlint implements, so the port is mechanical.
 *
 * Two deliberate departures from the published config:
 *
 * 1. Its `no-restricted-imports` block forbids reaching past `index.js` into
 *    `components/<layer>/<Name>/**`. That is the *bundle's* layout, not this
 *    repo's — here the components are the original sources under
 *    `src/components/{ui,editorial,football}` and there is no barrel that app
 *    code imports through. The rule has no meaning on this side of the sync and
 *    is dropped rather than mistranslated.
 *
 * 2. The published selectors are written out one per component per constraint.
 *    They are derived data, so this file keeps the contracts as a table and
 *    generates the selectors. Regenerating after a `gen-contracts.mjs` run means
 *    editing the table, not 500 lines of selector strings.
 *
 * Everything is `warn`, matching the published config. These are advisory: a
 * stale contract should not be able to break the build. If a warning looks
 * wrong, check whether the component's real props moved and
 * `.design-sync/gen-contracts.mjs` has not been re-run — `dtsPropsFor` going
 * stale is a known failure mode (see `.design-sync/NOTES.md`).
 */

/**
 * Props every JSX element may carry regardless of its declared contract.
 * `className`, `style`, and `children` are also declared by many components;
 * listing them here too is harmless and matches the published config.
 */
const UNIVERSAL_PROPS = ["key", "ref", "className", "style", "children"];

/**
 * Components whose real props type extends a native HTML attribute set and
 * spreads the rest onto the element, so any valid DOM attribute is legitimate.
 *
 * The published contract cannot express this. `gen-contracts.mjs` serializes
 * `ModernButtonProps`, which is `ModernButtonAsButton | ModernButtonAsLink`,
 * and flattens the union down to the props both members declare, dropping
 * every `ButtonHTMLAttributes`/`AnchorHTMLAttributes` member. Checked against
 * real call sites that pass `onClick`, `type`, `disabled`, `target`, and
 * `rel`, all of which the component genuinely accepts and forwards.
 *
 * These keep their enum checks, which are the part worth enforcing, and skip
 * only the undeclared-prop check.
 */
const SPREADS_DOM_PROPS = new Set(["ModernButton"]);

/**
 * The 39 synced components, keyed by display name.
 *
 * `props` is the declared prop list. `enums` maps a prop to its allowed string
 * literal values. Both come from the design project's published contracts,
 * which are generated from this repo's own sources.
 */
const COMPONENT_CONTRACTS = {
  // --- general ------------------------------------------------------------
  AuthorBio: {
    props: [
      "name", "title", "image", "bio", "credentials", "expertise", "social",
      "variant", "showImage", "showSocial", "className",
    ],
    enums: { variant: ["inline", "compact", "full", "light"] },
  },
  Badge: {
    props: ["variant", "size", "children", "glow", "href", "className", "id", "style"],
    enums: {
      variant: ["default", "success", "warning", "error", "outline"],
      size: ["sm", "md", "lg"],
    },
  },
  Chip: {
    props: ["tone", "children", "className", "id", "style"],
    enums: { tone: ["default", "signal"] },
  },
  DropdownMenu: {
    props: ["children", "dir", "open", "defaultOpen", "onOpenChange", "modal"],
    enums: { dir: ["ltr", "rtl"] },
  },
  Heading: { props: ["className", "children", "as", "level"], enums: {} },
  Kicker: {
    props: ["variant", "children", "className", "id", "style"],
    enums: { variant: ["dot", "plain"] },
  },
  ModernButton: {
    props: [
      "href", "variant", "size", "children", "ariaLabel", "fullWidth",
      "className", "style", "id",
    ],
    enums: {
      variant: ["outline", "primary", "secondary", "ghost", "accent", "mono"],
      size: ["sm", "md", "lg"],
    },
  },
  Paragraph: { props: ["className", "children"], enums: {} },
  SectionIntro: {
    props: [
      "eyebrow", "title", "description", "actions", "headingLevel", "align",
      "size", "className", "titleClassName", "descriptionClassName",
    ],
    enums: { align: ["center", "left"], size: ["md", "lg"] },
  },
  ThemeToggle: { props: ["className"], enums: {} },
  WarmCard: {
    props: [
      "children", "className", "hover", "padding", "ariaLabel",
      "ariaDescription", "onClick",
    ],
    enums: { padding: ["sm", "md", "lg", "none", "xl"] },
  },

  // --- editorial ----------------------------------------------------------
  EditorialPillButton: {
    props: ["active", "children", "onClick", "title", "role", "ariaSelected", "size"],
    enums: { role: ["tab"], size: ["sm", "md"] },
  },
  InlineSectionLead: {
    props: ["kicker", "children", "maxWidthClassName"],
    enums: {},
  },
  InstrumentTape: {
    props: ["label", "items", "ariaLabel", "className", "emptyFallback"],
    enums: {},
  },
  StatusPanel: {
    props: ["title", "message", "tone", "icon", "statusRole", "action"],
    enums: { tone: ["default", "warning", "error"], statusRole: ["alert", "status"] },
  },
  UtilityStrip: { props: ["children"], enums: {} },

  // --- football -----------------------------------------------------------
  ClubDrawer: {
    props: [
      "club", "formSequence", "topScorers", "recentFixtures", "upcomingFixtures",
      "isLoadingDetail", "detailError", "onClose", "testId",
    ],
    enums: {},
  },
  CrestAvatar: {
    props: ["crest", "name", "size"],
    enums: { size: ["sm", "md", "lg"] },
  },
  EmptyPanel: { props: ["title", "description"], enums: {} },
  FixtureCard: {
    props: [
      "fixture", "contextTeamId", "onOpenTeam", "compact", "style",
      "periodLabel", "fallbackLabel",
    ],
    enums: {},
  },
  FixtureGroupSection: {
    props: [
      "title", "description", "fixtures", "contextTeamId", "onOpenTeam",
      "getFallbackLabel",
    ],
    enums: {},
  },
  FixtureLedgerSection: { props: ["groups", "onOpenTeam"], enums: {} },
  GoalsPulseStrip: { props: ["data", "capLabel", "className"], enums: {} },
  InfoChip: { props: ["label"], enums: {} },
  LeaderLedger: { props: ["title", "entries", "unit", "emptyLabel"], enums: {} },
  LeaderList: { props: ["leaders", "statLabel", "clubLookup"], enums: {} },
  MetricCard: { props: ["label", "value", "detail", "icon", "className"], enums: {} },
  ResultsTape: {
    props: ["recentFixtures", "upcomingFixtures", "label", "emptyFallback", "className"],
    enums: {},
  },
  SegmentedTabs: {
    props: ["tabs", "activeId", "onChange", "ariaLabel", "idPrefix", "panelId", "className"],
    enums: {},
  },
  StatCard: {
    props: ["eyebrow", "title", "metric", "detail", "icon", "variant"],
    enums: { variant: ["compact", "full"] },
  },
  StatFascia: { props: ["items", "dense", "className"], enums: {} },
  SurfaceCard: { props: ["children", "className"], enums: {} },
  TeamResultPill: { props: ["result"], enums: { result: ["W", "D", "L"] } },
};

/** Escape a literal for embedding in an esquery regex alternation. */
const escapeForRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Turn the contract table into `no-restricted-syntax` entries.
 *
 * Two selector shapes per component, mirroring the published config:
 *  - an undeclared-prop check, negating the union of declared + universal props
 *  - one allowed-values check per enum prop
 *
 * Both negate a regex, so they fire only on a name or value outside the set.
 * Spread attributes (`{...rest}`) parse as JSXSpreadAttribute with no
 * JSXIdentifier child, so they are skipped rather than falsely flagged.
 */
function buildComponentRules() {
  const rules = [];

  for (const [name, { props, enums }] of Object.entries(COMPONENT_CONTRACTS)) {
    if (!SPREADS_DOM_PROPS.has(name)) {
      const allowed = [...props, ...UNIVERSAL_PROPS]
        .map(escapeForRegex)
        .join("|");
      rules.push({
        selector:
          `JSXOpeningElement[name.name='${name}'] > JSXAttribute > ` +
          `JSXIdentifier[name!=/^(?:${allowed})$/]`,
        message:
          `<${name}> doesn't accept that prop. Declared props: ${props.join(", ")}.`,
      });
    }

    for (const [prop, values] of Object.entries(enums)) {
      const union = values.map(escapeForRegex).join("|");
      const quoted = values.map((value) => `'${value}'`).join(" | ");
      rules.push({
        selector:
          `JSXOpeningElement[name.name='${name}'] > ` +
          `JSXAttribute[name.name='${prop}'] > Literal[value!=/^(?:${union})$/]`,
        message: `<${name}> ${prop} must be one of ${quoted}.`,
      });
    }
  }

  return rules;
}

/**
 * The design system ships exactly three families, loaded by `next/font/google`
 * in `src/app/layout.tsx`. Anything else in a `font-family` declaration is not
 * available to a design built against this system.
 *
 * Scoped to the three DS layers rather than all of `src`: the Catalog 97 routes
 * are a different design language with their own `--c97-font-*` stack, and
 * several standalone dashboards predate the system.
 */
const FONT_FAMILY_RULE = {
  selector:
    "Literal[value=/font-family\\s*:\\s*(?!['\"]?(?:Instrument Sans|Instrument Serif|Fragment Mono))/i]",
  message:
    "Font not provided by the design system. Available: Instrument Sans, Instrument Serif, Fragment Mono.",
};

export const dsComponentContracts = COMPONENT_CONTRACTS;

/**
 * Files that define their own component sharing a design-system name.
 *
 * The selectors match on the JSX element name alone, which is all esquery can
 * see, so they cannot tell a design-system `SurfaceCard` from a local one
 * declared in the same file. The published oxlint config has the same blind
 * spot. Where a route rolls its own primitive the contract does not apply and
 * the file is skipped rather than every call site being flagged.
 *
 * Verified by scanning `src` for a local declaration of any of the 39 names:
 * these two are the only genuine shadows. `FixtureLedger.tsx` and
 * `dropdown-menu.tsx` also turn up, but those are the canonical modules living
 * under a filename that does not match the export, not shadows.
 */
const SHADOWED_BY_LOCAL_COMPONENTS = [
  // Declares its own SurfaceCard and SectionIntro, imports neither.
  "src/app/march-madness-2026/march-madness-client.tsx",
  // Declares its own MetricCard.
  "src/app/enablement-assistant/enablement-assistant-client.tsx",
];

/**
 * Prop and variant contracts. Applied repo-wide across TSX so a misuse is
 * caught wherever a design-system component is rendered.
 */
export const dsAdherenceConfig = {
  files: ["src/**/*.{ts,tsx}"],
  ignores: SHADOWED_BY_LOCAL_COMPONENTS,
  rules: {
    "no-restricted-syntax": ["warn", ...buildComponentRules()],
  },
};

/**
 * Font restriction, scoped to the design system's own source layers.
 */
export const dsFontConfig = {
  files: [
    "src/components/ui/**/*.{ts,tsx}",
    "src/components/editorial/**/*.{ts,tsx}",
    "src/components/football/**/*.{ts,tsx}",
  ],
  rules: {
    "no-restricted-syntax": ["warn", FONT_FAMILY_RULE],
  },
};
