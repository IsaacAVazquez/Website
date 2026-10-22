"use client";

import { useEffect, useRef, useState } from "react";
import { VISIT_NAMES, type VisitEntry } from "@/lib/siteDiscoveries";
import { clearVisits, readVisits } from "@/lib/visitReceipt";
import { downloadPrint } from "./downloadPrint";
import { DISPLAY_TIME_ZONE } from "@/lib/date-formatters";
import styles from "./discoveries.module.css";

export function VisitReceipt() {
  const [entries, setEntries] = useState<VisitEntry[]>([]);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const paper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this tab's storage is only available after hydration
    setEntries(readVisits());
    setDate(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: DISPLAY_TIME_ZONE }));
  }, []);
  const lines = ["ISAAC VAZQUEZ", "A RECEIPT FOR YOUR VISIT", date, "",
    ...entries.map(({ path, count }) => `${count} x ${VISIT_NAMES[path]}    $0.00`),
    "", "TOTAL                           $0.00", "",
    "Time I was supposed to spend doing", "something else is nonrefundable.", "", "Thanks for looking around."];
  return <>
    <div ref={paper} className={styles.receipt}>
      <h2>Isaac Vazquez</h2>
      <p className={styles.receiptFooter}>A receipt for your visit<br />{date}</p>
      <ol aria-label="Pages explored">{entries.map(({ path, count }) => <li key={path}>
        <span>{VISIT_NAMES[path]}<small>Qty {count}</small></span><span>$0.00</span>
      </li>)}</ol>
      {entries.length === 0 && <p>Your next page starts a new receipt. Take a look around and come back.</p>}
      <p className={styles.total}><span>Total</span><span>$0.00</span></p>
      <p className={styles.receiptFooter}>Time I was supposed to spend doing something else is nonrefundable.</p>
      <div className={styles.barcode} aria-hidden="true" />
      <p className={styles.receiptFooter}>Thanks for looking around.</p>
    </div>
    <div className={styles.actions}>
      <button type="button" className={styles.button} onClick={() => {
        try { if (paper.current) downloadPrint(paper.current, lines, "visit-receipt.png"); }
        catch { setMessage("Image export is unavailable. You can still print this page from your browser."); }
      }}>Save receipt as image</button>
      <button type="button" className={styles.button} onClick={() => { clearVisits(); setEntries([]); setMessage("Receipt cleared."); }}>Clear receipt</button>
    </div>
    <p className={styles.note}>This receipt remembers public tools and main pages opened in this tab, up to 40 destinations. It leaves out article addresses, search queries, and private tools, and nothing is sent to a server.</p>
    <p role="status" className={styles.note}>{message}</p>
  </>;
}
