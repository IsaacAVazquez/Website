"use client";

import { useRef, useState } from "react";
import { isRegistered } from "@/lib/siteDiscoveries";
import { downloadPoster } from "./downloadPrint";
import styles from "./discoveries.module.css";

const START = [9, -7, -8, 6];
const LABELS = ["Blue ink, horizontal", "Blue ink, vertical", "Red ink, horizontal", "Red ink, vertical"];

export function RegistrationGame() {
  const [offsets, setOffsets] = useState(START);
  const [message, setMessage] = useState("");
  const poster = useRef<HTMLDivElement>(null);
  const solved = isRegistered(offsets);
  return <div className={styles.game}>
    <div className={styles.poster} ref={poster} role="img" aria-label={solved ? "Aligned print reading One more side project" : "Blue and red copies of One more side project, out of alignment"}>
      <span aria-hidden="true" className={styles.ink} style={{ transform: `translate(${offsets[0]}px, ${offsets[1]}px)` }}>One more<br />side<br />project.</span>
      <span aria-hidden="true" className={styles.ink} style={{ transform: `translate(${offsets[2]}px, ${offsets[3]}px)` }}>One more<br />side<br />project.</span>
      <span aria-hidden="true" className={styles.posterCaption}>{solved ? "Approved for printing" : "Proof awaiting registration"}<br />Isaac Vazquez · Catalog 97</span>
    </div>
    <div className={styles.controls}>
      <p>Bring both ink layers onto the paper&apos;s zero marks. Adjust each slider until all four readings are within one unit of zero. The arrow keys move one unit at a time.</p>
      {LABELS.map((label, index) => <label key={label}>{label} <output>{offsets[index]}</output>
        <input aria-label={label} type="range" min={-16} max={16} step={1} value={offsets[index]} onChange={(event) => {
          const value = Number(event.target.value);
          setOffsets((current) => current.map((offset, i) => i === index ? value : offset));
        }} />
      </label>)}
      <p role="status" aria-label="Print status" className={styles.status}>{solved ? "Approved for printing. Your souvenir is ready." : "The press is waiting. Both ink layers need to line up with the paper."}</p>
      <div className={styles.actions}>
        {solved && <button type="button" className={styles.button} onClick={() => {
          try {
            if (poster.current) downloadPoster(poster.current);
          } catch { setMessage("Image export is unavailable. You can print this page from your browser."); }
        }}>Save souvenir print</button>}
        <button type="button" className={styles.button} onClick={() => { setOffsets(START); setMessage(""); }}>Reset inks</button>
      </div>
      <p role="status" className={styles.note}>{message}</p>
    </div>
  </div>;
}
