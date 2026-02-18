"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { Footer } from "@/components/Footer";
import { FloatingNav, GestureNavigation } from "@/components/ui/FloatingNav";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { PageTransition } from "@/components/ui/PageTransition";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { 
    showFloatingNav, 
    pathname 
  } = useNavigation();
  
  const isHomePage = pathname === "/";
  const isFantasyFootballPage = pathname.startsWith('/fantasy-football');
  const isFullWidthPage = isFantasyFootballPage;

  return (
    <GestureNavigation>
      {/* Skip Navigation Links for Accessibility */}
      <div className="sr-only">
        <a
          href="#main-content"
          className="fixed top-4 left-4 z-[100] px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md focus:not-sr-only focus:absolute transition-all"
        >
          Skip to main content
        </a>
        {showFloatingNav && (
          <a
            href="#navigation"
            className="fixed top-4 left-36 z-[100] px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md focus:not-sr-only focus:absolute transition-all"
          >
            Skip to navigation
          </a>
        )}
      </div>

      {/* Layout Container */}
      <div className={isFullWidthPage
        ? "min-h-screen w-full"
        : "min-h-screen flex bg-neutral-50 dark:bg-neutral-50"
      }>
        
        {/* Main Content */}
        <main
          id="main-content"
          role="main"
          aria-label={isHomePage ? "Isaac Vazquez Portfolio Homepage" :
                     isFantasyFootballPage ? "Fantasy Football Analytics Platform" :
                     "Portfolio Content"}
          className={isFullWidthPage
            ? "min-h-screen w-full focus-ring"
            : "flex-1 min-h-screen focus-ring md:ml-0"
          }
          tabIndex={-1}
        >
          <PageTransition>
            {isFullWidthPage ? (
              children
            ) : isHomePage ? (
              children
            ) : (
              <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                <Breadcrumbs className="mb-8" />
                {children}
              </div>
            )}
          </PageTransition>
        </main>
      </div>

      {/* Footer for non-home and non-fantasy pages */}
      {!isHomePage && !isFantasyFootballPage && <Footer />}
      
      {/* Floating Navigation - show on home page or mobile */}
      {showFloatingNav && <FloatingNav />}
      
      <CommandPalette />
    </GestureNavigation>
  );
}