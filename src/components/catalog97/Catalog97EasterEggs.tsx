"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Catalog97EasterEggs.module.css";
import { isKonami, isTypingTarget, pushKonamiKey, shouldIgnoreKey } from "./konami";

/**
 * Small things for people who poke at the site, rendered once from
 * `Catalog97Header`.
 *
 * The Konami code knocks the page out of register for a few seconds and
 * points to the arcade, the console gets a short note once per full page
 * load, and the footer wordmark prints like a rubber stamp when clicked. The
 * footer is owned by `Catalog97Shell`, so the stamp reaches it through a
 * delegated document listener instead of a prop. Holding Option (Alt) lays
 * press-proof marks over the viewport, and the tab title changes while the
 * tab is in the background.
 */

const DRIFT_MS = 6000;
const TOAST_MS = 12000;
const IMPRINT_MS = 2400;
const MAX_IMPRINTS = 5;
const REPO_URL = "https://github.com/IsaacAVazquez/Website";
const AWAY_TITLE = "Still on the press…";
const PROOF_INKS = ["blue", "vermilion", "saffron", "peach"] as const;

// Module scope survives client navigation and React strict mode's second
// effect run, and resets on a full page load, which is exactly the "once" wanted.
let consoleNoteShown = false;

function logConsoleNote() {
  if (consoleNoteShown) return;
  consoleNoteShown = true;
  // The console cannot read page tokens, so resolve the two inks now.
  const root = document.querySelector("[data-c97]");
  const tokens = root ? getComputedStyle(root) : null;
  const vermilion = tokens?.getPropertyValue("--c97-riso-vermilion").trim();
  const blue = tokens?.getPropertyValue("--c97-riso-blue").trim();
  const title = [
    "font: 700 16px/1.6 sans-serif",
    vermilion ? `color: ${vermilion}` : "",
    blue ? `text-shadow: 2px 2px 0 ${blue}` : "",
  ].join(";");
  console.log(
    "%cHi, thanks for opening the console.\n%c" +
      "I spent a few years doing QA at Civitech, and I still write tests for this site, with Jest for the unit tests and Playwright for the browser tests.\n" +
      "It runs on Next.js, and most of the dashboards read committed data snapshots that scheduled GitHub Actions refresh.\n" +
      `The code is public at ${REPO_URL} if you want to look around.`,
    title,
    "font: 13px/1.6 sans-serif",
  );
}

