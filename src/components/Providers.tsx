"use client";

import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ScrollDepthTracker } from "@/components/analytics/ScrollDepthTracker";
import { FragmentLinkNavigation } from "@/components/navigation/FragmentLinkNavigation";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <FragmentLinkNavigation />
      {/* Both render nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */}
      <GoogleAnalytics />
      <ScrollDepthTracker />
    </ThemeProvider>
  );
}
