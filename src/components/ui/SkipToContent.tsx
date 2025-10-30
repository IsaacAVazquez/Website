"use client";

import { useEffect, useState } from "react";

/**
 * SkipToContent Component
 *
 * Provides a keyboard-accessible link that allows users to skip navigation
 * and jump directly to the main content. This is essential for screen reader
 * users and keyboard navigation accessibility (WCAG 2.1 AA compliance).
 *
 * The link is visually hidden but appears when focused with Tab key.
 *
 * @example
 * // Add to layout.tsx before main navigation
 * <SkipToContent />
 */
export function SkipToContent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById("main-content");

    if (mainContent) {
      mainContent.setAttribute("tabindex", "-1");
      mainContent.focus();

      // Remove tabindex after focus to maintain natural tab order
      setTimeout(() => {
        mainContent.removeAttribute("tabindex");
      }, 1000);
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="skip-link"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

/**
 * MainContentWrapper Component
 *
 * Wrapper component that adds the necessary ID for skip-to-content functionality.
 * Use this to wrap your main content area.
 *
 * @example
 * <MainContentWrapper>
 *   <YourPageContent />
 * </MainContentWrapper>
 */
export function MainContentWrapper({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      id="main-content"
      className={className}
      role="main"
    >
      {children}
    </main>
  );
}
