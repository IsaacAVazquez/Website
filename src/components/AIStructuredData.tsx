/**
 * AI-Optimized Structured Data Component
 *
 * Renders comprehensive schema.org JSON-LD markup optimized for AI search engines,
 * LLMs, and knowledge graph extraction.
 */

import {
  generateArticleSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateProfilePageSchema,
  generateItemListSchema,
  type PersonSchemaData,
  type ArticleSchemaData,
  type FAQItem,
  type BreadcrumbItem,
} from "@/lib/ai-seo";
import { safeJsonLd } from "@/lib/seo";

interface AIStructuredDataProps {
  schema:
    | { type: "Article"; data: ArticleSchemaData }
    | { type: "FAQ"; data: { items: FAQItem[] } }
    | { type: "Breadcrumb"; data: { items: BreadcrumbItem[] } }
    | {
        type: "ProfilePage";
        data: {
          person: PersonSchemaData;
          url?: string;
          description?: string;
          lastReviewed?: string;
        };
      }
    | {
        type: "ItemList";
        data: {
          name: string;
          description?: string;
          url?: string;
          items: Array<{
            name: string;
            url: string;
            description?: string;
            image?: string;
          }>;
        };
      };
}

/**
 * AIStructuredData Component
 *
 * Renders JSON-LD structured data optimized for AI parsing
 *
 * @example
 * ```tsx
 * <AIStructuredData
 *   schema={{
 *     type: "Breadcrumb",
 *     data: { items: [{ name: "Home", url: "/" }] },
 *   }}
 * />
 * ```
 */
export function AIStructuredData({ schema }: AIStructuredDataProps) {
  let structuredData: object;

  switch (schema.type) {
    case "Article":
      structuredData = generateArticleSchema(schema.data);
      break;
    case "FAQ":
      structuredData = generateFAQSchema(schema.data.items);
      break;
    case "Breadcrumb":
      structuredData = generateBreadcrumbSchema(schema.data.items);
      break;
    case "ProfilePage":
      structuredData = generateProfilePageSchema(schema.data);
      break;
    case "ItemList":
      structuredData = generateItemListSchema(schema.data);
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(structuredData),
      }}
      suppressHydrationWarning
    />
  );
}
