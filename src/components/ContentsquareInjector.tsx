"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const CONTENTSQUARE_SRC = "https://t.contentsquare.net/uxa/248dde0734062.js";

export function ContentsquareInjector() {
  const pathname = usePathname();

  if (process.env.NODE_ENV !== "production" || pathname === "/") {
    return null;
  }

  return (
    <Script
      id="contentsquare"
      src={CONTENTSQUARE_SRC}
      strategy="lazyOnload"
    />
  );
}
