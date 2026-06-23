import { Metadata } from "next";
import { generateAIMetaTags } from "./ai-seo";
import { profile } from "./profile";

export interface ProjectStructuredData {
  name: string;
  description: string;
  image?: string;
  dateCreated?: string;
  dateModified?: string;
  author: string;
  keywords?: string[];
  programmingLanguage?: string[];
  applicationCategory?: string;
}

export interface AIOptimizedMetadata {
  title: string;
  description: string;
  summary?: string; // Concise TL;DR for AI systems
  expertise?: string[]; // Areas of expertise for this page
  context?: string; // Additional context for AI understanding
  author?: {
    name: string;
    title: string;
    credentials: string[];
  };
  datePublished?: string;
  dateModified?: string;
  readingTime?: number; // Estimated reading time in minutes
  canonicalUrl?: string;
  noIndex?: boolean;
  image?: string;
}

/**
 * Resolve the canonical site origin. Production reads from
 * NEXT_PUBLIC_SITE_URL when set (Netlify/Vercel-friendly); falls back to
 * the production host so static metadata still resolves during local dev.
 */
function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && /^https?:\/\//.test(envUrl)) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }
  return "https://isaacavazquez.com";
}

export const siteConfig = {
  name: profile.name,
  title: "Product Manager | UC Berkeley Haas MBA | Portfolio & Case Studies",
  description: profile.description,
  url: resolveSiteUrl(),
  ogImage: "/opengraph-image", // 1200x630 OG image optimized for social media & AI previews
  ogImageAlt: "Isaac Vazquez - Product Manager & UC Berkeley Haas MBA Candidate",
  links: {
    twitter: profile.sameAs.twitter,
    github: profile.sameAs.github,
    linkedin: profile.sameAs.linkedin,
  },
};

export const absoluteUrl = (path?: string) => {
  if (!path) return siteConfig.url;
  if (path.startsWith("http")) return path;
  const base = siteConfig.url.endsWith("/")
    ? siteConfig.url.slice(0, -1)
    : siteConfig.url;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const composeSocialTitle = (title: string) => {
  return title.toLowerCase().includes(siteConfig.name.toLowerCase())
    ? title
    : `${title} | ${siteConfig.name}`;
};

export function constructMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.png",
  noIndex = false,
  canonicalUrl,
  datePublished,
  dateModified,
  ogType = "website",
  articleAuthor,
  articleSection,
  articleTags,
  aiMetadata,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
  datePublished?: string;
  dateModified?: string;
  /** Set to "article" for blog posts and case studies */
  ogType?: "website" | "article";
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];
  aiMetadata?: {
    expertise?: string[];
    specialty?: string;
    profession?: string;
    industry?: string[];
    topics?: string[];
    contentType?: string;
    context?: string;
    summary?: string;
    primaryFocus?: string;
  };
} = {}): Metadata {
  // Generate AI-specific meta tags
  const aiTags = aiMetadata ? generateAIMetaTags(aiMetadata) : {};
  const resolvedTitle = title ?? siteConfig.title;
  const socialTitle = composeSocialTitle(resolvedTitle);

  const canonicalPath = canonicalUrl || siteConfig.url;
  const metadataBase = new URL(siteConfig.url);
  const absoluteCanonical = absoluteUrl(canonicalPath);
  const absoluteImage = absoluteUrl(image);
  const otherMeta: Record<string, string> = { ...aiTags };
  if (dateModified) {
    otherMeta["og:updated_time"] = dateModified;
  }

  // Build OpenGraph object — article type gets proper article fields
  const openGraphBase = {
    locale: "en_US" as const,
    url: absoluteCanonical,
    title: socialTitle,
    description,
    siteName: siteConfig.name,
    images: [
      {
        url: absoluteImage,
        width: 1200,
        height: 630,
        alt: siteConfig.ogImageAlt || socialTitle,
      },
    ],
  };

  const openGraph =
    ogType === "article"
      ? {
          ...openGraphBase,
          type: "article" as const,
          publishedTime: datePublished,
          modifiedTime: dateModified,
          authors: [articleAuthor ?? siteConfig.url],
          section: articleSection,
          tags: articleTags,
        }
      : {
          ...openGraphBase,
          type: "website" as const,
        };

  return {
    title: title
      ? resolvedTitle
      : {
          default: `${siteConfig.name} – ${siteConfig.title}`,
          template: `%s | ${siteConfig.name}`,
        },
    description,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [absoluteImage],
      creator: "@isaacvazquez",
      site: "@isaacvazquez",
    },
    icons,
    metadataBase,
    alternates: {
      canonical: canonicalPath,
      languages: {
        'en-US': canonicalPath,
      },
    },
    robots: noIndex ? {
      index: false,
      follow: true,
      nocache: true,
      googleBot: {
        index: false,
        follow: true,
      },
    } : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Add AI-specific meta tags
    other: otherMeta,
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

export function generateProjectStructuredData(project: ProjectStructuredData): object {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": project.name,
    "description": project.description,
    "image": project.image,
    "dateCreated": project.dateCreated,
    "dateModified": project.dateModified || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": project.author,
      "url": siteConfig.url,
    },
    "keywords": project.keywords?.join(", "),
    "programmingLanguage": project.programmingLanguage,
    "applicationCategory": project.applicationCategory || "WebApplication",
    "operatingSystem": "Any",
    "url": siteConfig.url,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
}

