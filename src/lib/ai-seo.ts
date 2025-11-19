/**
 * AI-Optimized SEO Utilities
 *
 * Enhanced metadata and structured data generation optimized for AI-powered search engines,
 * LLMs, and retrieval systems. Includes comprehensive schema.org markup, semantic metadata,
 * and E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals.
 */

import { siteConfig } from "./seo";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PersonSchemaData {
  name?: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  image?: string;
  email?: string;
  telephone?: string;
  birthDate?: string;
  nationality?: string;
  knowsAbout?: string[];
  expertise?: ExpertiseArea[];
  awards?: Award[];
  alumniOf?: EducationalOrganization[];
  worksFor?: Organization;
  hasOccupation?: OccupationData[];
  memberOf?: Organization[];
  sameAs?: string[];
  address?: PostalAddress;
  seeks?: string;
}

export interface ExpertiseArea {
  name: string;
  proficiencyLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsExperience?: number;
  description?: string;
}

export interface Award {
  name: string;
  description?: string;
  dateAwarded?: string;
  awarder?: string | Organization;
}

export interface EducationalOrganization {
  "@type": "CollegeOrUniversity" | "EducationalOrganization";
  name: string;
  description?: string;
  address?: PostalAddress;
  url?: string;
  startDate?: string;
  endDate?: string;
  degree?: string;
  fieldOfStudy?: string[];
}

export interface Organization {
  "@type"?: "Organization" | "Corporation" | "NonprofitOrganization";
  name: string;
  description?: string;
  url?: string;
  address?: PostalAddress;
  foundingDate?: string;
  industry?: string;
}

export interface OccupationData {
  "@type": "Occupation" | "Role";
  name: string;
  description?: string;
  occupationLocation?: Place;
  skills?: string[];
  responsibilities?: string[];
  estimatedSalary?: MonetaryAmount;
  educationRequirements?: string;
  experienceRequirements?: string;
  startDate?: string;
  endDate?: string;
  employer?: Organization;
}

export interface PostalAddress {
  "@type"?: "PostalAddress";
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
  postalCode?: string;
  streetAddress?: string;
}

export interface Place {
  "@type": "City" | "State" | "Country" | "Place";
  name: string;
  containedInPlace?: Place;
}

export interface MonetaryAmount {
  "@type": "MonetaryAmount";
  currency: string;
  value: number | { minValue: number; maxValue: number };
}

export interface ArticleSchemaData {
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author?: PersonSchemaData | PersonSchemaData[];
  publisher?: Organization;
  url?: string;
  articleSection?: string;
  articleBody?: string;
  wordCount?: number;
  keywords?: string[];
  inLanguage?: string;
  about?: Thing[];
  mentions?: Thing[];
  speakable?: SpeakableSpecification;
  isAccessibleForFree?: boolean;
  genre?: string;
  audience?: Audience;
}

export interface Thing {
  "@type": string;
  name: string;
  description?: string;
  url?: string;
  sameAs?: string[];
}

export interface SpeakableSpecification {
  "@type": "SpeakableSpecification";
  cssSelector?: string[];
  xpath?: string[];
}

export interface Audience {
  "@type": "Audience" | "ProfessionalAudience" | "EducationalAudience";
  audienceType?: string;
  geographicArea?: Place;
}

export interface ProjectSchemaData {
  name: string;
  description: string;
  image?: string | string[];
  url?: string;
  dateCreated?: string;
  dateModified?: string;
  datePublished?: string;
  author?: PersonSchemaData;
  creator?: PersonSchemaData;
  keywords?: string[];
  programmingLanguage?: string[];
  applicationCategory?: string;
  about?: Thing[];
  skillsUsed?: string[];
  problemSolved?: string;
  solutionDescription?: string;
  impact?: string;
  technologies?: string[];
  isPartOf?: Thing;
}

export interface FAQItem {
  question: string;
  answer: string;
  dateCreated?: string;
  author?: PersonSchemaData;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
  position?: number;
}

