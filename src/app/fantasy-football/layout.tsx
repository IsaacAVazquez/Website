"use client";

import { PlayerImageCacheProvider } from "@/hooks/usePlayerImageCache";

export default function FantasyFootballLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlayerImageCacheProvider>
      {children}
    </PlayerImageCacheProvider>
  );
}
