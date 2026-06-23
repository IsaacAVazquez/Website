export type BlogCluster =
  | "PM Workflows"
  | "Agentic AI"
  | "Fintech Product & Pricing"
  | "Systems & Quality";

export type BlogArchiveBucket =
  | "Sports & Fantasy"
  | "Signals & Commentary"
  | "Space & Experiments";

export interface BlogPostCTA {
  eyebrow?: string;
  title: string;
  description: string;
  href: string;
  actionLabel?: string;
}

export interface BlogTopicPage {
  slug: string;
  label: BlogCluster | BlogArchiveBucket;
  description: string;
  seoTitle: string;
  metaDescription: string;
  kind: "cluster" | "archive";
}

export const BLOG_CLUSTER_ORDER: BlogCluster[] = [
  "PM Workflows",
  "Agentic AI",
  "Fintech Product & Pricing",
  "Systems & Quality",
];

export const BLOG_CLUSTER_DETAILS: Record<
  BlogCluster,
  {
    description: string;
    accent: "cobalt" | "teal" | "amber";
  }
> = {
  "PM Workflows": {
    description:
      "The way I use AI across discovery, specs, research synthesis, roadmapping, and stakeholder work when the job is to make the next decision clearer.",
    accent: "cobalt",
  },
  "Agentic AI": {
    description:
      "What I think is actually changing with agents, orchestration, model economics, and the product decisions around where autonomy helps and where it breaks.",
    accent: "amber",
  },
  "Fintech Product & Pricing": {
    description:
      "Product breakdowns on investment workflows, payments economics, and the tools I build when financial decisions need to be easier to inspect.",
    accent: "teal",
  },
  "Systems & Quality": {
    description:
      "Writing on reliability, testing, architecture, and the engineering judgment that keeps real systems usable once they leave the whiteboard.",
    accent: "amber",
  },
};

export const BLOG_ARCHIVE_BUCKET_ORDER: BlogArchiveBucket[] = [
  "Sports & Fantasy",
  "Signals & Commentary",
  "Space & Experiments",
];

export const BLOG_ARCHIVE_BUCKET_DETAILS: Record<
  BlogArchiveBucket,
  {
    description: string;
  }
> = {
  "Sports & Fantasy": {
    description:
      "Fantasy football models, bracket work, and the sports analytics experiments that still hold up.",
  },
  "Signals & Commentary": {
    description:
      "Time-bound notes on tech, policy, markets, and the stories that felt worth paying attention to that week.",
  },
  "Space & Experiments": {
    description:
      "Space writing and side-product experiments that started from curiosity and turned into working surfaces.",
  },
};

export const BLOG_TOPIC_PAGES: BlogTopicPage[] = [
  {
    slug: "pm-workflows",
    label: "PM Workflows",
    description: BLOG_CLUSTER_DETAILS["PM Workflows"].description,
    seoTitle: "AI Workflows for Product Managers",
    metaDescription:
      "Practical AI workflows for product discovery, research synthesis, PRDs, roadmaps, stakeholder communication, and product decisions.",
    kind: "cluster",
  },
  {
    slug: "agentic-ai",
    label: "Agentic AI",
    description: BLOG_CLUSTER_DETAILS["Agentic AI"].description,
    seoTitle: "Agentic AI Product Strategy",
    metaDescription:
      "Writing on AI agents, orchestration, model economics, evaluation, security, delegation, and production product decisions.",
    kind: "cluster",
  },
  {
    slug: "fintech-product-pricing",
    label: "Fintech Product & Pricing",
    description: BLOG_CLUSTER_DETAILS["Fintech Product & Pricing"].description,
    seoTitle: "Fintech Product and Pricing",
    metaDescription:
      "Product analysis and build notes on investment research, payment processing economics, pricing strategy, and financial decision tools.",
    kind: "cluster",
  },
  {
    slug: "systems-quality",
    label: "Systems & Quality",
    description: BLOG_CLUSTER_DETAILS["Systems & Quality"].description,
    seoTitle: "Software Systems and Quality Engineering",
    metaDescription:
      "Writing on reliability, testing, architecture, AI evaluation, security, and the engineering judgment behind production systems.",
    kind: "cluster",
  },
  {
    slug: "sports-fantasy",
    label: "Sports & Fantasy",
    description: BLOG_ARCHIVE_BUCKET_DETAILS["Sports & Fantasy"].description,
    seoTitle: "Sports Analytics and Fantasy Strategy",
    metaDescription:
      "Sports analytics, fantasy football strategy, World Cup analysis, bracket models, and the data products behind the predictions.",
    kind: "archive",
  },
  {
    slug: "signals-commentary",
    label: "Signals & Commentary",
    description: BLOG_ARCHIVE_BUCKET_DETAILS["Signals & Commentary"].description,
    seoTitle: "Technology, Markets, and Policy Commentary",
    metaDescription:
      "Opinionated analysis of technology, AI infrastructure, markets, policy, careers, and the signals shaping product strategy.",
    kind: "archive",
  },
  {
    slug: "space-experiments",
    label: "Space & Experiments",
    description: BLOG_ARCHIVE_BUCKET_DETAILS["Space & Experiments"].description,
    seoTitle: "Space Technology and Product Experiments",
    metaDescription:
      "Writing on space missions, launch economics, experimental dashboards, and side projects built from technical curiosity.",
    kind: "archive",
  },
];

export function getBlogTopicPage(slug: string): BlogTopicPage | undefined {
  return BLOG_TOPIC_PAGES.find((topic) => topic.slug === slug);
}

export function getBlogTopicPageForPost(post?: {
  cluster?: BlogCluster | null;
  archiveBucket?: BlogArchiveBucket | null;
}): BlogTopicPage | undefined {
  const label = post?.cluster || post?.archiveBucket;
  return BLOG_TOPIC_PAGES.find((topic) => topic.label === label);
}

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

export function getBlogPostCollectionLabel(post?: {
  cluster?: BlogCluster | null;
  archiveBucket?: BlogArchiveBucket | null;
  category?: string | null;
}) {
  return post?.cluster || post?.archiveBucket || post?.category || "Writing";
}

export function getBlogClusterTheme(cluster?: BlogCluster | null) {
  if (!cluster) {
    return "cobalt" as const;
  }

  return BLOG_CLUSTER_DETAILS[cluster].accent;
}
