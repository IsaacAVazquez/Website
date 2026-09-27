"use client";
/* eslint-disable react-refresh/only-export-components -- co-located helper is intentional */

import { ChevronRight, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  if (pathname === "/" && !customItems) {
    return null;
  }

  // The visible trail only. Each page emits its own BreadcrumbList JSON-LD from
  // page.tsx, so a copy here duplicated it and could disagree with it.
  return (
    <nav
      aria-label="Breadcrumb"
      className={`py-4 ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-2 p-3 bg-[var(--c97-surface)]/60 border border-[var(--c97-rule)] backdrop-blur-sm">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {/* Separator is ink-2, not warning. A separator is not a
                status, and spending a status token on decoration is what
                makes a real warning stop reading as one. */}
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-[var(--c97-ink-2)] mx-1.5" aria-hidden="true" />
            )}

            {/* Active item is ink on the accent wash, not accent on it.
                Accent text this size over a light accent tint runs too close
                to the 4.5:1 floor to trust, so ink carries the text and the
                tint plus the weight mark the current page instead. */}
            {item.isActive ? (
              <span className="text-[var(--c97-ink)] font-semibold text-sm px-2 py-1 bg-[var(--c97-accent)]/10">
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
                className="inline-flex min-h-touch items-center text-[var(--c97-ink-2)] hover:text-[var(--c97-accent)] transition-[color,background-color] duration-200 text-sm px-2 py-1 hover:bg-[var(--c97-field)] font-medium"
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
  );
}

export function createBreadcrumbItems(items: Array<{ label: string; href: string }>): BreadcrumbItem[] {
  return items.map((item, index, array) => ({
    ...item,
    isActive: index === array.length - 1
  }));
}
