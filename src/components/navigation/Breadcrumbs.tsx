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

    // Generate breadcrumbs from path segments
    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Create human-readable labels
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
    // Handle special cases
    const labelMap: Record<string, string> = {
      'about': 'About',
      'projects': 'Projects',
      'blog': 'Blog',
      'resume': 'Resume',
      'contact': 'Contact',
      'search': 'Search',
      'faq': 'FAQ',
      'testimonials': 'Testimonials',
      'fantasy-football': 'Fantasy Football'
    };

    if (labelMap[segment]) {
      return labelMap[segment];
    }

    // For blog posts, create readable titles from slugs
    if (fullPath.includes('/blog/') && segment !== 'blog') {
      // Handle specific blog post slugs with better formatting
      const blogTitleMap: Record<string, string> = {
        'complete-guide-qa-engineering': 'Complete Guide to QA Engineering',
        'mastering-fantasy-football-analytics': 'Mastering Fantasy Football Analytics',
        'building-reliable-software-systems': 'Building Reliable Software Systems'
      };
      
      if (blogTitleMap[segment]) {
        return blogTitleMap[segment];
      }
      
      // Convert slug to title format for other posts
      return segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Default: capitalize and replace hyphens
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const breadcrumbs = generateBreadcrumbs();

  // Generate structured data for breadcrumbs
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

  // Don't show breadcrumbs on home page unless custom items are provided
  if (pathname === "/" && !customItems) {
    return null;
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData())
        }}
      />
      
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className={`py-4 ${className}`}
      >
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <IconChevronRight className="w-4 h-4 text-slate-400 mx-2" />
              )}
              
              {item.isActive ? (
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  {item.label === "Home" && showHome ? (
                    <span className="flex items-center gap-1">
                      <IconHome className="w-4 h-4" />
                      Home
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-slate-600 dark:text-slate-400 hover:text-electric-blue dark:hover:text-electric-blue transition-colors"
                >
                  {item.label === "Home" && showHome ? (
                    <span className="flex items-center gap-1">
                      <IconHome className="w-4 h-4" />
                      Home
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

// Utility function to create custom breadcrumb items
export function createBreadcrumbItems(items: Array<{ label: string; href: string }>): BreadcrumbItem[] {
  return items.map((item, index, array) => ({
    ...item,
    isActive: index === array.length - 1
  }));
}