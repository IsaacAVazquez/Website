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
  title: "Product Manager | UC Berkeley MBA | Technical Background - Austin & Bay Area",
  description: "Product Manager with technical foundation and UC Berkeley MBA education. Bridging engineering excellence with strategic product vision across Austin and Bay Area markets.",
  url: "https://isaacavazquez.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/isaacvazquez",
    github: "https://github.com/IsaacAVazquez",
    linkedin: "https://linkedin.com/in/isaac-vazquez",
  },
  keywords: [
    "Isaac Vazquez",
    "Technical Product Manager",
    "Product Manager Austin",
    "Product Manager Bay Area",
    "MBA Product Manager",
    "UC Berkeley Haas MBA",
    "Product Strategy",
    "Product Discovery",
    "Cross-functional Leadership",
    "Go-to-market Planning",
    "Data-informed Product Decisions",
    "Experimentation Strategy",
    "SaaS Product Manager",
    "Civic Tech Product Manager",
    "Mission-driven Product Management",
    "Product Management Portfolio",
    "Product Analytics",
    "Quality Engineering Leadership",
    "Product Management Consulting",
    "Austin Product Leader"
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
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
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
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    ...(canonicalUrl && {
      alternates: {
        canonical: canonicalUrl,
      },
    }),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
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