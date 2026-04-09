"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight, IconHome } from "@tabler/icons-react";

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
        'complete-guide-qa-engineering': 'Complete Guide to QA Engineering',
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
      "item": `https://isaacavazquez.com${item.href}`
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
          __html: JSON.stringify(generateStructuredData())
        }}
      />

      <nav
        aria-label="Breadcrumb"
        className={`py-4 ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-2 p-3 bg-[var(--home-paper)]/60 rounded-xl border border-[var(--home-rule)] backdrop-blur-sm shadow-sm">
          {breadcrumbs.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <IconChevronRight className="w-4 h-4 text-[var(--color-warning)] mx-1.5" aria-hidden="true" />
              )}

              {item.isActive ? (
                <span className="text-[var(--home-haze)] font-semibold text-sm px-2 py-1 rounded-lg bg-[var(--home-haze)]/10">
                  {item.label === "Home" && showHome ? (
                    <span className="flex items-center gap-1.5">
                      <IconHome className="w-4 h-4" />
                      <span>Home</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[var(--home-ink-muted)] hover:text-[var(--home-haze)] transition-all duration-200 text-sm px-2 py-1 rounded-lg hover:bg-[var(--home-paper-alt)] font-medium"
                >
                  {item.label === "Home" && showHome ? (
                    <span className="flex items-center gap-1.5">
                      <IconHome className="w-4 h-4" />
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
