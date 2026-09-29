"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * delegated document listener instead of a prop. Six stamps inside three
 * seconds knock the page out of register the way the code does, which is the
 * way in for a phone. Holding Option (Alt) lays press-proof marks over the
 * viewport, and the tab title changes while the tab is in the background.
 * Flipping the theme five times inside four seconds puts the page under a
 * darkroom safelight for a few seconds.
 */

const DRIFT_MS = 6000;
const TOAST_MS = 12000;
const IMPRINT_MS = 2400;
const MAX_IMPRINTS = 5;
const KNOCK_STAMPS = 6;
const KNOCK_WINDOW_MS = 3000;
const SAFELIGHT_MS = 6000;
const SAFELIGHT_FLIPS = 5;
const SAFELIGHT_WINDOW_MS = 4000;
const REPO_URL = "https://github.com/IsaacAVazquez/Website";
const AWAY_TITLE = "Still on the press…";
const NIGHT_TITLE = "Running the night shift…";
const NIGHT_SHIFT_ENDS = 5;
const PROOF_INKS = ["blue", "vermilion", "saffron", "peach"] as const;

const TOASTS = {
  konami: {
    title: "Out of register",
    body: "You found the code. The press needs a few seconds to line back up, and the arcade is open in the meantime.",
    arcade: true,
  },
  stamp: {
    title: "Out of register",
    body: "You stamped hard enough to knock the press out of line. It needs a few seconds to settle, and the arcade is open in the meantime.",
    arcade: true,
  },
  safelight: {
    title: "Safelight on",
    body: "You flipped the lights enough times to trip the safelight. It turns itself off in a few seconds.",
    arcade: false,
  },
} as const;

type ToastKind = keyof typeof TOASTS;