// ============================================================================
// AI-SPECIFIC META TAGS
// ============================================================================

/**
 * Generates AI-specific meta tags for better parsing by LLMs and AI search engines
 */
export function generateAIMetaTags(data: {
  expertise?: string[];
  specialty?: string;
  profession?: string;
  industry?: string[];
  topics?: string[];
  contentType?: string;
  context?: string;
  summary?: string;
  primaryFocus?: string;
}) {
  const metaTags: Record<string, string> = {};

  if (data.expertise && data.expertise.length > 0) {
    metaTags["expertise"] = data.expertise.join(", ");
  }

  if (data.specialty) {
    metaTags["specialty"] = data.specialty;
  }

  if (data.profession) {
    metaTags["profession"] = data.profession;
  }

  if (data.industry && data.industry.length > 0) {
    metaTags["industry"] = data.industry.join(", ");
  }

  if (data.topics && data.topics.length > 0) {
    metaTags["topics"] = data.topics.join(", ");
    metaTags["article:tag"] = data.topics.join(", ");
  }

  if (data.contentType) {
    metaTags["content-type"] = data.contentType;
  }

  if (data.context) {
    metaTags["context"] = data.context;
  }

  if (data.summary) {
    metaTags["summary"] = data.summary;
  }

  if (data.primaryFocus) {
    metaTags["primary-focus"] = data.primaryFocus;
  }

  return metaTags;
}

// ============================================================================
// ENHANCED PERSON SCHEMA
// ============================================================================

/**
 * Generates comprehensive Person schema with AI-optimized expertise signals
 */
export function generateEnhancedPersonSchema(data: PersonSchemaData) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${data.url || siteConfig.url}#person`,
    name: data.name || siteConfig.name,
    alternateName: data.name || siteConfig.name,
    description: data.description || siteConfig.description,
    url: data.url || siteConfig.url,
    image: data.image || `${siteConfig.url}/og-image.png`,
    sameAs: data.sameAs || [
      siteConfig.links.linkedin,
      siteConfig.links.github,
    ],
  };

  // Job title and professional identity
  if (data.jobTitle) {
    schema.jobTitle = data.jobTitle;
  }

  // Contact information
  if (data.email) {
    schema.email = data.email;
  }
  if (data.telephone) {
    schema.telephone = data.telephone;
  }

  // Address information
  if (data.address) {
    schema.address = {
      "@type": "PostalAddress",
      ...data.address,
    };
  }

  // Knowledge areas (simple list)
  if (data.knowsAbout && data.knowsAbout.length > 0) {
    schema.knowsAbout = data.knowsAbout;
  }

  // Detailed expertise with proficiency levels
  if (data.expertise && data.expertise.length > 0) {
    schema.hasCredential = data.expertise.map((exp) => ({
      "@type": "EducationalOccupationalCredential",
      name: exp.name,
      description: exp.description,
      competencyRequired: exp.proficiencyLevel,
      credentialCategory: "Skill",
      ...(exp.yearsExperience && {
        validFor: `P${exp.yearsExperience}Y`,
      }),
    }));
  }

  // Awards and recognition
  if (data.awards && data.awards.length > 0) {
    schema.award = data.awards.map((award) => ({
      "@type": "Award",
      name: award.name,
      description: award.description,
      ...(award.dateAwarded && { dateAwarded: award.dateAwarded }),
      ...(typeof award.awarder === "string"
        ? { awarder: award.awarder }
        : award.awarder && { awarder: award.awarder }),
    }));
  }

  // Educational background
  if (data.alumniOf && data.alumniOf.length > 0) {
    schema.alumniOf = data.alumniOf.map((edu) => ({
      "@type": edu["@type"] || "CollegeOrUniversity",
      name: edu.name,
      description: edu.description,
      ...(edu.address && { address: edu.address }),
      ...(edu.url && { url: edu.url }),
      ...(edu.startDate && { startDate: edu.startDate }),
      ...(edu.endDate && { endDate: edu.endDate }),
    }));
  }

  // Current employer
  if (data.worksFor) {
    schema.worksFor = {
      "@type": data.worksFor["@type"] || "Organization",
      name: data.worksFor.name,
      ...(data.worksFor.description && {
        description: data.worksFor.description,
      }),
      ...(data.worksFor.url && { url: data.worksFor.url }),
      ...(data.worksFor.address && { address: data.worksFor.address }),
    };
  }

  // Occupational history with detailed information
  if (data.hasOccupation && data.hasOccupation.length > 0) {
    schema.hasOccupation = data.hasOccupation.map((occ) => ({
      "@type": occ["@type"] || "Occupation",
      name: occ.name,
      description: occ.description,
      ...(occ.skills && { skills: occ.skills }),
      ...(occ.responsibilities && { responsibilities: occ.responsibilities }),
      ...(occ.occupationLocation && {
        occupationLocation: occ.occupationLocation,
      }),
      ...(occ.startDate && { startDate: occ.startDate }),
      ...(occ.endDate && { endDate: occ.endDate }),
      ...(occ.employer && { employer: occ.employer }),
    }));
  }

  // Professional memberships
  if (data.memberOf && data.memberOf.length > 0) {
    schema.memberOf = data.memberOf.map((org) => ({
      "@type": org["@type"] || "Organization",
      name: org.name,
      ...(org.description && { description: org.description }),
      ...(org.url && { url: org.url }),
    }));
  }

  // Career seeking information
  if (data.seeks) {
    schema.seeks = data.seeks;
  }

  return schema;
}