export interface BreadcrumbStructuredData {
  "@context": string;
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateBreadcrumbStructuredData(
  items: { name: string; url: string }[],
): BreadcrumbStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };
}

/**
 * Generate AI-optimized metadata for pages
 * Includes clear summaries, expertise markers, and context for AI systems
 */
export function generateAIOptimizedMetadata(
  pageData: AIOptimizedMetadata
): Metadata {
  const {
    title,
    description,
    summary,
    expertise,
    context,
    author,
    datePublished,
    dateModified,
    readingTime,
    canonicalUrl,
    noIndex,
    image,
  } = pageData;

  // Construct enhanced description with AI-friendly structure
  let enhancedDescription = description;
  if (summary) {
    enhancedDescription = `${summary} | ${description}`;
  }
  if (expertise && expertise.length > 0) {
    enhancedDescription += ` | Expertise: ${expertise.join(", ")}`;
  }

  const canonicalPath = canonicalUrl || siteConfig.url;
  const absoluteCanonical = absoluteUrl(canonicalPath);
  const absoluteImage = absoluteUrl(image || siteConfig.ogImage);
  const metadataBase = new URL(siteConfig.url);
  const robots = noIndex
    ? {
        index: false,
        follow: true,
        nocache: true,
        googleBot: {
          index: false,
          follow: true,
        },
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large" as const,
          "max-snippet": -1,
        },
      };

  // Build metadata
  const metadata: Metadata = {
    title,
    description: enhancedDescription,
    metadataBase,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "en-US": canonicalPath,
      },
    },
    robots,
    authors: author
      ? [{ name: author.name, url: siteConfig.url }]
      : [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: absoluteCanonical,
      title: composeSocialTitle(title),
      description: enhancedDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: composeSocialTitle(title),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: composeSocialTitle(title),
      description: enhancedDescription,
      images: [absoluteImage],
      creator: "@isaacvazquez",
    },
    other: {
      // AI-specific metadata for better understanding
      "ai:summary": summary || description,
      "ai:expertise": expertise?.join(", ") || "",
      "ai:context": context || "",
      "ai:readingTime": readingTime ? `${readingTime} minutes` : "",
    },
  };

  if (datePublished) {
    (metadata.other as Record<string, string>)["article:published_time"] =
      datePublished;
  }

  if (dateModified) {
    const other = metadata.other as Record<string, string>;
    other["article:modified_time"] = dateModified;
    other["og:updated_time"] = dateModified;
  }

  return metadata;
}

/**
 * Generate Person structured data with enhanced credentials
 */
