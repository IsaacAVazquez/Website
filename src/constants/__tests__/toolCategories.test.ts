import {
  classifyToolSlug,
  getLiveToolGroups,
  getToolCategoryLabel,
  TOOL_CATEGORY_DEFS,
  type ProjectLike,
} from "@/constants/toolCategories";

describe("classifyToolSlug", () => {
  it("buckets known slugs into their declared category", () => {
    expect(classifyToolSlug("investment-analytics-platform")).toBe("fintech");
    expect(classifyToolSlug("earthquake-pulse")).toBe("pulse");
    expect(classifyToolSlug("nba-pulse")).toBe("sports");
    expect(classifyToolSlug("frontier-model-tracker")).toBe("ai");
    expect(classifyToolSlug("decision-lab")).toBe("decision");
    expect(classifyToolSlug("polling-aggregator")).toBe("civic");
    expect(classifyToolSlug("wine-cellar")).toBe("lifestyle");
  });

  it("falls back to lifestyle for an uncategorized slug", () => {
    expect(classifyToolSlug("some-brand-new-project")).toBe("lifestyle");
  });
});

describe("getToolCategoryLabel", () => {
  it("returns the human label for each category id", () => {
    for (const def of TOOL_CATEGORY_DEFS) {
      expect(getToolCategoryLabel(def.id)).toBe(def.label);
    }
  });
});

describe("getLiveToolGroups", () => {
  const projects: ProjectLike[] = [
    { slug: "investment-analytics-platform", title: "Investments", link: "/investments" },
    { slug: "case-study-only", title: "Case Study", link: null },
    { slug: "blank-link", title: "Blank", link: "   " },
    { slug: "nba-pulse", title: "NBA Pulse", link: "/nba" },
    { slug: "external-tool", title: "External", link: "https://example.com/app" },
  ];

  it("includes only projects with a real link", () => {
    const groups = getLiveToolGroups(projects);
    const slugs = groups.flatMap((g) => g.tools.map((t) => t.slug));
    expect(slugs).toContain("investment-analytics-platform");
    expect(slugs).toContain("nba-pulse");
    expect(slugs).not.toContain("case-study-only");
    expect(slugs).not.toContain("blank-link");
  });

  it("flags external links and keeps internal routes internal", () => {
    const groups = getLiveToolGroups(projects);
    const tools = groups.flatMap((g) => g.tools);
    const external = tools.find((t) => t.slug === "external-tool");
    const internal = tools.find((t) => t.slug === "nba-pulse");
    expect(external?.isExternal).toBe(true);
    expect(internal?.isExternal).toBe(false);
  });

  it("orders groups by the canonical category order", () => {
    const groups = getLiveToolGroups(projects);
    const order = groups.map((g) => g.id);
    const expectedOrder = TOOL_CATEGORY_DEFS.map((d) => d.id).filter((id) =>
      order.includes(id),
    );
    expect(order).toEqual(expectedOrder);
  });

  it("omits empty categories", () => {
    const groups = getLiveToolGroups([
      { slug: "decision-lab", title: "Decision Lab", link: "/decision-lab" },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe("decision");
    expect(groups[0].tools).toHaveLength(1);
  });
});
