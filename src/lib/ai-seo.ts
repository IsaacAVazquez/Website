/**
 * AI-Optimized SEO Utilities
 *
 * Enhanced metadata and structured data generation optimized for AI-powered search engines,
 * LLMs, and retrieval systems. Includes comprehensive schema.org markup, semantic metadata,
 * and E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals.
 */

import { buildPersonEntity, personCanonicalUrl, personSchemaId, siteConfig } from "./seo";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PersonSchemaData {
  name?: string;
  alternateName?: string | string[];
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
  affiliation?: Organization[];
  worksFor?: Organization;
  hasOccupation?: OccupationData[];
  memberOf?: Organization[];
  sameAs?: string[];
  address?: PostalAddress;
  seeks?: string;
}

interface ExpertiseArea {
  name: string;
  proficiencyLevel?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsExperience?: number;
  description?: string;
}

interface Award {
  name: string;
  description?: string;
  dateAwarded?: string;
  awarder?: string | Organization;
}

interface EducationalOrganization {
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

interface Organization {
  "@type"?:
    | "Organization"
    | "Corporation"
    | "NonprofitOrganization"
    | "CollegeOrUniversity"
    | "EducationalOrganization";
  name: string;
  description?: string;
  url?: string;
  address?: PostalAddress;
  foundingDate?: string;
  industry?: string;
}

interface OccupationData {
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

interface PostalAddress {
  "@type"?: "PostalAddress";
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
  postalCode?: string;
  streetAddress?: string;
}

interface Place {
  "@type": "City" | "State" | "Country" | "Place";
  name: string;
  containedInPlace?: Place;
}

interface MonetaryAmount {
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

interface Thing {
  "@type": string;
  name: string;
  description?: string;
  url?: string;
  sameAs?: string[];
}

interface SpeakableSpecification {
  "@type": "SpeakableSpecification";
  cssSelector?: string[];
  xpath?: string[];
}

interface Audience {
  "@type": "Audience" | "ProfessionalAudience" | "EducationalAudience";
  audienceType?: string;
  geographicArea?: Place;
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
// ENHANCED PERSON SCHEMA
// ============================================================================

/**
 * Generates comprehensive Person schema with AI-optimized expertise signals
 */
export function generateEnhancedPersonSchema(data: PersonSchemaData) {
  // Start from the canonical Person entity so this schema can only extend the
  // shared node, never diverge from it under the same @id.
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    ...buildPersonEntity(),
  };

  if (data.name) {
    schema.name = data.name;
  }
  if (data.alternateName) {
    schema.alternateName = data.alternateName;
  }
  if (data.description) {
    schema.description = data.description;
  }
  if (data.image) {
    schema.image = data.image;
  }
  if (data.sameAs) {
    schema.sameAs = data.sameAs;
  }

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

  const knowledgeAreas = Array.from(
    new Set([
      ...(data.knowsAbout || []),
      ...(data.expertise || []).map((area) => area.name),
    ]),
  );
  if (knowledgeAreas.length > 0) {
    schema.knowsAbout = knowledgeAreas;
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
    }));
  }

  if (data.affiliation && data.affiliation.length > 0) {
    schema.affiliation = data.affiliation.map((org) => ({
      "@type": org["@type"] || "Organization",
      name: org.name,
      ...(org.description && { description: org.description }),
      ...(org.url && { url: org.url }),
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
    ...(data.url && {
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": data.url,
      },
      isPartOf: { "@type": "WebSite", "@id": `${siteConfig.url}#website` },
    }),
    inLanguage: data.inLanguage || "en-US",
    isAccessibleForFree: data.isAccessibleForFree ?? true,
  };

  if (data.datePublished) {
    schema.datePublished = data.datePublished;
  }

  if (data.dateModified || data.datePublished) {
    schema.dateModified = data.dateModified || data.datePublished;
  }

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
      schema.author = (schema.author as unknown[])[0];
    }
  }

  // Publisher - Google Search recommends publisher for Article schema
  schema.publisher = data.publisher
    ? {
        "@type": "Organization",
        name: data.publisher.name,
        ...(data.publisher.url && { url: data.publisher.url }),
      }
    : {
        "@type": "Person",
        "@id": personSchemaId,
        name: siteConfig.name,
        url: personCanonicalUrl,
      };

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
  if (data.keywords) {
    schema.keywords = Array.isArray(data.keywords) ? data.keywords.join(", ") : data.keywords;
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
  const finalItem = items.at(-1);
  const pageUrl = finalItem
    ? finalItem.url.startsWith("http")
      ? finalItem.url
      : `${siteConfig.url}${finalItem.url}`
    : siteConfig.url;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
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

// Google's ProfilePage rich result validates dateModified as a DateTime, so a
// bare YYYY-MM-DD gets expanded to midnight UTC rather than passed through.
function toProfileDateTime(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value;
}

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
    name: `${data.person.name || siteConfig.name} | Professional Profile`,
    description:
      data.description ||
      `Professional profile of ${data.person.name || siteConfig.name}`,
    ...(data.lastReviewed && {
      dateModified: toProfileDateTime(data.lastReviewed),
    }),
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
