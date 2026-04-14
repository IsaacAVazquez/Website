import { MBA_ROLE_FAMILIES } from "@/constants/mba-role-taxonomy";
import type { MBAJobRoleFamily, MBAJobRoleType } from "@/types/mba-jobs";

interface MBAJobMatchInput {
  title: string;
  department?: string | null;
  location?: string | null;
  snippet?: string | null;
  employmentType?: string | null;
}

export interface MBAJobMatch {
  roleFamilies: MBAJobRoleFamily[];
  roleType: MBAJobRoleType;
}

const INTERNSHIP_TERMS = [
  "intern",
  "internship",
  "summer associate",
  "summer internship",
  "campus",
  "student",
  "graduate intern",
  "mba intern",
  "summer",
  "co op",
] as const;

const EXPLICIT_INTERNSHIP_CONTEXT_TERMS = [
  "internship",
  "summer associate",
  "summer internship",
  "graduate intern",
  "mba intern",
  "mba internship",
  "co op",
] as const;

const MBA_TERMS = [
  "mba",
  "master of business administration",
  "graduate business",
  "haas",
  "wharton",
  "gsb",
] as const;

const BUSINESS_PROGRAM_TERMS = [
  "leadership program",
  "leadership development",
  "rotational program",
  "general management",
  "management development",
] as const;

const NEGATIVE_TITLE_TERMS = [
  "software engineer",
  "software engineering",
  "engineer",
  "engineering manager",
  "developer",
  "designer",
  "design",
  "frontend engineer",
  "front end engineer",
  "backend engineer",
  "back end engineer",
  "full stack engineer",
  "fullstack engineer",
  "mobile engineer",
  "ios engineer",
  "android engineer",
  "platform engineer",
  "infrastructure engineer",
  "quality engineer",
  "qa engineer",
  "test engineer",
  "devops engineer",
  "recruiter",
  "recruiting",
  "talent",
  "legal",
  "counsel",
  "attorney",
  "paralegal",
  "support",
  "customer success",
  "hr",
  "human resources",
  "people partner",
  "account executive",
  "sales representative",
  "solutions engineer",
  "research scientist",
  "machine learning",
  "data engineer",
  "data scientist",
  "ux",
  "ui",
] as const;

const NEGATIVE_CONTEXT_TERMS = [
  "engineering",
  "software engineering",
  "design",
  "recruiting",
  "legal",
  "customer support",
  "customer success",
  "human resources",
  "people team",
  "sales development",
  "technical support",
  "technical program manager",
  "solutions architecture",
  "software",
  "hardware",
  "security",
  "frontend",
  "front end",
  "backend",
  "back end",
  "full stack",
  "fullstack",
  "distributed systems",
  "computer science",
  "coding",
  "android",
  "ios",
] as const;

const EARLY_CAREER_TITLE_TERMS = [
  "undergraduate",
  "undergrad",
  "new grad",
  "new graduate",
  "recent graduate",
  "student program",
  "student programs",
  "campus program",
  "campus programs",
  "campus hire",
  "university graduate",
  "university recruiting",
] as const;

const EARLY_CAREER_CONTEXT_TERMS = [
  "undergraduate",
  "undergrad",
  "undergraduate students",
  "undergraduate program",
  "bachelor degree",
  "bachelor s degree",
  "bachelors degree",
  "campus program",
  "campus recruiting",
  "student program",
  "student programs",
] as const;

const ROLE_MATCH_TERMS: Record<MBAJobRoleFamily, readonly string[]> = {
  product: [
    "product manager",
    "product management",
    "associate product manager",
    "apm",
    "product owner",
    "product lead",
    "pm",
  ],
  "product-marketing": [
    "product marketing",
    "product marketing manager",
    "pmm",
  ],
  strategy: [
    "strategy",
    "strategic planning",
    "strategic initiatives",
    "corporate strategy",
    "business strategy",
  ],
  operations: [
    "operations",
    "business operations",
    "business ops",
    "bizops",
    "revenue operations",
    "revenue ops",
    "sales operations",
    "sales ops",
    "program operations",
    "program ops",
    "program manager",
    "program management",
  ],
  growth: [
    "growth",
    "growth marketing",
    "lifecycle",
    "acquisition",
    "retention",
    "monetization",
  ],
  finance: [
    "finance",
    "strategic finance",
    "corporate finance",
    "fp&a",
    "fp a",
    "fp and a",
    "financial planning",
    "treasury",
  ],
  "business-development": [
    "business development",
    "partnerships",
    "partner manager",
    "partnership manager",
    "corporate development",
    "corp dev",
    "commercial strategy",
    "go to market",
    "gtm",
  ],
  analytics: [
    "analytics",
    "business analyst",
    "strategy and analytics",
    "operations analytics",
    "business intelligence",
    "data analyst",
  ],
  "chief-of-staff": [
    "chief of staff",
    "office of the ceo",
    "ceo office",
    "founder associate",
  ],
};

