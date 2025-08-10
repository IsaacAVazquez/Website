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
  title: "QA Engineer, Product Strategist & UC Berkeley MBA - Business Leader in Austin & Bay Area",
  description: "QA Engineer, Product Strategist, and UC Berkeley MBA candidate combining technical expertise with strategic business leadership. Experienced in software testing, product management, and business strategy across Austin, Texas and San Francisco Bay Area. Business school student transitioning from technical QA excellence to product leadership and strategic business innovation.",
  url: "https://isaacavazquez.com",
  ogImage: "/og-image.png",
  links: {
    twitter: "https://twitter.com/isaacvazquez",
    github: "https://github.com/IsaacAVazquez",
    linkedin: "https://linkedin.com/in/isaac-vazquez",
  },
  keywords: [
    // Austin, TX Keywords (Primary Location)
    "Austin QA Engineer",
    "Austin Software Developer",
    "Austin Tech Professional",
    "Austin Fantasy Football Analytics",
    "Texas QA Engineer",
    "Austin Test Automation",
    "Austin Software Testing",
    "Austin Web Developer",
    "Austin TypeScript Developer",
    "Austin React Developer",
    "Austin Next.js Developer",
    "Austin Tech Community",
    "Austin Software Quality",
    "Texas Software Engineer",
    "Austin Data Analytics",
    
    // California & Bay Area Keywords
    "Bay Area QA Engineer",
    "San Francisco Software Testing",
    "California QA Professional",
    "Silicon Valley QA Engineer",
    "Bay Area Tech Professional",
    "San Francisco Bay Area QA",
    "Northern California Software Testing",
    "Bay Area Test Automation",
    "California Software Developer",
    "Silicon Valley Software Quality",
    "San Francisco Tech Community",
    "Bay Area Data Analytics",
    "California Tech Professional",
    "SF Bay Area Developer",
    "Peninsula QA Engineer",
    
    // UC Berkeley & MBA Keywords
    "UC Berkeley MBA",
    "UC Berkeley Haas",
    "Haas School of Business",
    "MBA QA Engineer",
    "Graduate Student QA",
    "UC Berkeley Alumni QA",
    "Berkeley MBA Student",
    "MBA Tech Professional",
    "Business Strategy QA",
    "UC Berkeley Tech",
    "Haas Alumni Network",
    "Berkeley Graduate Student",
    "MBA Software Engineer",
    "UC Berkeley Consortium Fellow",
    "Berkeley Business School",
    
    // Business School & Leadership Keywords
    "Business School Student",
    "MBA Student Tech Professional",
    "Graduate Business Student",
    "Business Leadership MBA",
    "Strategic Business Thinking",
    "Executive MBA Candidate",
    "Business School Graduate",
    "MBA Program Alumni",
    "Strategic Leadership MBA",
    "Business Innovation Student",
    "Entrepreneurship MBA",
    "Technology Business Leader",
    "Business Development MBA",
    "Corporate Strategy MBA",
    "Management Consulting MBA",
    
    // Product Management & Strategy Keywords
    "Product Manager QA",
    "Technical Product Manager",
    "Product Strategy MBA",
    "Product Development Leader",
    "Product Management Consultant",
    "Strategic Product Manager",
    "MBA Product Manager",
    "Product Strategist",
    "Product Leadership",
    "Product Innovation Manager",
    "Growth Product Manager",
    "Data-Driven Product Manager",
    "B2B Product Manager",
    "SaaS Product Manager",
    "Platform Product Manager",
    "Product Operations Manager",
    "Product Marketing Manager",
    "Senior Product Manager",
    "VP Product Management",
    "Chief Product Officer",
    
    // Business Leadership Keywords
    "Business Leader",
    "Tech Business Leader",
    "Strategic Business Leader",
    "Innovation Leader",
    "Digital Transformation Leader",
    "Technology Executive",
    "Business Strategy Consultant",
    "Executive Leadership",
    "Strategic Planning Executive",
    "Business Operations Leader",
    "Cross-Functional Leader",
    "Team Leadership MBA",
    "Organizational Leadership",
    "Change Management Leader",
    "Business Process Improvement",
    
    // AI & Technology Keywords
    "AI-powered Testing",
    "Machine Learning QA",
    "Silicon Valley AI",
    "Bay Area AI Testing",
    "Artificial Intelligence QA",
    "ML Software Testing",
    "AI Quality Assurance",
    "Machine Learning Testing",
    "Data Science QA",
    "AI-driven Test Automation",
    "Smart Testing Solutions",
    "Predictive Quality Assurance",
    "AI Test Strategy",
    "Intelligent Software Testing",
    "Bay Area AI Professional",
    
    // Fantasy Football Keywords (Primary)
    "Fantasy Football Tools",
    "Fantasy Football Analytics",
    "Fantasy Football Tiers",
    "Fantasy Football Rankings",
    "Fantasy Football Draft Tools",
    "Fantasy Football Visualization",
    "Fantasy Football Data Analysis",
    "NFL Fantasy Tools",
    "Fantasy Football Calculator",
    "Fantasy Sports Analytics",
    "Interactive Fantasy Tiers",
    "Fantasy Football Clustering",
    "Real-time Fantasy Data",
    "Fantasy Football Dashboard",
    "Fantasy Football Draft Helper",
    "Fantasy Football Mobile App",
    "Fantasy Football Strategy",
    "Fantasy Football Stats",
    "Fantasy Football Projections",
    "Fantasy Football Algorithms",
    
    // Technical Keywords
    "D3.js Visualization",
    "K-Means Clustering",
    "TypeScript",
    "Next.js",
    "React",
    "Data Visualization",
    "Machine Learning Fantasy",
    "API Integration",
    "Performance Optimization",
    "Software Testing",
    "Test Automation",
    "Quality Assurance",
    "Web Application Testing",
    "Bug Detection",
    "Performance Testing",
    
    // Personal/Professional Keywords  
    "Isaac Vazquez",
    "QA Engineer",
    "Data Analytics",
    "Software Quality",
    "Test Automation",
    "Austin Developer",
    "Fantasy Football Developer",
    "Software Engineer Austin",
    "Quality Assurance Austin",
    
    // Dual-Location & Cross-Market Keywords
    "Austin to Berkeley QA",
    "Texas California QA Engineer",
    "Multi-Market Software Testing",
    "Remote QA Services Austin Bay Area",
    "Cross-Coast QA Consulting",
    "Austin Berkeley MBA Professional",
    "Dual-Location Tech Professional",
    "Texas California Software Quality",
    "Austin Silicon Valley QA",
    "Berkeley Austin Tech Network",
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