"use client";

import { usePathname } from "next/navigation";
import { Catalog97ToolShell } from "@/components/catalog97/Catalog97ToolShell";
import { projectBuildNoteLinks } from "@/components/projectBuildNoteLinks";
import { isCatalog97Route } from "@/constants/catalog97Nav";
import { getProjectPress } from "@/constants/projectPress";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * Decides which shell a route renders in.
 *
 * The seven designed Catalog 97 routes (`isCatalog97Route`) render their own
 * `Catalog97Shell` inside the page component, so they pass through untouched.
 * Every other route, `/admin` included, is wrapped in `Catalog97ToolShell`,
 * which supplies the same header, the only `main` landmark, the espresso
 * footer, and the build-note aside for routes registered in
 * `projectBuildNoteLinks`. The Working Instrument shell that used to live here
 * was deleted on 2026-09-16.
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  if (isCatalog97Route(pathname)) {
    return <>{children}</>;
  }

  return (
    <Catalog97ToolShell
      route={pathname}
      buildNoteHref={projectBuildNoteLinks[pathname]}
      press={getProjectPress(pathname)}
    >
      {children}
    </Catalog97ToolShell>
  );
}