// ============================================================================
// PROFESSIONAL SERVICE SCHEMA
// ============================================================================

/**
 * Generates ProfessionalService schema for consulting/services pages
 */
export function generateProfessionalServiceSchema(data: {
  name?: string;
  description?: string;
  provider?: PersonSchemaData;
  serviceType?: string[];
  areaServed?: string[];
  audience?: Audience;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: data.name || `${siteConfig.name} Product Management Consulting`,
    description: data.description || siteConfig.description,
    url: data.url || siteConfig.url,
    areaServed: data.areaServed || [
      "Austin, TX",
      "San Francisco Bay Area, CA",
      "Remote",
    ],
    serviceType: data.serviceType || [
      "Product Strategy",
      "Product Discovery",
      "Product Operations",
      "Quality Engineering Advisory",
      "Technical Product Management",
    ],
    provider: data.provider
      ? generateEnhancedPersonSchema(data.provider)
      : {
          "@type": "Person",
          name: siteConfig.name,
          url: siteConfig.url,
        },
    ...(data.audience && { audience: data.audience }),
  };
}

// ============================================================================
// ARTICLE SCHEMA
// ============================================================================

/**
 * Generates comprehensive Article schema for blog posts and articles
 */
export function generateArticleSchema(data: ArticleSchemaData) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${data.url || siteConfig.url}#article`,
    headline: data.headline,
    description: data.description,
    url: data.url || siteConfig.url,
    datePublished: data.datePublished || new Date().toISOString(),
    dateModified: data.dateModified || new Date().toISOString(),
    inLanguage: data.inLanguage || "en-US",
    isAccessibleForFree: data.isAccessibleForFree ?? true,
  };

  // Images (can be single or array)
  if (data.image) {
    schema.image = Array.isArray(data.image) ? data.image : [data.image];
  }

  // Author (can be single or array)
  if (data.author) {
    const authors = Array.isArray(data.author) ? data.author : [data.author];
    schema.author = authors.map((author) =>
      typeof author === "string"
        ? { "@type": "Person", name: author }
        : generateEnhancedPersonSchema(author)
    );
    if (authors.length === 1) {
      schema.author = schema.author[0];
    }
  }

  // Publisher
  if (data.publisher) {
    schema.publisher = {
      "@type": "Organization",
      name: data.publisher.name,
      ...(data.publisher.url && { url: data.publisher.url }),
    };
  }

  // Article section/category
  if (data.articleSection) {
    schema.articleSection = data.articleSection;
  }

  // Article body
  if (data.articleBody) {
    schema.articleBody = data.articleBody;
  }

  // Word count
  if (data.wordCount) {
    schema.wordCount = data.wordCount;
  }

  // Keywords
  if (data.keywords && data.keywords.length > 0) {
    schema.keywords = data.keywords.join(", ");
  }

  // Topics the article is about
  if (data.about && data.about.length > 0) {
    schema.about = data.about;
  }

  // Entities mentioned
  if (data.mentions && data.mentions.length > 0) {
    schema.mentions = data.mentions;
  }

  // Speakable content for voice search
  if (data.speakable) {
    schema.speakable = data.speakable;
  }

  // Genre
  if (data.genre) {
    schema.genre = data.genre;
  }

  // Target audience
  if (data.audience) {
    schema.audience = data.audience;
  }

  return schema;
}

