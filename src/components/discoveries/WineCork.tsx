"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./discoveries.module.css";

export function WineCork() {
  const [taps, setTaps] = useState(0);
  const cork = useRef<HTMLButtonElement>(null);
  const open = taps >= 3;
  return <div>
    <button ref={cork} type="button" className={styles.cork} aria-label="Inspect the cork" aria-expanded={open} aria-controls="website-wine-label" onClick={() => setTaps((count) => count + 1)}>
      <svg viewBox="0 0 56 40" aria-hidden="true"><g transform="rotate(-15 28 20)" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="10" width="48" height="20" rx="4" /><path d="M12 11v18M44 11v18M19 15h4m7 10h6m-18-4h3m13-6h4" /><text x="27" y="24" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none">97</text>
      </g></svg>
    </button>
    {taps > 0 && !open && <p role="status" className={styles.note}>There is something printed under the cork. Keep looking.</p>}
    {open && <section id="website-wine-label" className={styles.wineLabel} aria-label="A tasting note for this website" data-c97-surface="paper">
      <p className="c97-kicker">Estate bottled in the browser</p><h2>Château Side Project</h2>
      <p>Catalog 97 · Website blend</p>
      <p>Paper and ink, followed by fantasy football and a surprisingly long finish of public transit data.</p>
      <p>Best opened when you have time to look around.</p>
      <Link className={styles.back} href="/recipe-finder">Find something to pair it with</Link>
      <div><button className={styles.button} type="button" onClick={() => { setTaps(0); cork.current?.focus(); }}>Put the cork back</button></div>
    </section>}
  </div>;
}
