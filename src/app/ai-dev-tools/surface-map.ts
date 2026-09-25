import type { AiDevTool } from "./ai-dev-tools-data";

export interface SurfaceMapCell {
  pricing: string;
  tools: AiDevTool[];
}

export interface SurfaceMapRow {
  category: string;
  cells: SurfaceMapCell[];
}

const OTHER = "Other";

/**
 * Groups tools by category (rows) and pricing model (columns), in the order
 * the caller gives. A tool whose category or pricing model isn't in the
 * given list lands in an "Other" row or column, and that row or column is
 * only added when at least one tool needs it.
 */
export function surfaceMap(
  tools: AiDevTool[],
  categories: string[],
  pricing: string[]
): SurfaceMapRow[] {
  const categorySet = new Set(categories);
  const pricingSet = new Set(pricing);
  const rowKeys = categories.concat(
    tools.some((tool) => !categorySet.has(tool.category)) ? [OTHER] : []
  );
  const colKeys = pricing.concat(
    tools.some((tool) => !pricingSet.has(tool.pricingModel)) ? [OTHER] : []
  );

  return rowKeys.map((category) => ({
    category,
    cells: colKeys.map((pricingKey) => ({
      pricing: pricingKey,
      tools: tools.filter((tool) => {
        const toolCategory = categorySet.has(tool.category) ? tool.category : OTHER;
        const toolPricing = pricingSet.has(tool.pricingModel) ? tool.pricingModel : OTHER;
        return toolCategory === category && toolPricing === pricingKey;
      }),
    })),
  }));
}