// ============================================================================
// PROJECT/CREATIVE WORK SCHEMA
// ============================================================================

/**
 * Generates enhanced CreativeWork schema for portfolio projects
 */
export function generateProjectSchema(data: ProjectSchemaData) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${data.url || siteConfig.url}/projects/${data.name
      .toLowerCase()
      .replace(/\s+/g, "-")}#project`,
    name: data.name,
    description: data.description,
    url: data.url || siteConfig.url,
    dateCreated: data.dateCreated,
    dateModified: data.dateModified || new Date().toISOString(),
    ...(data.datePublished && { datePublished: data.datePublished }),
    inLanguage: "en-US",
    isAccessibleForFree: true,
  };

  // Images
  if (data.image) {
    schema.image = Array.isArray(data.image) ? data.image : [data.image];
  }

  // Author/Creator
  if (data.author) {
    schema.author = generateEnhancedPersonSchema(data.author);
  }
  if (data.creator) {
    schema.creator = generateEnhancedPersonSchema(data.creator);
  }

  // Keywords
  if (data.keywords && data.keywords.length > 0) {
    schema.keywords = data.keywords.join(", ");
  }

  // Programming languages used
  if (data.programmingLanguage && data.programmingLanguage.length > 0) {
    schema.programmingLanguage = data.programmingLanguage;
  }

  // Category
  if (data.applicationCategory) {
    schema.applicationCategory = data.applicationCategory;
  }

  // Topics the project is about
  if (data.about && data.about.length > 0) {
    schema.about = data.about;
  }

  // Skills demonstrated in the project
  if (data.skillsUsed && data.skillsUsed.length > 0) {
    schema.teaches = data.skillsUsed.map((skill) => ({
      "@type": "DefinedTerm",
      name: skill,
      inDefinedTermSet: "Technical Skills",
    }));
  }

  // Problem/Solution/Impact (AI-friendly narrative structure)
  if (data.problemSolved || data.solutionDescription || data.impact) {
    schema.abstract = `
      ${data.problemSolved ? `Problem: ${data.problemSolved}. ` : ""}
      ${data.solutionDescription ? `Solution: ${data.solutionDescription}. ` : ""}
      ${data.impact ? `Impact: ${data.impact}` : ""}
    `.trim();
  }

  // Technologies used
  if (data.technologies && data.technologies.length > 0) {
    schema.mentions = data.technologies.map((tech) => ({
      "@type": "SoftwareApplication",
      name: tech,
    }));
  }

  // Part of a collection
  if (data.isPartOf) {
    schema.isPartOf = data.isPartOf;
  }

  return schema;
}

// ============================================================================
// FAQ SCHEMA
// ============================================================================

/**
 * Generates FAQ page schema
 */
