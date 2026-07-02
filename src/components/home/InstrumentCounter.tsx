"use client";

import { useEffect, useRef, useState } from "react";

interface InstrumentCounterProps {
  value: number;
}

/**
 * Count-up readout for the hero live index. Server-renders (and no-JS
 * renders) the final value, then counts up once when the readout first
 * scrolls into view. Respects prefers-reduced-motion by never animating.
 */
export function InstrumentCounter({ value }: InstrumentCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let started = false;

    const run = () => {
      const duration = 900;
      let start: number | null = null;
      const tick = (now: number) => {
        if (start === null) start = now;
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        observer.disconnect();
        setDisplay(0);
        run();
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={ref}>{display}</span>;
}