export function Catalog97EasterEggs() {
  const [toastOpen, setToastOpen] = useState(false);
  const [pageRoot, setPageRoot] = useState<Element | null>(null);
  const [proofing, setProofing] = useState(false);
  const pathname = usePathname();
  const anchor = useRef<HTMLSpanElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // The portal target is this header's own page root, found from a node this
  // component renders, so during a client navigation it can never be the
  // outgoing page's root. It is only knowable after mount.
  useEffect(() => {
    setPageRoot(anchor.current?.closest(".c97-page") ?? document.body);
  }, []);

  // Konami code, the drift, and the console note.
  useEffect(() => {
    logConsoleNote();
    const html = document.documentElement;
    html.classList.add(styles.stampable);
    let history: string[] = [];
    let driftTimer: number | undefined;

    const onKeydown = (event: KeyboardEvent) => {
      // The arcade's game has its own keys, and the toast would only point
      // back at the page the visitor is already on.
      if (window.location.pathname.startsWith("/arcade")) return;
      if (shouldIgnoreKey(event)) return;
      history = pushKonamiKey(history, event.key);
      if (!isKonami(history)) return;
      history = [];
      html.classList.add(styles.misregistered);
      window.clearTimeout(driftTimer);
      driftTimer = window.setTimeout(
        () => html.classList.remove(styles.misregistered),
        DRIFT_MS,
      );
      setToastOpen(true);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToastOpen(false), TOAST_MS);
    };

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.clearTimeout(driftTimer);
      window.clearTimeout(toastTimer.current);
      html.classList.remove(styles.misregistered, styles.stampable);
    };
  }, []);

  // Proof marks while Option (Alt) is held on its own. Any other key means a
  // combo, like Alt+Tab or Alt+Left, and a lost keyup (the window losing
  // focus mid-hold) must not leave the marks stuck on.
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== "Alt") return setProofing(false);
      if (!event.repeat && !isTypingTarget(event.target)) setProofing(true);
    };
    const onKeyup = (event: KeyboardEvent) => {
      if (event.key === "Alt") setProofing(false);
    };
    const off = () => setProofing(false);
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("keyup", onKeyup);
    window.addEventListener("blur", off);
    document.addEventListener("visibilitychange", off);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("keyup", onKeyup);
      window.removeEventListener("blur", off);
      document.removeEventListener("visibilitychange", off);
    };
  }, []);

  // The tab title while the tab is in the background. If the page changed its
  // own title in the meantime, that title wins and nothing is restored.
  useEffect(() => {
    let saved = "";
    const onVisibility = () => {
      if (document.hidden) {
        saved = document.title;
        document.title = AWAY_TITLE;
      } else if (document.title === AWAY_TITLE) {
        document.title = saved;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (document.title === AWAY_TITLE) document.title = saved;
    };
  }, []);

  // Esc closes the toast.
  useEffect(() => {
    if (!toastOpen) return;
    const onKeydown = (event: KeyboardEvent) => {
      // An Esc inside a dialog, like the header search panel, belongs to that
      // dialog, so one press closes it and leaves the toast for the next one.
      if (event.key !== "Escape") return;
      if ((event.target as Element | null)?.closest?.('[role="dialog"]')) return;
      setToastOpen(false);
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [toastOpen]);

  // The rubber stamp on the footer wordmark.
  useEffect(() => {
    const imprints: Element[] = [];
    const timers = new Set<number>();

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const mark = target?.closest?.(".c97-footer-colophon .c97-wordmark");
      const sheet = mark?.closest<HTMLElement>(".c97-footer");
      if (!mark || !sheet) return;

      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!reduced && typeof mark.animate === "function") {
        mark.animate(
          [
            { transform: "none" },
            { transform: "translate(2px, 3px) scale(0.95)", offset: 0.35 },
            { transform: "none" },
          ],
          { duration: 240, easing: "ease-out" },
        );
      }

      const sheetBox = sheet.getBoundingClientRect();
      const markBox = mark.getBoundingClientRect();
      const width = markBox.width * 0.7;
      const height = markBox.height * 0.7;
      const imprint = mark.cloneNode(true) as SVGSVGElement;
      imprint.setAttribute("class", styles.imprint);
      imprint.setAttribute("aria-hidden", "true");
      imprint.style.width = `${width}px`;
      imprint.style.left = `${event.clientX - sheetBox.left - width / 2}px`;
      imprint.style.top = `${event.clientY - sheetBox.top - height / 2}px`;
      imprint.style.setProperty("--imprint-turn", `${(Math.random() * 12 - 6).toFixed(1)}deg`);
      sheet.appendChild(imprint);
      imprints.push(imprint);
      if (imprints.length > MAX_IMPRINTS) imprints.shift()?.remove();

      const timer = window.setTimeout(() => {
        timers.delete(timer);
        imprint.remove();
        const index = imprints.indexOf(imprint);
        if (index !== -1) imprints.splice(index, 1);
      }, IMPRINT_MS);
      timers.add(timer);
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((timer) => window.clearTimeout(timer));
      imprints.forEach((imprint) => imprint.remove());
    };
  }, []);

  const close = () => {
    window.clearTimeout(toastTimer.current);
    setToastOpen(false);
  };

  const restartToastTimer = () => {
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOpen(false), TOAST_MS);
  };

  // Portalled to the page root so the header's stacking context cannot bury it,
  // and so the status region exists before its message arrives. Hovering or
  // focusing the toast holds its auto-close, and the full 12s restarts once
  // it is neither hovered nor holding focus.
  const toast = pageRoot
    ? createPortal(
        <div role="status" className={styles.region}>
          {toastOpen ? (
            <div
              data-c97-surface="ink-saffron"
              className={`c97-offset ${styles.toast}`}
              onFocus={() => window.clearTimeout(toastTimer.current)}
              onMouseEnter={() => window.clearTimeout(toastTimer.current)}
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement))
                  restartToastTimer();
              }}
              onBlur={(event) => {
                const box = event.currentTarget;
                const focusStays = box.contains(
                  event.relatedTarget as Node | null,
                );
                if (!focusStays && !box.matches(":hover")) restartToastTimer();
              }}
            >
              <p className={styles.toastTitle}>Out of register</p>
              <p className={styles.toastBody}>
                You found the code. The press needs a few seconds to line back up,
                and the arcade is open in the meantime.
              </p>
              <div className={styles.toastActions}>
                <Link href="/arcade" className="c97-btn" onClick={close}>
                  Go to the arcade
                </Link>
                <button type="button" className="c97-btn-ghost" onClick={close}>
                  Close
                </button>
              </div>
            </div>
          ) : null}
        </div>,
        pageRoot,
      )
    : null;

  // Crop marks at the corners, registration targets top and bottom, a colour
  // bar in the press's four inks, and a slug line naming the page.
  const proof =
    pageRoot && proofing
      ? createPortal(
          <div className={styles.proof} aria-hidden="true">
            <span className={`${styles.crop} ${styles.cropTopLeft}`} />
            <span className={`${styles.crop} ${styles.cropTopRight}`} />
            <span className={`${styles.crop} ${styles.cropBottomLeft}`} />
            <span className={`${styles.crop} ${styles.cropBottomRight}`} />
            <span className={`${styles.target} ${styles.targetTop}`} />
            <span className={`${styles.target} ${styles.targetBottom}`} />
            <span className={styles.colorBar}>
              {PROOF_INKS.map((ink) => (
                <span key={ink} style={{ background: `var(--c97-riso-${ink})` }} />
              ))}
            </span>
            <span className={styles.slug}>
              Proof 1 · {pathname} ·{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).replace(/\bSept\b/, "Sep")}
            </span>
          </div>,
          pageRoot,
        )
      : null;

  return (
    <>
      <span ref={anchor} hidden />
      {toast}
      {proof}
    </>
  );
}
