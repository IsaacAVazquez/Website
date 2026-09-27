import { surfaceMap } from "../surface-map";
import type { AiDevTool } from "../ai-dev-tools-data";

const tool = (id: string, category: string, pricingModel: string) =>
  ({ id, name: id, category, pricingModel }) as unknown as AiDevTool;

describe("surfaceMap", () => {
  it("groups each tool into its category row and pricing column", () => {
    const rows = surfaceMap(
      [tool("cursor", "ide", "subscription"), tool("cline", "ide", "free")],
      ["ide", "terminal-agent"],
      ["free", "subscription"]
    );
    expect(rows).toHaveLength(2);
    const ideRow = rows.find((r) => r.category === "ide")!;
    expect(ideRow.cells.find((c) => c.pricing === "subscription")!.tools.map((t) => t.id)).toEqual([
      "cursor",
    ]);
    expect(ideRow.cells.find((c) => c.pricing === "free")!.tools.map((t) => t.id)).toEqual(["cline"]);
  });

  it("keeps the given category and pricing order", () => {
    const rows = surfaceMap([], ["cloud-agent", "ide"], ["enterprise", "free"]);
    expect(rows.map((r) => r.category)).toEqual(["cloud-agent", "ide"]);
    expect(rows[0].cells.map((c) => c.pricing)).toEqual(["enterprise", "free"]);
  });

  it("puts a tool outside the given lists into an Other row or column, only when needed", () => {
    const withOther = surfaceMap(
      [tool("weird", "enterprise-platform", "usage-based")],
      ["ide"],
      ["free"]
    );
    expect(withOther.map((r) => r.category)).toEqual(["ide", "Other"]);
    expect(withOther[1].cells.map((c) => c.pricing)).toEqual(["free", "Other"]);
    expect(withOther[1].cells.find((c) => c.pricing === "Other")!.tools.map((t) => t.id)).toEqual([
      "weird",
    ]);

    const withoutOther = surfaceMap([tool("cursor", "ide", "free")], ["ide"], ["free"]);
    expect(withoutOther.map((r) => r.category)).toEqual(["ide"]);
    expect(withoutOther[0].cells.map((c) => c.pricing)).toEqual(["free"]);
  });

  it("returns rows with empty cells for empty input", () => {
    expect(surfaceMap([], ["ide"], ["free", "subscription"])).toEqual([
      { category: "ide", cells: [{ pricing: "free", tools: [] }, { pricing: "subscription", tools: [] }] },
    ]);
  });
});
