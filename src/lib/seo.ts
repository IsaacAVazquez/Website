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
  title: "QA Engineer & Builder",
  description: "QA Engineer specializing in test automation, data analytics, and civic tech. 6+ years ensuring software quality with 99.9% uptime, preventing critical bugs for 60M+ users. Expert in Cypress, JMeter, SQL, and Python automation.",
  url: "https://isaacvazquez.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/isaacvazquez",
    github: "https://github.com/isaacvazquez",
    linkedin: "https://linkedin.com/in/isaac-vazquez",
  },
  keywords: [
    "QA Engineer",
    "Quality Assurance Engineer",
    "Test Automation Engineer",
    "Software Testing",
    "Isaac Vazquez",
    "Cypress Testing",
    "API Testing",
    "Performance Testing",
    "JMeter",
    "Postman",
    "SQL Testing",
    "Data Validation",
    "Test Strategy",
    "Release Management",
    "Civic Tech QA",
    "Austin QA Engineer",
    "Python Automation",
    "JavaScript Testing",
    "Selenium WebDriver",
    "Bug Prevention",
    "Quality Metrics",
    "99.9% Uptime",
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