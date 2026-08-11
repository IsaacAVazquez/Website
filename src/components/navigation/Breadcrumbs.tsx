"use client";
/* eslint-disable react-refresh/only-export-components -- co-located helper is intentional */

import { ChevronRight, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { safeJsonLd } from "@/lib/seo";

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumbs({
  customItems,
  showHome = true,
  className = ""
}: BreadcrumbsProps) {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    if (showHome) {
      breadcrumbs.push({
        label: "Home",
        href: "/",
        isActive: pathname === "/"
      });
    }

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      const label = generateLabel(segment, currentPath);

      breadcrumbs.push({
        label,
        href: currentPath,
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  const generateLabel = (segment: string, fullPath: string): string => {
    const labelMap: Record<string, string> = {
      'about': 'About',
      'portfolio': 'Portfolio',
      'writing': 'Writing',
      'resume': 'Resume',
      'contact': 'Contact',
      'search': 'Search',
      'fantasy-football': 'Fantasy Football'
    };

    if (labelMap[segment]) {
      return labelMap[segment];
    }

    if (fullPath.includes('/blog/') && segment !== 'blog') {
      const blogTitleMap: Record<string, string> = {
        'complete-guide-qa-engineering': 'QA Engineering',
        'mastering-fantasy-football-analytics': 'Mastering Fantasy Football Analytics',
        'building-reliable-software-systems': 'Building Reliable Software Systems'
      };

      if (blogTitleMap[segment]) {
        return blogTitleMap[segment];
      }

      return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = generateBreadcrumbs();

  const generateStructuredData = () => {
    const itemList = breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://isaacvazquez.com${item.href}`
    }));

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": itemList
    };
  };

  if (pathname === "/" && !customItems) {
    return null;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(generateStructuredData())
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className={`py-4 ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-2 p-3 bg-[var(--home-paper)]/60 rounded-[var(--radius-xl)] border border-[var(--home-rule)] backdrop-blur-sm shadow-[var(--shadow-sm)]">
          {breadcrumbs.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {/* Separator is ink-muted, not warning. A separator is not a
                  status, and spending a status token on decoration is what
                  makes a real warning stop reading as one. */}
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-[var(--home-ink-muted)] mx-1.5" aria-hidden="true" />
              )}

              {/* Active item is ink on the signal wash, not signal on it.
                  Signal text over a 10% signal tint measured 3.96:1, under the
                  4.5:1 this size needs. The tint and the weight already mark
                  the current page, so the accent keeps its job at 14.18:1. */}
              {item.isActive ? (
                <span className="text-[var(--home-ink)] font-semibold text-sm px-2 py-1 rounded-lg bg-[var(--home-signal)]/10">
                  {item.label === "Home" && showHome ? (
                    <span className="flex items-center gap-1.5">
                      <House className="w-4 h-4" />
                      <span>Home</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex min-h-touch items-center text-[var(--home-ink-muted)] hover:text-[var(--home-signal)] transition-[color,background-color] duration-200 text-sm px-2 py-1 rounded-lg hover:bg-[var(--home-paper-alt)] font-medium"
                >
                  {item.label === "Home" && showHome ? (
                    <span className="flex items-center gap-1.5">
                      <House className="w-4 h-4" />
                      <span>Home</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function createBreadcrumbItems(items: Array<{ label: string; href: string }>): BreadcrumbItem[] {
  return items.map((item, index, array) => ({
    ...item,
    isActive: index === array.length - 1
  }));
}
