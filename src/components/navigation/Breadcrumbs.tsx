/* eslint-disable react-refresh/only-export-components -- co-located helper is intentional */

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  customItems: BreadcrumbItem[];
  className?: string;
}

/*
 * The same `.c97-breadcrumb` trail the writing routes print. It used to sit in
 * a translucent, blurred box with Tailwind spacing, which put a backdrop blur
 * on scrolling content and painted a tint the rest of the system does not use.
 */
export function Breadcrumbs({ customItems: breadcrumbs, className = "" }: BreadcrumbsProps) {
  // The visible trail only. Each page emits its own BreadcrumbList JSON-LD from
  // page.tsx, so a copy here duplicated it and could disagree with it.
  return (
    <nav aria-label="Breadcrumb" className={className || undefined}>
      <ol className="c97-breadcrumb">
        {breadcrumbs.map((item) =>
          item.isActive ? (
            <li key={item.href} aria-current="page">
              {item.label}
            </li>
          ) : (
            <li key={item.href}>
              <Link href={item.href} className="c97-microlink">
                {item.label}
              </Link>
            </li>
          )
        )}
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
