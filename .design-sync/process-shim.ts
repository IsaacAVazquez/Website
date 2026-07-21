// next/* client internals (next/link, next/image shared runtime) read
// process.env.__NEXT_* feature flags at module scope; browsers have no
// `process`. Define a minimal one before any next module evaluates — the
// flags then read as undefined and fall back to Next's client defaults.
const g = globalThis as unknown as {
  process?: { env: Record<string, string | undefined> };
};
if (!g.process) {
  g.process = { env: {} };
} else if (!g.process.env) {
  g.process.env = {};
}

// Static-capture determinism: the sync harness screenshots with a frozen
// page clock, so rAF-driven entrances (Framer Motion) never leave their
// first frame. Under local capture origins only, answer the reduced-motion
// media query with `true` — every animated component in this repo already
// branches on it (DESIGN_CHECKLIST.md, Motion) and renders its final state
// directly. This must evaluate before framer-motion's module body installs
// its listener, which is why it lives in the entry's first import. Real
// renders on claude.ai/design are untouched and keep their animations.
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const loc = window.location;
  const isStaticCapture =
    loc.protocol === "file:" || /^(127\.0\.0\.1|localhost)$/.test(loc.hostname);
  if (isStaticCapture) {
    // The frozen capture clock also freezes rAF timestamps, stranding
    // JS-driven tweens mid-flight (opacity 0 screenshots). Feed callbacks a
    // synthetic timeline that advances +10s per frame: every tween reaches
    // its final state within a frame or two, wall-clock fast, deterministic.
    let syntheticNow = 0;
    const origRaf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = ((cb: FrameRequestCallback) =>
      origRaf(() => {
        syntheticNow += 10_000;
        cb(syntheticNow);
      })) as typeof window.requestAnimationFrame;

    // Framer runs opacity (and other compositable values) through WAAPI,
    // which outlives the screenshot however it gets started (play(), or a
    // direct startTime assignment). Sweep the document every frame and jump
    // any running animation to its end state.
    const finishAll = () => {
      try {
        for (const anim of document.getAnimations?.() ?? []) {
          try {
            if (anim.playState === "running") anim.finish();
          } catch {
            // Infinite animations can't finish(); leave them as-is.
          }
        }
      } catch {
        /* getAnimations unsupported */
      }
      origRaf(finishAll);
    };
    origRaf(finishAll);

    const orig = window.matchMedia.bind(window);
    window.matchMedia = ((query: string) => {
      const mql = orig(query);
      if (/prefers-reduced-motion:\s*reduce/i.test(query)) {
        return new Proxy(mql, {
          get: (t, p) =>
            p === "matches"
              ? true
              : typeof (t as unknown as Record<PropertyKey, unknown>)[p] === "function"
                ? (t as unknown as Record<PropertyKey, (...a: unknown[]) => unknown>)[p].bind(t)
                : (t as unknown as Record<PropertyKey, unknown>)[p],
        }) as MediaQueryList;
      }
      return mql;
    }) as typeof window.matchMedia;
  }
}
