"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const fullWidthRoutes = new Set(["/investments", "/march-madness-2026"]);
  const isFullWidthRoute = fullWidthRoutes.has(pathname);

  return (
    <>
      <div className="min-h-screen">
        <main
          id="main-content"
          role="main"
          aria-label={isHomePage ? "Isaac Vazquez Portfolio Homepage" : "Portfolio Content"}
          tabIndex={-1}
        >
          {isHomePage ? (
            children
          ) : isFullWidthRoute ? (
            children
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
              {children}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