const onArcade = () => window.location.pathname.startsWith("/arcade");

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
  const [toast, setToast] = useState<ToastKind | null>(null);
  const [pageRoot, setPageRoot] = useState<Element | null>(null);
  const [proofing, setProofing] = useState(false);
  const [safelight, setSafelight] = useState(false);
  const pathname = usePathname();
  const anchor = useRef<HTMLSpanElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const driftTimer = useRef<number | undefined>(undefined);
  // Set for as long as the safelight is on, so it doubles as the "on" flag.
  const safelightTimer = useRef<number | undefined>(undefined);

  // The portal target is this header's own page root, found from a node this
  // component renders, so during a client navigation it can never be the
  // outgoing page's root. It is only knowable after mount.
  useEffect(() => {
    setPageRoot(anchor.current?.closest(".c97-page") ?? document.body);
  }, []);

  const openToast = useCallback((kind: ToastKind) => {
    setToast(kind);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  // The drift, shared by the code and the stamp.
  const knock = useCallback(
    (kind: ToastKind) => {
      const html = document.documentElement;
      html.classList.add(styles.misregistered);
      window.clearTimeout(driftTimer.current);
      driftTimer.current = window.setTimeout(
        () => html.classList.remove(styles.misregistered),
        DRIFT_MS,
      );
      openToast(kind);
    },
    [openToast],
  );

  // Konami code and the console note.
  useEffect(() => {
    logConsoleNote();
    const html = document.documentElement;
    html.classList.add(styles.stampable);
    let history: string[] = [];

    const onKeydown = (event: KeyboardEvent) => {
      // The arcade answers the code itself, and the toast would only point
      // back at the page the visitor is already on.
      if (onArcade()) return;
      if (shouldIgnoreKey(event)) return;
      history = pushKonamiKey(history, event.key);
      if (!isKonami(history)) return;
      history = [];
      knock("konami");
    };

    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.clearTimeout(driftTimer.current);
      window.clearTimeout(toastTimer.current);
      html.classList.remove(styles.misregistered, styles.stampable);
    };
  }, [knock]);

  const endSafelight = useCallback(() => {
    window.clearTimeout(safelightTimer.current);
    safelightTimer.current = undefined;
    setSafelight(false);
  }, []);

  // The darkroom safelight. The theme toggle loads late and lives in the
  // header, so the flips are read off the root's `dark` class, which
  // next-themes sets. The light comes on once and ignores every flip made
  // under it, so flipping faster can never make it flash.
  useEffect(() => {
    const html = document.documentElement;
    let wasDark = html.classList.contains("dark");
    let flips: number[] = [];

    const observer = new MutationObserver(() => {
      const isDark = html.classList.contains("dark");
      if (isDark === wasDark) return;
      wasDark = isDark;
      if (safelightTimer.current !== undefined) return;
      const now = Date.now();
      flips = [...flips.filter((at) => now - at < SAFELIGHT_WINDOW_MS), now];
      if (flips.length < SAFELIGHT_FLIPS) return;
      flips = [];
      setSafelight(true);
      safelightTimer.current = window.setTimeout(endSafelight, SAFELIGHT_MS);
      openToast("safelight");
    });

    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      window.clearTimeout(safelightTimer.current);
      safelightTimer.current = undefined;
    };
  }, [endSafelight, openToast]);

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

  // The tab title while the tab is in the background, which reads the night
  // shift from midnight until 5am on the visitor's own clock. If the page
  // changed its own title in the meantime, that title wins and nothing is
  // restored.
  useEffect(() => {
    let saved = "";
    let away = "";
    const onVisibility = () => {
      if (document.hidden) {
        saved = document.title;
        away = new Date().getHours() < NIGHT_SHIFT_ENDS ? NIGHT_TITLE : AWAY_TITLE;
        document.title = away;
      } else if (document.title === away) {
        document.title = saved;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (away && document.title === away) document.title = saved;
    };
  }, []);

  // Closing the safelight's toast turns the light off with it, so nobody who
  // dislikes the red has to sit through it.
  const close = useCallback(() => {
    window.clearTimeout(toastTimer.current);
    if (toast === "safelight") endSafelight();
    setToast(null);
  }, [toast, endSafelight]);

  // Esc closes the toast.
  useEffect(() => {
    if (!toast) return;
    const onKeydown = (event: KeyboardEvent) => {
      // An Esc inside a dialog, like the header search panel, belongs to that
      // dialog, so one press closes it and leaves the toast for the next one.
      if (event.key !== "Escape") return;
      if ((event.target as Element | null)?.closest?.('[role="dialog"]')) return;
      close();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [toast, close]);

  // The rubber stamp on the footer wordmark.
  useEffect(() => {
    const imprints: Element[] = [];
    const timers = new Set<number>();
    let stamps: number[] = [];

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const mark = target?.closest?.(".c97-footer-colophon .c97-wordmark");
      const sheet = mark?.closest<HTMLElement>(".c97-footer");
      if (!mark || !sheet) return;

      // Enough stamps close together knock the press, except on the arcade,
      // where the toast would point back at the page the visitor is on.
      const now = Date.now();
      stamps = [...stamps.filter((at) => now - at < KNOCK_WINDOW_MS), now];
      if (stamps.length >= KNOCK_STAMPS && !onArcade()) {
        stamps = [];
        knock("stamp");
      }

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
  }, [knock]);

  const restartToastTimer = () => {
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };

  // Portalled to the page root so the header's stacking context cannot bury it,
  // and so the status region exists before its message arrives. Hovering or
  // focusing the toast holds its auto-close, and the full 12s restarts once
  // it is neither hovered nor holding focus.
  const toastPortal = pageRoot
    ? createPortal(
        <div role="status" className={styles.region}>
          {toast ? (
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
              <p className={styles.toastTitle}>{TOASTS[toast].title}</p>
              <p className={styles.toastBody}>{TOASTS[toast].body}</p>
              <div className={styles.toastActions}>
                {TOASTS[toast].arcade ? (
                  <Link href="/arcade" className="c97-btn" onClick={close}>
                    Go to the arcade
                  </Link>
                ) : null}
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
              {
                // tz-local: today's date on the visitor's device for a proof
                // overlay that only exists post-interaction (never SSR).
                new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).replace(/\bSept\b/, "Sep")
              }
            </span>
          </div>,
          pageRoot,
        )
      : null;

  // One sheet of vermilion multiplied over the viewport.
  const safelightPortal =
    pageRoot && safelight
      ? createPortal(<div className={styles.safelight} aria-hidden="true" />, pageRoot)
      : null;

  return (
    <>
      <span ref={anchor} hidden />
      {toastPortal}
      {proof}
      {safelightPortal}
    </>
  );
}
