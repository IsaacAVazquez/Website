export type BlogCluster =
  | "AI For Product Managers"
  | "Fintech Product & Pricing"
  | "Quality / Systems Thinking";

export interface BlogPostCTA {
  eyebrow?: string;
  title: string;
  description: string;
  href: string;
  actionLabel?: string;
}

export const BLOG_CLUSTER_ORDER: BlogCluster[] = [
  "AI For Product Managers",
  "Fintech Product & Pricing",
  "Quality / Systems Thinking",
];

export const BLOG_CLUSTER_DETAILS: Record<
  BlogCluster,
  {
    description: string;
    accent: "cobalt" | "teal" | "amber";
  }
> = {
  "AI For Product Managers": {
    description:
      "First-person pieces on using AI inside discovery, planning, specs, and agentic product decisions.",
    accent: "cobalt",
  },
  "Fintech Product & Pricing": {
    description:
      "Product breakdowns on investment workflows, payments economics, and tools that make financial decisions easier to inspect.",
    accent: "teal",
  },
  "Quality / Systems Thinking": {
    description:
      "Writing on reliability, testing, and the operational judgment that keeps real systems usable under pressure.",
    accent: "amber",
  },
};

export const HOMEPAGE_PROOF_OF_WORK_SLUGS = [
  "ai-product-discovery-workflow",
  "agentic-ai-explained-for-product-managers",
  "building-an-investment-research-platform",
] as const;

export const LEAD_GEN_BLOG_SLUGS = [
  "ai-prd-writing-prompts-structure",
  "ai-product-discovery-workflow",
  "ai-roadmapping-from-feedback",
  "ai-user-research-synthesis-workflow",
  "ai-email-stakeholder-comms-pm",
  "agentic-ai-explained-for-product-managers",
  "build-vs-buy-agentic-ai-platform",
  "ai-agents-customer-support-what-works",
  "evaluate-agentic-ai-product-pm-framework",
  "building-an-investment-research-platform",
  "interchange-iq-payment-fee-analyzer",
  "reasoning-model-economics-when-to-use-which",
  "building-reliable-software-systems",
  "complete-guide-qa-engineering",
  "qa-engineer-guide-testing-ai-systems",
] as const;

export const LEAD_GEN_INTERNAL_LINK_RULES = {
  minRelatedWritingLinks: 2,
};

export function getBlogCoverImageUrl(slug: string, coverImage?: string) {
  if (coverImage) {
    return coverImage;
  }

  return `/writing/${slug}/opengraph-image`;
}

export function getBlogClusterTheme(cluster?: BlogCluster | null) {
  if (!cluster) {
    return "cobalt" as const;
  }

  return BLOG_CLUSTER_DETAILS[cluster].accent;
}
