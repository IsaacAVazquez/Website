import { Metadata } from "next";
import { generateAIMetaTags } from "./ai-seo";

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
}

export const siteConfig = {
  name: "Isaac Vazquez",
  title: "Technical Product Manager | UC Berkeley MBA Candidate | Austin & Bay Area",
  description: "Technical Product Manager and UC Berkeley Haas MBA Candidate '27 with 6+ years experience in civic tech and SaaS. Building mission-driven products that balance user insight, data-driven decisions, and cross-functional collaboration across Austin and San Francisco Bay Area.",
  url: "https://isaacavazquez.com",
  ogImage: "/favicon.png", // TODO: Create proper 1200x630 OG image for optimal social media sharing
  links: {
    twitter: "https://twitter.com/isaacvazquez",
    github: "https://github.com/IsaacAVazquez",
    linkedin: "https://linkedin.com/in/isaac-vazquez",
  },
  keywords: [
    // Name & Primary Identity
    "Isaac Vazquez",
    "Isaac Vazquez Product Manager",
    "Isaac Vazquez UC Berkeley",
    "Isaac Vazquez Haas MBA",
    "Isaac A Vazquez",

    // Core Product Management Keywords
    "Technical Product Manager",
    "Product Manager",
    "Associate Product Manager",
    "APM",
    "Product Strategy",
    "Product Discovery",
    "Product Operations",
    "Product-Led Growth",
    "Product Roadmapping",
    "Product Leadership",

    // Location-based Keywords
    "Product Manager Austin TX",
    "Product Manager Austin Texas",
    "Product Manager Bay Area",
    "Product Manager San Francisco",
    "Product Manager Berkeley CA",
    "Austin Product Leader",
    "Bay Area Product Manager",
    "Product Manager California",
    "Remote Product Manager",

    // Education & Credentials
    "UC Berkeley MBA",
    "UC Berkeley Haas MBA",
    "Berkeley Haas MBA Candidate",
    "MBA Product Manager",
    "MBA Candidate Product Management",
    "Consortium Fellow",
    "Haas School of Business",

    // Industry & Domain Expertise
    "Civic Tech Product Manager",
    "SaaS Product Manager",
    "Mission-Driven Product Manager",
    "Voter Engagement Technology",
    "Political Technology Product Manager",
    "Social Impact Product Manager",
    "B2B SaaS Product Manager",
    "GovTech Product Manager",

    // Core Competencies
    "Cross-Functional Leadership",
    "Stakeholder Management",
    "Go-to-Market Strategy",
    "GTM Strategy",
    "Data-Driven Product Decisions",
    "Product Analytics",
    "Experimentation Strategy",
    "A/B Testing Product Manager",
    "User Research",
    "Product Discovery Methods",
    "Product Market Fit",
    "Customer Discovery",
    "Product Prioritization",
    "Feature Prioritization",

    // Technical Background
    "Quality Engineering",
    "QA Engineer to Product Manager",
    "Technical Product Leadership",
    "Test Automation Strategy",
    "Quality Assurance Leadership",
    "Technical Product Manager Background",
    "Engineering Background Product Manager",

    // Career Development
    "Product Manager Portfolio",
    "Product Management Case Studies",
    "Product Management Consulting",
    "Product Manager Career Transition",
    "From QA to Product Management",
    "Career Pivot to Product Management",

    // Specific Skills
    "SQL for Product Managers",
    "Data Analysis Product Manager",
    "Agile Product Management",
    "Scrum Product Owner",
    "Product Metrics",
    "KPI Definition",
    "OKR Product Management",
    "Cypress Automation",
    "SQL Product Manager",
    "API Product Management",

    // Job Search Keywords
    "Product Manager Jobs Austin",
    "Product Manager Jobs Bay Area",
    "Product Manager Jobs San Francisco",
    "APM Jobs",
  ],
};

export function constructMetadata({
  title = siteConfig.title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.png",
  noIndex = false,
  canonicalUrl,
  aiMetadata,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
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

  return {
    title: {
      default: `${siteConfig.name} – ${siteConfig.title}`,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: `${siteConfig.name} – ${title}`,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.url + image,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} – ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.name} – ${title}`,
      description,
      images: [siteConfig.url + image],
      creator: "@isaacvazquez",
      site: "@isaacvazquez",
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl || siteConfig.url,
      languages: {
        'en-US': canonicalUrl || siteConfig.url,
      },
    },
    robots: noIndex ? {
      index: false,
      follow: false,
      nocache: true,
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
    other: {
      ...aiTags,
    },
    verification: {
      // Add Google Search Console verification if available
      // google: 'your-google-site-verification-code',
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

export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`
    }))
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
  } = pageData;

  // Construct enhanced description with AI-friendly structure
  let enhancedDescription = description;
  if (summary) {
    enhancedDescription = `${summary} | ${description}`;
  }
  if (expertise && expertise.length > 0) {
    enhancedDescription += ` | Expertise: ${expertise.join(", ")}`;
  }

  // Build metadata
  const metadata: Metadata = {
    title: `${title} | ${siteConfig.name}`,
    description: enhancedDescription,
    keywords: [
      ...siteConfig.keywords,
      ...(expertise || []),
    ],
    authors: author
      ? [{ name: author.name, url: siteConfig.url }]
      : [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title: `${title} | ${siteConfig.name}`,
      description: enhancedDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteConfig.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description: enhancedDescription,
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
      creator: "@isaacvazquez",
    },
    other: {
      // AI-specific metadata for better understanding
      "ai:summary": summary || description,
      "ai:expertise": expertise?.join(", ") || "",
      "ai:context": context || "",
      "ai:readingTime": readingTime ? `${readingTime} minutes` : "",
      ...(datePublished && { "article:published_time": datePublished }),
      ...(dateModified && { "article:modified_time": dateModified }),
    },
  };

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
    "image": `${siteConfig.url}/og-image.png`,
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
      "Civic Technology",
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