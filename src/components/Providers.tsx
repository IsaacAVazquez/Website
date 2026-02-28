"use client";

import { SessionProvider } from "next-auth/react";
import { PlayerImageCacheProvider } from "@/hooks/usePlayerImageCache";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <PlayerImageCacheProvider>
          {children}
        </PlayerImageCacheProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}