"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  getBrowserStorageSnapshot, readBrowserStorageString, removeBrowserStorageString, subscribeBrowserStorage, writeBrowserStorageJson,
} from "@/lib/browserStorage";
import { cleanGuestMessage, GUESTBOOK_KEY, parseGuestbook } from "@/lib/siteDiscoveries";
import styles from "./discoveries.module.css";

const subscribe = (listener: () => void) => subscribeBrowserStorage(GUESTBOOK_KEY, listener);

export function RetroHome() {
  // Follows other tabs, and every write starts from the latest save, so two tabs never drop each other's entries.
  const raw = useSyncExternalStore(subscribe, () => getBrowserStorageSnapshot(GUESTBOOK_KEY, "[]"), () => "[]");
  const messages = useMemo(() => parseGuestbook(raw), [raw]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  function sign(event: FormEvent) {
    event.preventDefault();
    const message = cleanGuestMessage(draft);
    if (!message) return;
    const latest = parseGuestbook(readBrowserStorageString(GUESTBOOK_KEY).value);
    setStatus(writeBrowserStorageJson(GUESTBOOK_KEY, [message, ...latest].slice(0, 12)) === "persistent"
      ? "Guestbook saved in this browser. Thanks for stopping by!"
      : "Entry kept while this page is open. Browser storage is unavailable.");
    setDraft("");
  }
  return <div className={styles.retro}>
    <h2>Welcome to Isaac&apos;s homepage!</h2>
    <p className={styles.receiptFooter}>Product, sports, and whatever else I wanted to build.</p>
    <nav aria-label="1997 homepage">
      <Link href="/portfolio">My work</Link><Link href="/writing">My writing</Link>
      <Link href="/dashboards">Cool links</Link><Link href="/about">About me</Link><Link href="/contact">Email me</Link>
    </nav>
    <p className={styles.construction}>Under construction since approximately forever</p>
    <span className={styles.counter} aria-label="Decorative visitor counter 000097">000097</span>
    <p className={styles.receiptFooter}>A commemorative counter, fixed at 97.<br />Optimized for a much larger monitor.</p>
    <section className={styles.guestbook}>
      <h3>Sign my guestbook</h3>
      <p>Your note stays in this browser. I can&apos;t read it, and other visitors can&apos;t see it.</p>
      <form onSubmit={sign}>
        <label htmlFor="guestbook-message">Leave a message, up to 160 characters</label>
        <input id="guestbook-message" maxLength={160} required value={draft} onChange={(event) => setDraft(event.target.value)} />
        <div className={styles.actions}><button className={styles.button} type="submit">I was here</button>
          <button className={styles.button} type="button" onClick={() => setStatus(removeBrowserStorageString(GUESTBOOK_KEY) === "persistent"
            ? "Guestbook cleared." : "Entries on this page cleared. Browser storage is unavailable.")}>Clear guestbook</button></div>
      </form>
      <p role="status" className={styles.note}>{status}</p>
      <ul aria-label="Your guestbook entries">{messages.map((message, index) => <li key={index}>{message}</li>)}</ul>
    </section>
  </div>;
}
