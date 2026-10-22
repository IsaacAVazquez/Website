"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PAINTERS } from "@/lib/siteDiscoveries";
import styles from "./discoveries.module.css";

/** Shares the portrait's painter attribute with the existing hover reveal. */
export function PortraitControls() {
  const root = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState<string[]>(["monet"]);
  const [painter, setPainter] = useState("monet");
  useEffect(() => {
    const portrait = root.current?.closest("[data-c97-monet]")?.querySelector<HTMLElement>('[data-c97-paint="portrait"]');
    if (!portrait) return;
    const read = () => {
      const name = portrait.dataset.c97Painter ?? "monet";
      setPainter(name);
      setSeen((previous) => previous.includes(name) ? previous : [...previous, name]);
    };
    const observer = new MutationObserver(read);
    observer.observe(portrait, { attributes: true, attributeFilter: ["data-c97-painter"] });
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className={styles.portraitControls}>
    <button type="button" aria-label="Change portrait painter" onClick={() => {
      const portrait = root.current?.closest("[data-c97-monet]")?.querySelector<HTMLElement>('[data-c97-paint="portrait"]');
      if (portrait) {
        portrait.dataset.c97StillPainting = "true";
        portrait.click();
      }
    }}>Another painter</button>
    <span aria-live="polite" className={styles.back}>{painter.replaceAll("-", " ")}</span>
    {seen.length === PAINTERS.length && <Link href="/back-room/gallery" prefetch={false}>The gallery is open</Link>}
  </div>;
}
