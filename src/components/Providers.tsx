"use client";

import { ThemeProvider } from "next-themes";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ScrollDepthTracker } from "@/components/analytics/ScrollDepthTracker";
import { ActionClickTracker } from "@/components/analytics/ActionClickTracker";
import { FragmentLinkNavigation } from "@/components/navigation/FragmentLinkNavigation";
import { FragmentScrollOnLoad } from "@/components/navigation/FragmentScrollOnLoad";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <FragmentLinkNavigation />
      <FragmentScrollOnLoad />
      {/* All three render nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set. */}
      <GoogleAnalytics />
      <ScrollDepthTracker />
      <ActionClickTracker />
    </ThemeProvider>
  );
}
