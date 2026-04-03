import companyNames from "@/data/investmentCompanyNames.json";

const CURATED_COMPANY_NAMES = companyNames as Record<string, string>;

export function getCuratedCompanyName(
  symbol: string | null | undefined
): string | undefined {
  const upperSymbol = symbol?.trim().toUpperCase();
  if (!upperSymbol) {
    return undefined;
  }

  const companyName = CURATED_COMPANY_NAMES[upperSymbol];
  return typeof companyName === "string" && companyName.trim().length > 0
    ? companyName
    : undefined;
}
