/**
 * AI-Optimized Structured Data Component
 *
 * Renders comprehensive schema.org JSON-LD markup optimized for AI search engines,
 * LLMs, and knowledge graph extraction.
 */

import {
  generateEnhancedPersonSchema,
  generateProfessionalServiceSchema,
  generateArticleSchema,
  generateProjectSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateProfilePageSchema,
  generateItemListSchema,
  generateNavigationSchema,
  type PersonSchemaData,
  type ArticleSchemaData,
  type ProjectSchemaData,
  type FAQItem,
  type BreadcrumbItem,
} from "@/lib/ai-seo";

interface AIStructuredDataProps {
  schema:
    | { type: "Person"; data: PersonSchemaData }
    | { type: "ProfessionalService"; data: any }
    | { type: "Article"; data: ArticleSchemaData }
    | { type: "Project"; data: ProjectSchemaData }
    | { type: "FAQ"; data: { items: FAQItem[] } }
    | { type: "Breadcrumb"; data: { items: BreadcrumbItem[] } }
    | {
        type: "ProfilePage";
        data: { person: PersonSchemaData; url?: string; description?: string };
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
      }
    | { type: "Navigation"; data: { items: BreadcrumbItem[] } }
    | { type: "Custom"; data: object };
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
 *     type: "Person",
 *     data: {
 *       name: "Isaac Vazquez",
 *       jobTitle: "Technical Product Manager",
 *       expertise: [...],
 *       awards: [...],
 *     }
 *   }}
 * />
 * ```
 */
export function AIStructuredData({ schema }: AIStructuredDataProps) {
  let structuredData: object;

  switch (schema.type) {
    case "Person":
      structuredData = generateEnhancedPersonSchema(schema.data);
      break;
    case "ProfessionalService":
      structuredData = generateProfessionalServiceSchema(schema.data);
      break;
    case "Article":
      structuredData = generateArticleSchema(schema.data);
      break;
    case "Project":
      structuredData = generateProjectSchema(schema.data);
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
    case "Navigation":
      structuredData = generateNavigationSchema(schema.data.items);
      break;
    case "Custom":
      structuredData = schema.data;
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 0),
      }}
      suppressHydrationWarning
    />
  );
}

/**
 * Helper component to render multiple structured data schemas
 */
export function AIStructuredDataCollection({
  schemas,
}: {
  schemas: AIStructuredDataProps["schema"][];
}) {
  return (
    <>
      {schemas.map((schema, index) => (
        <AIStructuredData key={index} schema={schema} />
      ))}
    </>
  );
}
