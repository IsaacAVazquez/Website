"use client";

import { useEffect } from "react";

// How long the page has to stay still before the landing is final.
const SETTLE_MS = 5000;

// How long after a landing a shift in the page is still the browser's doing.
const NUDGE_MS = 200;

// How far into the load the page can only be where the browser put it. Past
// this the visitor has had time to scroll.
const EARLY_MS = 3000;

const near = (a: number, b: number) => Math.abs(a - b) <= 1;

function readFragment() {
  const written = window.location.hash.slice(1);
  try {
    return decodeURIComponent(written);
  } catch {
    // A broken escape, as in "#100%". The id is read as it is written.
    return written;
  }
}

// Where a landing aims the page for this section, or null while the section
// has no box, which is the case inside the container React streams it in.
function landingSpot(section: HTMLElement) {
  if (section.getClientRects().length === 0) return null;
  const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
  return Math.max(0, window.scrollY + section.getBoundingClientRect().top - margin);
}

/**
 * Lands a fresh load on the element its URL fragment names, and holds it
 * there while the page settles. Renders nothing.
 *
 * A browser looks the fragment up as it finishes parsing and keeps the element
 * it found. React streams a route that has a `loading.tsx` inside a hidden
 * container and reveals it on the next frame, or 300ms after the fallback
 * first painted. On a fast connection that is after parsing ends, so the
 * element the browser kept has no box to scroll to, and for a section with a
 * Suspense fallback of its own the element is the fallback, which the reveal
 * removes. Chromium, Firefox, and WebKit all left the page at the top when the
 * section first had a box after the load event.
 *
 * When a browser does land, Chromium and WebKit animate there under
 * `scroll-behavior: smooth`, and neither aimed again when the section moved
 * after the load event. Content that renders above the section while the
 * animation runs, saved holdings on /investments for one, leaves the page
 * where the section used to be.
 *
 * So the landing is made here, without an animation, and looked at again in
 * every frame until the page has settled. It only scrolls a page that sits
 * where a landing left it, this one's or the browser's. A page the visitor has
 * scrolled sits somewhere else, which tells it apart without knowing who did
 * the scrolling.
 *
 * The exceptions are two moments when the page can only be where a browser
 * put it. One is a mount early in the load, where the browser's own landing
 * may be in flight, or at rest on a spot the section has since left. An
 * instant scroll ended an animation in flight in all three browsers. The other
 * is the moment after a landing made here, because Chromium adds what its
 * animation had covered to where this one put the page.
 *
 * Browsers also scroll by themselves to keep what is on screen still when the
 * page changes. On /la-liga that moved the page up 10px while the section
 * moved down 9px, so that anchoring is off for as long as the page sits on a
 * landing.
 */
export function FragmentScrollOnLoad() {
  useEffect(() => {
    const id = readFragment();
    if (!id) return;

    // A reload or a trip through history puts the page back where it was.
    const [entry] = performance.getEntriesByType?.("navigation") ?? [];
    const reachedBy = (entry as PerformanceNavigationTiming | undefined)?.type;
    if (reachedBy === "reload" || reachedBy === "back_forward") return;

    // Every spot a landing was aimed at, as of each time this looked. A fresh
    // load sits at the top.
    let spots = new Set([0]);
    const mountedAt = performance.now() < EARLY_MS ? performance.now() : -Infinity;
    let landedAt = -Infinity;

    const anchor = (browserAnchors: boolean) => {
      document.documentElement.style.overflowAnchor = browserAnchors ? "" : "none";
    };

    // Puts the page on the section when the page is this one's to move, and
    // returns what the layout looks like to a landing.
    const hold = () => {
      const section = document.getElementById(id);
      const spot = section ? landingSpot(section) : null;
      const at = window.scrollY;
      // A landing aimed past the end of the page comes to rest at the end.
      const end = document.documentElement.scrollHeight - window.innerHeight;
      const restsOn = (aim: number | null) => aim !== null && near(at, Math.min(aim, end));
      // The page is in a browser's hands for a moment after a mount early in
      // the load, and after each landing made here.
      const now = performance.now();
      const landing = now - landedAt < NUDGE_MS;
      const browsers = landing || now - mountedAt < NUDGE_MS;

      if (!browsers && ![...spots, spot].some(restsOn)) {
        // Moved by the visitor, or by a landing of the browser's own that is
        // still in flight and will come to rest on a spot recorded here.
        spots.delete(0);
        if (spot !== null) spots.add(spot);
        anchor(true);
      } else if (section && spot !== null) {
        if (!restsOn(spot)) {
          section.scrollIntoView({ behavior: "instant" });
          // Counted from the first landing of a run, so a visitor who is
          // scrolling through it is answered for a moment and then left alone.
          if (!landing) landedAt = now;
        }
        spots = new Set([window.scrollY]);
        anchor(false);
      }

      return `${spot} of ${end}`;
    };

    let frame = 0;
    let drawnAt = performance.now();
    let stillFor = 0;
    let layout = "";

    const stop = () => {
      window.cancelAnimationFrame(frame);
      anchor(true);
    };

    const draw = () => {
      const now = performance.now();
      const seen = hold();
      // Only time in which frames are drawn counts. A tab opened in the
      // background draws none, so React reveals nothing in it and the wait
      // starts once the visitor turns to it.
      stillFor = seen === layout ? stillFor + Math.min(now - drawnAt, 100) : 0;
      layout = seen;
      drawnAt = now;

      if (stillFor < SETTLE_MS) frame = window.requestAnimationFrame(draw);
      else stop();
    };

    draw();

    return stop;
  }, []);

  return null;
}
