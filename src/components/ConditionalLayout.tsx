"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { Footer } from "@/components/Footer";
import { FloatingNav, GestureNavigation } from "@/components/ui/FloatingNav";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

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
      {/* Skip Link for Accessibility */}

      {/* Layout Container */}
      <div className={isFullWidthPage 
        ? "min-h-screen w-full" 
        : "min-h-screen flex bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#0A0A0B] dark:via-[#0F172A] dark:to-[#1E293B]"
      }>
        
        {/* Main Content */}
        <main 
          id="main-content" 
          className={isFullWidthPage 
            ? "min-h-screen w-full focus-ring" 
            : "flex-1 min-h-screen focus-ring md:ml-0"
          }
          tabIndex={-1}
        >
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