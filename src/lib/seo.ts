import { Metadata } from "next";

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
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
} = {}): Metadata {
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