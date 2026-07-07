// Single source of truth for how portfolio projects are bucketed into
// product categories. Both the /portfolio grid (PortfolioInstrument) and the homepage
// "Live tools" directory (HomeInstrument) read from here so the two surfaces never
// drift on which tool lives in which category.

export type ToolCategoryId =
  | "fintech"
  | "ai"
  | "decision"
  | "pulse"
  | "science"
  | "sports"
  | "civic"
  | "lifestyle";

export interface ToolCategory {
  id: ToolCategoryId;
  label: string;
  slugs: ReadonlySet<string>;
}

const FINTECH = new Set([
  "investment-analytics-platform",
  "interchange-iq",
  "budget-planner",
]);
const AI = new Set([
  "frontier-model-tracker",
  "ai-dev-tool-ecosystem",
  "github-trending-pulse",
]);
const DECISION = new Set([
  "decision-lab",
  "mba-role-tracker",
]);
const PULSE = new Set([
  "news-pulse-dashboard",
  "bay-area-transit-pulse",
  "tech-startup-tracker",
]);
const SCIENCE = new Set([
  "spacex-mission-control",
  "earthquake-pulse",
]);
const SPORTS = new Set([
  "premier-league-pulse",
  "la-liga-pulse",
  "fantasy-football-analytics",
  "nfl-pulse",
  "mlb-pulse",
  "nba-pulse",
  "pga-tour-pulse",
  "formula-1-pulse",
  "fantasy-formula-1-optimizer",
  "world-cup-pulse",
  "march-madness-2026",
]);
const CIVIC = new Set(["polling-aggregator"]);
const LIFESTYLE = new Set([
  "food-map",
  "museum-log",
  "wine-cellar",
  "recipe-finder",
  "travel-planner",
  "travel-deal-lab",
]);

// Display order is intentional: the strongest product surfaces (fintech,
// AI/dev, decision) lead, the data pulses and sports follow, and the lighter
// lifestyle tools close.
export const TOOL_CATEGORY_DEFS: ToolCategory[] = [
  { id: "fintech", label: "Fintech", slugs: FINTECH },
  { id: "ai", label: "AI & dev tools", slugs: AI },
  { id: "decision", label: "Decision tools", slugs: DECISION },
  { id: "pulse", label: "News & data", slugs: PULSE },
  { id: "science", label: "Science & space", slugs: SCIENCE },
  { id: "sports", label: "Sports", slugs: SPORTS },
  { id: "civic", label: "Civic / Polls", slugs: CIVIC },
  { id: "lifestyle", label: "Lifestyle", slugs: LIFESTYLE },
];

/**
 * Map a project slug to its category. Falls back to "lifestyle" for any slug
 * that hasn't been bucketed yet, so a newly added project still lands in a
 * real category rather than throwing.
 */
export function classifyToolSlug(slug: string): ToolCategoryId {
  for (const def of TOOL_CATEGORY_DEFS) {
    if (def.slugs.has(slug)) {
      return def.id;
    }
  }
  return "lifestyle";
}

export function getToolCategoryLabel(id: ToolCategoryId): string {
  return TOOL_CATEGORY_DEFS.find((c) => c.id === id)?.label ?? "Project";
}

// ---- Homepage "Live tools" directory ------------------------------------

/** Minimal structural shape so this module never imports the case-study data. */
export interface ProjectLike {
  slug: string;
  title: string;
  link?: string | null;
}

export interface LiveToolEntry {
  slug: string;
  title: string;
  href: string;
  isExternal: boolean;
  categoryId: ToolCategoryId;
  categoryLabel: string;
}

export interface LiveToolGroup {
  id: ToolCategoryId;
  label: string;
  tools: LiveToolEntry[];
}

function isExternalLink(link: string): boolean {
  return /^https?:\/\//i.test(link);
}

/**
 * Build the homepage live-tools directory from the portfolio projects. A "live
 * tool" is any project with a `link` (an on-site route or an external app) —
 * the same definition the hero uses for its "live tools" count, so the count
 * and the directory always agree. Groups come back in TOOL_CATEGORY_DEFS order
 * and projects keep their incoming order within each group.
 */
export function getLiveToolGroups(projects: ProjectLike[]): LiveToolGroup[] {
  const byCategory = new Map<ToolCategoryId, LiveToolEntry[]>();

  for (const project of projects) {
    const link = project.link?.trim();
    if (!link) continue;

    const categoryId = classifyToolSlug(project.slug);
    const entry: LiveToolEntry = {
      slug: project.slug,
      title: project.title,
      href: link,
      isExternal: isExternalLink(link),
      categoryId,
      categoryLabel: getToolCategoryLabel(categoryId),
    };

    const bucket = byCategory.get(categoryId);
    if (bucket) {
      bucket.push(entry);
    } else {
      byCategory.set(categoryId, [entry]);
    }
  }

  return TOOL_CATEGORY_DEFS.flatMap((def) => {
    const tools = byCategory.get(def.id);
    return tools && tools.length > 0
      ? [{ id: def.id, label: def.label, tools }]
      : [];
  });
}
