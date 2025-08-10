"use client";

import { SessionProvider } from "next-auth/react";
import { PlayerImageCacheProvider } from "@/hooks/usePlayerImageCache";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PlayerImageCacheProvider>
        {children}
      </PlayerImageCacheProvider>
    </SessionProvider>
  );
}