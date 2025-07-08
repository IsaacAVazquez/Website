"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { FloatingNav, GestureNavigation } from "@/components/ui/FloatingNav";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <GestureNavigation>
      {/* Mobile Navigation for all pages */}
      {!isHomePage && (
        <div className="fixed top-4 right-4 z-50 md:hidden">
          <Link 
            href="/"
            className="flex items-center justify-center w-12 h-12 bg-terminal-bg/90 border border-electric-blue/30 rounded-full backdrop-blur-md shadow-lg hover:bg-electric-blue/10 transition-all glow-effect"
            aria-label="Home"
          >
            <IconMenu2 className="w-6 h-6 text-electric-blue" />
          </Link>
        </div>
      )}

      {/* Full-screen layout for all pages */}
      <main id="main-content" className="min-h-screen w-full focus-ring" tabIndex={-1}>
        {children}
      </main>
      
      {/* Footer for non-home pages */}
      {!isHomePage && <Footer />}
      
      <FloatingNav />
      <CommandPalette />
    </GestureNavigation>
  );
}