export function generateFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
        ...(item.dateCreated && { dateCreated: item.dateCreated }),
        ...(item.author && {
          author: {
            "@type": "Person",
            name:
              typeof item.author === "string"
                ? item.author
                : item.author.name || siteConfig.name,
          },
        }),
      },
    })),
  };
}

// ============================================================================
// BREADCRUMB SCHEMA
// ============================================================================

/**
 * Generates BreadcrumbList schema for navigation context
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${siteConfig.url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position || index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${siteConfig.url}${item.url}`,
    })),
  };
}

// ============================================================================
// PROFILE PAGE SCHEMA
// ============================================================================

/**
 * Generates ProfilePage schema for about/resume pages
 */
export function generateProfilePageSchema(data: {
  person: PersonSchemaData;
  url?: string;
  description?: string;
  lastReviewed?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${data.url || siteConfig.url}#profilepage`,
    url: data.url || siteConfig.url,
    name: `${data.person.name || siteConfig.name} - Professional Profile`,
    description:
      data.description ||
      `Professional profile of ${data.person.name || siteConfig.name}`,
    dateModified: data.lastReviewed || new Date().toISOString(),
    mainEntity: generateEnhancedPersonSchema(data.person),
  };
}

// ============================================================================
// ITEM LIST SCHEMA (for collections)
// ============================================================================

/**
 * Generates ItemList schema for project portfolios, blog archives, etc.
 */
export function generateItemListSchema(data: {
  name: string;
  description?: string;
  url?: string;
  items: Array<{
    name: string;
    url: string;
    description?: string;
    image?: string;
    position?: number;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: data.name,
    description: data.description,
    url: data.url || siteConfig.url,
    numberOfItems: data.items.length,
    itemListElement: data.items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position || index + 1,
      name: item.name,
      url: item.url,
      ...(item.description && { description: item.description }),
      ...(item.image && { image: item.image }),
    })),
  };
}

// ============================================================================
// WEBSITE NAVIGATION SCHEMA
// ============================================================================

/**
 * Generates SiteNavigationElement schema for main navigation
 */
export function generateNavigationSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "@id": `${siteConfig.url}#navigation`,
    name: "Main Navigation",
    hasPart: items.map((item, index) => ({
      "@type": "WebPage",
      "@id": item.url.startsWith("http")
        ? `${item.url}#webpage`
        : `${siteConfig.url}${item.url}#webpage`,
      name: item.name,
      url: item.url.startsWith("http")
        ? item.url
        : `${siteConfig.url}${item.url}`,
      position: item.position || index + 1,
    })),
  };
}

// ============================================================================
// AI-FRIENDLY CONTENT SUMMARY
// ============================================================================

/**
 * Generates AI-friendly page summary with clear context and structure
 */
export function generatePageSummary(data: {
  title: string;
  purpose: string;
  mainTopics: string[];
  targetAudience?: string;
  keyTakeaways?: string[];
  context?: string;
}) {
  const summary = {
    title: data.title,
    purpose: data.purpose,
    mainTopics: data.mainTopics,
    ...(data.targetAudience && { targetAudience: data.targetAudience }),
    ...(data.keyTakeaways &&
      data.keyTakeaways.length > 0 && { keyTakeaways: data.keyTakeaways }),
    ...(data.context && { context: data.context }),
  };

  // Create a natural language summary for AI parsing
  const naturalLanguageSummary = `
    This page, titled "${data.title}", serves to ${data.purpose}.
    ${data.context ? `Context: ${data.context}.` : ""}
    Main topics covered include: ${data.mainTopics.join(", ")}.
    ${data.targetAudience ? `Target audience: ${data.targetAudience}.` : ""}
    ${
      data.keyTakeaways && data.keyTakeaways.length > 0
        ? `Key takeaways: ${data.keyTakeaways.join("; ")}.`
        : ""
    }
  `
    .trim()
    .replace(/\s+/g, " ");

  return {
    structured: summary,
    text: naturalLanguageSummary,
  };
}