export function generatePersonStructuredData(options?: {
  includeCredentials?: boolean;
  includeSocials?: boolean;
  includeOrganizations?: boolean;
}): object {
  const {
    includeCredentials = true,
    includeSocials = true,
    includeOrganizations = true,
  } = options || {};

  const personData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": siteConfig.name,
    "jobTitle": "Technical Product Manager",
    "description": siteConfig.description,
    "url": siteConfig.url,
    "image": `${siteConfig.url}${siteConfig.ogImage}`,
  };

  if (includeSocials) {
    personData["sameAs"] = [
      siteConfig.links.linkedin,
      siteConfig.links.github,
    ];
  }

  if (includeCredentials) {
    personData["knowsAbout"] = [
      "Product Management",
      "Product Strategy",
      "Technical Product Leadership",
      "Quality Assurance",
      "Test Automation",
      "Consumer Technology",
      "SaaS Platforms",
      "Data Analytics",
      "Cross-functional Leadership",
      "User Research",
      "Experimentation Strategy",
    ];

    personData["hasCredential"] = [
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "degree",
        "name": "MBA Candidate",
        "educationalLevel": "Master's Degree",
        "recognizedBy": {
          "@type": "CollegeOrUniversity",
          "name": "UC Berkeley Haas School of Business",
        },
      },
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "award",
        "name": "Consortium Fellow",
      },
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "award",
        "name": "MLT Professional Development Fellow",
      },
    ];
  }

  if (includeOrganizations) {
    personData["worksFor"] = {
      "@type": "Organization",
      "name": "Civitech",
      "description": "Civic technology company specializing in voter engagement platforms",
    };

    personData["alumniOf"] = [
      {
        "@type": "CollegeOrUniversity",
        "name": "UC Berkeley Haas School of Business",
        "sameAs": "https://haas.berkeley.edu",
      },
      {
        "@type": "CollegeOrUniversity",
        "name": "Florida State University",
        "sameAs": "https://www.fsu.edu",
      },
    ];
  }

  return personData;
}

/**
 * Generate Article structured data for blog posts and case studies
 */
export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  keywords?: string[];
  url: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.image || `${siteConfig.url}${siteConfig.ogImage}`,
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author || siteConfig.name,
      "url": siteConfig.url,
    },
    "publisher": {
      "@type": "Person",
      "name": siteConfig.name,
      "url": siteConfig.url,
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url,
    },
    "keywords": article.keywords?.join(", "),
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
  };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData(org: {
  name: string;
  description: string;
  url?: string;
  logo?: string;
  location?: string;
  foundingDate?: string;
}): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": org.name,
    "description": org.description,
    "url": org.url,
    "logo": org.logo,
    "foundingDate": org.foundingDate,
    ...(org.location && {
      "location": {
        "@type": "Place",
        "name": org.location,
      },
    }),
  };
}

/**
 * Calculate estimated reading time from text content
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Serialize a value as JSON for safe injection into a
 * `<script type="application/ld+json">` block via dangerouslySetInnerHTML.
 *
 * `JSON.stringify` does NOT escape `<`, `>`, or `&`, so a value containing
 * `</script>` (e.g. derived from a URL path or other dynamic data) could break
 * out of the JSON-LD block and inject markup. Escaping these characters to their
 * unicode equivalents keeps the output valid JSON while making `</script>`
 * breakout impossible. Also escapes U+2028/U+2029, which are valid in JSON but
 * illegal in JavaScript string literals.
 */
export function safeJsonLd(data: unknown): string {
  // U+2028 (line separator) and U+2029 (paragraph separator) are valid in JSON
  // but are line terminators in JavaScript string literals. Build them from
  // char codes so this source file contains no raw line-terminator characters.
  const lineSeparators =
    String.fromCharCode(0x2028) + String.fromCharCode(0x2029);
  const unsafe = new RegExp(`[<>&${lineSeparators}]`, "g");
  return JSON.stringify(data).replace(
    unsafe,
    (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0")
  );
}
