"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight, IconHome } from "@tabler/icons-react";
import { siteConfig } from "@/lib/seo";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

/**
 * Breadcrumb - Navigation component with structured data
 *
 * Provides hierarchical navigation and schema.org BreadcrumbList
 * structured data for improved AI and search engine understanding.
 *
 * Features:
 * - Automatic breadcrumb generation from URL path
 * - Custom breadcrumb items support
 * - Schema.org BreadcrumbList structured data
 * - Accessible navigation
 */
export function Breadcrumb({
  items,
  showHome = true,
  className = "",
}: BreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname if items not provided
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const paths = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home
    if (showHome) {
      breadcrumbs.push({ label: "Home", href: "/" });
    }

    // Build breadcrumbs from path segments
    let currentPath = "";
    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // Format label (capitalize, replace hyphens with spaces)
      const label = path
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumbs on home page if only home
  if (breadcrumbs.length <= 1 && pathname === "/") {
    return null;
  }

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.label,
      "item": crumb.href.startsWith("http") ? crumb.href : `${siteConfig.url}${crumb.href}`,
    })),
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Visual Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={`mb-6 relative z-20 ${className}`}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const isHome = index === 0 && showHome;

            return (
              <li
                key={crumb.href}
                className="flex items-center gap-2"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {/* Link or current page */}
                {isLast ? (
                  <span
                    className="text-neutral-900 dark:text-neutral-100 font-medium"
                    itemProp="name"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors flex items-center gap-1.5"
                    itemProp="item"
                  >
                    {isHome && (
                      <IconHome className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span itemProp="name">{crumb.label}</span>
                  </Link>
                )}

                {/* Position metadata */}
                <meta itemProp="position" content={String(index + 1)} />

                {/* Separator */}
                {!isLast && (
                  <IconChevronRight
                    className="w-4 h-4 text-neutral-400 dark:text-neutral-600"
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * PageHeader - Component combining breadcrumb, title, and description
 * Optimized for AI readability and semantic HTML
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBreadcrumb?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  showBreadcrumb = true,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`mb-8 ${className}`}>
      {showBreadcrumb && <Breadcrumb items={breadcrumbs} />}

      <h1 className="editorial-heading text-neutral-900 dark:text-neutral-100 mb-4">
        {title}
      </h1>

      {description && (
        <p className="editorial-body text-neutral-700 dark:text-neutral-300 max-w-4xl">
          {description}
        </p>
      )}
    </header>
  );
}