function normalizeMBAJobText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeMBAJobText(value: string): Set<string> {
  const normalized = normalizeMBAJobText(value);
  return normalized ? new Set(normalized.split(" ")) : new Set<string>();
}

function matchesTerm(normalizedText: string, tokens: Set<string>, term: string): boolean {
  const normalizedTerm = normalizeMBAJobText(term);
  if (!normalizedTerm) return false;
  if (!normalizedTerm.includes(" ")) {
    return tokens.has(normalizedTerm);
  }
  return normalizedText.includes(normalizedTerm);
}

function countMatches(
  normalizedText: string,
  tokens: Set<string>,
  terms: readonly string[]
): number {
  let count = 0;
  for (const term of terms) {
    if (matchesTerm(normalizedText, tokens, term)) {
      count += 1;
    }
  }
  return count;
}

function getMatchedRoleFamilies(
  normalizedText: string,
  tokens: Set<string>
): MBAJobRoleFamily[] {
  return MBA_ROLE_FAMILIES.filter((family) =>
    ROLE_MATCH_TERMS[family].some((term) => matchesTerm(normalizedText, tokens, term))
  );
}

export function matchMBAJobRole(input: MBAJobMatchInput): MBAJobMatch | null {
  const titleText = normalizeMBAJobText(input.title);
  const contextText = normalizeMBAJobText(
    [
      input.department,
      input.location,
      input.snippet,
      input.employmentType,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const fullText = [titleText, contextText].filter(Boolean).join(" ");

  const titleTokens = tokenizeMBAJobText(titleText);
  const contextTokens = tokenizeMBAJobText(contextText);
  const fullTokens = tokenizeMBAJobText(fullText);

  const titleFamilies = getMatchedRoleFamilies(titleText, titleTokens);
  const contextFamilies = getMatchedRoleFamilies(fullText, fullTokens);
  const roleFamilies = MBA_ROLE_FAMILIES.filter(
    (family) => titleFamilies.includes(family) || contextFamilies.includes(family)
  );

  const hasInternshipSignal =
    countMatches(titleText, titleTokens, INTERNSHIP_TERMS) > 0 ||
    countMatches(contextText, contextTokens, EXPLICIT_INTERNSHIP_CONTEXT_TERMS) > 0;
  const hasMBASignal = countMatches(fullText, fullTokens, MBA_TERMS) > 0;
  const hasBusinessProgramSignal =
    countMatches(fullText, fullTokens, BUSINESS_PROGRAM_TERMS) > 0;
  const hasExplicitMBASignal = hasMBASignal || hasBusinessProgramSignal;

  const titleNegativeCount = countMatches(titleText, titleTokens, NEGATIVE_TITLE_TERMS);
  const contextNegativeCount = countMatches(
    contextText,
    contextTokens,
    NEGATIVE_CONTEXT_TERMS
  );
  const titleEarlyCareerCount = countMatches(
    titleText,
    titleTokens,
    EARLY_CAREER_TITLE_TERMS
  );
  const contextEarlyCareerCount = countMatches(
    contextText,
    contextTokens,
    EARLY_CAREER_CONTEXT_TERMS
  );

  const positiveScore =
    roleFamilies.length * 4 +
    titleFamilies.length * 2 +
    (hasInternshipSignal ? 5 : 0) +
    (hasMBASignal ? 3 : 0) +
    (hasBusinessProgramSignal ? 2 : 0);
  const negativeScore =
    titleNegativeCount * 5 +
    contextNegativeCount * 2 +
    titleEarlyCareerCount * 5 +
    (hasExplicitMBASignal ? 0 : contextEarlyCareerCount * 2);

  const hasTargetAnchor =
    roleFamilies.length > 0 || hasMBASignal || hasBusinessProgramSignal;

  if (!hasTargetAnchor) return null;
  if (titleEarlyCareerCount > 0 && !hasExplicitMBASignal) return null;
  if (contextEarlyCareerCount > 0 && hasInternshipSignal && !hasExplicitMBASignal) {
    return null;
  }
  if (titleNegativeCount > 0 && roleFamilies.length === 0 && !hasMBASignal) return null;
  if (negativeScore >= positiveScore + 2) return null;

  const roleType: MBAJobRoleType = hasInternshipSignal
    ? "internship"
    : roleFamilies.length > 0
      ? "full-time"
      : "unclear";

  return {
    roleFamilies,
    roleType,
  };
}
