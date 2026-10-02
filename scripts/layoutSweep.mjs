#!/usr/bin/env node
// Layout sweep over live pages at phone, tablet, laptop, and big-monitor sizes.
//   node scripts/layoutSweep.mjs http://localhost:3500              # every public route
//   node scripts/layoutSweep.mjs http://localhost:3500 /about /nfl   # only these
//   flags: --sizes=phone,landscape,tablet,laptop,big  --shots  --scan  --webkit
//          --out=<dir>  --workers=4
// Each route loads fresh at each size. The probe flags page and element
// overflow (including overflow a clipping root hides), an h1, breadcrumb, main
// shell, or footer whose edges miss the header's content edges, text squeezed
// into a sliver or clipped by its box, grid rows that end on one orphan, sticky
// and scroll offsets, space-y gaps a Catalog 97 class zeroes, phone touch
// targets under 44px, and the Home fold. --shots saves first-screen shots at
// 390, 1440, and 1920, full pages for the seven designed routes, and a crop of
// every fail and review finding. --scan also walks one load from 320 to 1920 in
// 16px steps for overflow and edges. Writes findings.json, summary.tsv, and
// sheet.html to --out and exits 1 on any `fail`.
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, webkit } from "playwright";
import sitemapModule from "../src/lib/sitemap.js";

export const SIZES = {
  phone: [
    [320, 740],
    [360, 800],
    [390, 844],
    [430, 932],
  ],
  landscape: [[844, 390]],
  tablet: [
    [768, 1024],
    [1024, 768],
  ],
  laptop: [
    [1280, 800],
    [1440, 900],
    [1512, 982],
  ],
  big: [
    [1920, 1080],
    [2560, 1440],
  ],
};
const MOBILE = { isMobile: true, hasTouch: true, deviceScaleFactor: 3 };
const SHOT_WIDTHS = new Set([390, 1440, 1920]);
const FOLD_SIZES = new Set(["1280x800", "1440x900"]);
const DESIGNED = new Set(["/", "/portfolio", "/writing", "/dashboards", "/about", "/resume", "/contact"]);
// Noindex pages the sitemap leaves out, three posts (long inline code and a
// table, the longest post, a second table), one topic, and a 404.
const EXTRA_ROUTES = [
  "/search",
  "/score-pools/settings",
  "/writing/complete-guide-qa-engineering",
  "/writing/is-the-ai-mega-cap-rally-a-bubble",
  "/writing/qa-engineering-silicon-valley-uc-berkeley-mba-perspective",
  "/writing/topics/sports-fantasy",
  "/this-page-does-not-exist",
];

export function defaultRoutes() {
  const pages = sitemapModule.PUBLIC_SITEMAP_ENTRIES.map((entry) => entry.loc).filter(
    (loc) => !loc.startsWith("/writing/")
  );
  return [...new Set([...pages, ...EXTRA_ROUTES])];
}

/** Runs inside the page. Exported so it can be calibrated against a known page. */
export function measureLayout({ phone = false, fold = false, edgesOnly = false } = {}) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const styles = new Map();
  const css = (el) => {
    if (!styles.has(el)) styles.set(el, getComputedStyle(el));
    return styles.get(el);
  };
  window.__sweepId = window.__sweepId || 0;
  const findings = [];
  const describe = (el) => {
    const cls = [...el.classList].slice(0, 3).join(".");
    const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}${text ? ` "${text}"` : ""}`;
  };
  const add = (level, kind, el, detail) => {
    if (!el.dataset.sweepId) el.dataset.sweepId = String(window.__sweepId++);
    const r = el.getBoundingClientRect();
    findings.push({
      level,
      kind,
      id: el.dataset.sweepId,
      selector: describe(el),
      detail,
      rect: { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height },
    });
  };
  const px = (value) => parseFloat(value) || 0;
  const contentBox = (el) => {
    const r = el.getBoundingClientRect();
    const s = css(el);
    const left = r.left + px(s.borderLeftWidth) + px(s.paddingLeft);
    const right = r.right - px(s.borderRightWidth) - px(s.paddingRight);
    return { left, right, width: right - left };
  };
  const shown = (el) => {
    const s = css(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
  const firstTextRect = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const node = walker.nextNode();
    if (!node) return null;
    const range = document.createRange();
    range.selectNodeContents(node);
    return [...range.getClientRects()].find((r) => r.width > 0) || null;
  };
  const painted = (s) =>
    !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(s.backgroundColor) && !/\/\s*0\)$/.test(s.backgroundColor)
      ? true
      : px(s.borderLeftWidth) > 0 || px(s.borderTopWidth) > 0 || s.boxShadow !== "none" || s.backgroundImage !== "none";
  const near = (a, b) => Math.abs(a - b) <= 1;

  const stats = {
    docOverflow: document.documentElement.scrollWidth - vw,
    headerHeight: Math.round(document.querySelector(".c97-header")?.getBoundingClientRect().height ?? 0),
  };
  if (stats.docOverflow > 1) {
    findings.push({ level: "fail", kind: "page-overflow", selector: "html", detail: `${stats.docOverflow}px wider than the viewport`, rect: null });
  }

  const body = [...document.body.querySelectorAll("*")].filter(
    (el) => !el.closest("script, style, noscript, template, [data-sweep-skip]") && shown(el)
  );

  // Overflow. Only the outermost offender is reported, and anything inside an
  // overflow-x scroller is intentional.
  const reported = new Set();
  const underReported = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) if (reported.has(p)) return true;
    return false;
  };
  const meaningful = (el) =>
    el.matches("a, button, input, select, textarea, img, canvas, video, table, [role='button'], [role='img'], svg") ||
    Boolean(ownText(el));
  for (const el of body) {
    const inSvg = el.closest("svg") && el.tagName.toLowerCase() !== "svg";
    if (inSvg && !(el instanceof SVGTextElement)) continue;
    const r = el.getBoundingClientRect();
    let clip = null;
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      if (css(p).overflowX !== "visible") {
        clip = p;
        break;
      }
    }
    if (clip && /auto|scroll/.test(css(clip).overflowX)) continue;
    if (!clip) {
      if ((r.right > vw + 1 || r.left < -1) && !underReported(el) && css(el).position !== "fixed") {
        reported.add(el);
        add("fail", "element-overflow", el, `spans ${Math.round(r.left)} to ${Math.round(r.right)} in a ${vw}px viewport`);
      }
      continue;
    }
    if (edgesOnly || !meaningful(el) || el.closest("[aria-hidden='true']")) continue;
    const c = clip.getBoundingClientRect();
    // A visually hidden (sr-only) box clips on purpose.
    if (c.width <= 1 || c.height <= 1) continue;
    if ((r.right > c.right + 1 || r.left < c.left - 1) && !underReported(el)) {
      reported.add(el);
      // A clip as wide as the page is hiding page overflow; a card clipping
      // its own content is a narrower question.
      const pageRoot = c.width >= vw * 0.9 && (r.right > vw + 1 || r.left < -1);
      const past = Math.round(Math.max(r.right - c.right, c.left - r.left));
      add(pageRoot ? "fail" : "review", "clipped-overflow", el, `cut by ${describe(clip).slice(0, 60)} (${past}px past its ${r.right > c.right + 1 ? "right" : "left"} edge)`);
    }
  }

  // Edges. The header row is the site's content column; the h1, breadcrumb box,
  // every full-width main shell, and the footer shell should share its edges.
  const headerRow = document.querySelector(".c97-header-row");
  if (headerRow) {
    const H = contentBox(headerRow);
    stats.headerLeft = Math.round(H.left);
    const h1 = document.querySelector("main h1");
    if (h1 && shown(h1)) {
      const b = contentBox(h1);
      if (!near(b.left, H.left)) add("fail", "edge", h1, `h1 starts at ${Math.round(b.left)}, header at ${Math.round(H.left)}`);
    }
    const crumbs = document.querySelector("main nav[aria-label='Breadcrumb'] ol");
    if (crumbs && shown(crumbs)) {
      const b = crumbs.getBoundingClientRect();
      if (!near(b.left, H.left)) add("fail", "edge", crumbs, `breadcrumb box starts at ${Math.round(b.left)}, header at ${Math.round(H.left)}`);
    }
    for (const shell of document.querySelectorAll("main .c97-shell")) {
      if (!shown(shell)) continue;
      const b = contentBox(shell);
      if (b.width > H.width + 2) {
        add("fail", "edge", shell, `shell is ${Math.round(b.width)}px wide, header column ${Math.round(H.width)}px`);
      } else if (Math.abs(b.width - H.width) <= 2 && !near(b.left, H.left)) {
        add("fail", "edge", shell, `shell starts at ${Math.round(b.left)}, header at ${Math.round(H.left)}`);
      }
    }
    const footerShell = document.querySelector(".c97-footer > .c97-shell");
    if (footerShell && shown(footerShell)) {
      const b = contentBox(footerShell);
      if (!near(b.left, H.left) || !near(b.right, H.right)) {
        add("fail", "edge", footerShell, `footer spans ${Math.round(b.left)} to ${Math.round(b.right)}, header ${Math.round(H.left)} to ${Math.round(H.right)}`);
      }
    }
    if (!edgesOnly) {
      // Near misses: a box on the column edge with no visible fill or border
      // whose text starts a few pixels inside it (padding nobody sees).
      for (const el of body) {
        if (!el.closest("main") || el.closest("li, svg, table, summary")) continue;
        const r = el.getBoundingClientRect();
        if (!near(r.left, H.left) || painted(css(el)) || css(el).textAlign === "center") continue;
        // Text inset inside a box that is itself drawn on the edge is the box's padding, which is intended.
        let boxed = false;
        for (let p = el.parentElement; p && p.tagName !== "MAIN"; p = p.parentElement) {
          if (near(p.getBoundingClientRect().left, H.left) && painted(css(p))) { boxed = true; break; }
        }
        if (boxed) continue;
        if (!ownText(el) && !el.matches("a, button")) continue;
        const t = firstTextRect(el);
        if (!t) continue;
        // A leading icon starts the line, so measure from whichever comes first.
        const lead = el.firstElementChild?.getBoundingClientRect();
        const inset = Math.min(t.left, lead && lead.width > 0 ? lead.left : Infinity) - H.left;
        if (inset > 1 && inset <= 16) add("review", "near-miss", el, `text starts ${Math.round(inset)}px inside the column edge`);
      }
    }
  }
  if (edgesOnly) return { findings, stats };

  for (const el of body) {
    if (el.closest("svg, [aria-hidden='true']")) continue;
    const s = css(el);
    // Squeezed text: a run of text wrapping every few characters.
    const text = ownText(el);
    if (text.length >= 12 && [...el.children].every((c) => css(c).display.startsWith("inline"))) {
      // Count the line boxes the text actually sets, not the box height, which includes padding.
      const range = document.createRange();
      range.selectNodeContents(el);
      const lines = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top / 4))).size;
      const full = (el.textContent || "").trim().length;
      if (lines >= 3 && full / lines < 4) add("fail", "squeezed-text", el, `${lines} lines of about ${Math.round(full / lines)} characters`);
    }
    // Clipped text: a clipping box whose own text runs past its edges.
    const clipsX = s.overflowX !== "visible" && !/auto|scroll/.test(s.overflowX);
    const clipsY = s.overflowY !== "visible" && !/auto|scroll/.test(s.overflowY);
    const spills = (clipsX && el.scrollWidth > el.clientWidth + 1) || (clipsY && el.scrollHeight > el.clientHeight + 1);
    if (spills && s.textOverflow !== "ellipsis" && (s.webkitLineClamp === "none" || !s.webkitLineClamp)) {
      const b = el.getBoundingClientRect();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest("[aria-hidden='true']")) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        const cut = [...range.getClientRects()].some(
          (t) => t.width > 0 && ((clipsX && (t.right > b.right + 1 || t.left < b.left - 1)) || (clipsY && (t.bottom > b.bottom + 1 || t.top < b.top - 1)))
        );
        if (cut) {
          add("review", "clipped-text", el, `cuts "${n.textContent.trim().slice(0, 30)}"`);
          break;
        }
      }
    }
    // Orphan rows: a grid of cards whose last row holds one item, not a
    // spanning one. Row layouts whose cells wrap under each other are skipped.
    if (/grid/.test(s.display) && !el.matches("li, tr, button, a, [class*='row']")) {
      const items = [...el.children].filter((c) => shown(c) && !/absolute|fixed/.test(css(c).position));
      if (items.length >= 3) {
        const rows = new Map();
        for (const item of items) {
          const top = Math.round(item.getBoundingClientRect().top / 4);
          rows.set(top, (rows.get(top) || 0) + 1);
        }
        const counts = [...rows.values()];
        const last = items[items.length - 1].getBoundingClientRect();
        // A trailing paragraph is a caption, and a grid under 240px is a label, not a row of cards.
        const caption = items[items.length - 1].tagName === "P";
        if (!caption && contentBox(el).width >= 240 && counts.length >= 2 && counts[counts.length - 1] === 1 && counts[0] >= 2 && last.width < contentBox(el).width * 0.9) {
          add("review", "orphan-row", el, counts.join("+"));
        }
      }
    }
    // Offsets sized for a sticky header the site no longer has.
    if (s.position === "sticky" && px(s.top) > 0) add("review", "sticky-offset", el, `sticky top ${s.top}`);
    if (px(s.scrollMarginTop) > 0 && findings.filter((f) => f.kind === "scroll-margin").length < 3) {
      add("review", "scroll-margin", el, `scroll-margin-top ${s.scrollMarginTop}`);
    }
    // space-y gaps a Catalog 97 class zeroes on the child.
    const tokens = [...el.classList].filter((c) => /(^|:)space-y-(?!0$|reverse)/.test(c));
    if (tokens.length) {
      const kids = [...el.children].filter((c) => shown(c) && !/absolute|fixed/.test(css(c).position));
      const active = tokens.some((t) => !t.includes(":")) || kids.slice(0, -1).some((c) => px(css(c).marginBottom) > 0);
      if (active) {
        // Flag only a real collision, since the next child's own top margin can still hold the gap.
        kids.slice(0, -1).forEach((kid, i) => {
          const gap = kids[i + 1].getBoundingClientRect().top - kid.getBoundingClientRect().bottom;
          if (px(css(kid).marginBottom) === 0 && gap < 4) add("review", "space-y-dropped", kid, `${tokens.join(" ")} on the parent never reaches it`);
        });
      }
    }
    // Phone touch targets, minus links inside a sentence and the skip link.
    if (phone && el.matches("a[href], button, input:not([type='hidden']), select, textarea, summary, [role='button'], [role='tab']")) {
      const r = el.getBoundingClientRect();
      const inSentence =
        el.tagName === "A" && s.display === "inline" && (el.parentElement?.textContent || "").trim().length > (el.textContent || "").trim().length + 10;
      if (!inSentence && (r.width < 44 || r.height < 44)) add("report", "touch-target", el, `${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }

  if (fold) {
    const action = document.querySelector("main .c97-btn");
    const r = action?.getBoundingClientRect();
    if (r && r.bottom > vh) add("fail", "fold", action, `primary action ends at ${Math.round(r.bottom)} in a ${vh}px viewport`);
  }
  return { findings, stats };
}

async function measure(page, options) {
  // The App Router rewrites history once after hydration; if that lands
  // mid-measure the context resets, so settle and measure once more.
  try {
    return await page.evaluate(measureLayout, options);
  } catch (error) {
    if (!/Execution context was destroyed/.test(String(error))) throw error;
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
    return page.evaluate(measureLayout, options);
  }
}

async function open(page, url) {
  let status = 0;
  try {
    status = (await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }))?.status() ?? 0;
  } catch (error) {
    if (!/Timeout/.test(String(error))) throw error;
    status = -1;
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return status;
}

async function pool(items, workers, task) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(workers, items.length) }, async () => {
      while (next < items.length) await task(items[next++]);
    })
  );
}

const slug = (route) => route.replace(/^\/$/, "home").replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-");

async function shoot(page, route, size, found, outDir) {
  const shots = [];
  const base = `${slug(route)}_${size}`;
  const first = path.join("shots", `${base}.png`);
  await page.screenshot({ path: path.join(outDir, first), scale: "css" });
  shots.push(first);
  if (DESIGNED.has(route)) {
    const full = path.join("shots", `${base}_full.png`);
    await page.screenshot({ path: path.join(outDir, full), fullPage: true, scale: "css" });
    shots.push(full);
  }
  for (const f of found.filter((x) => x.id && x.level !== "report").slice(0, 8)) {
    const box = await page.evaluate((id) => {
      const el = document.querySelector(`[data-sweep-id="${id}"]`);
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "nearest" });
      el.style.outline = "3px solid #ff00ff";
      el.style.outlineOffset = "2px";
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }, f.id);
    if (!box) continue;
    const vp = page.viewportSize();
    const x = Math.max(0, box.x - 64);
    const y = Math.max(0, box.y - 64);
    const clip = { x, y, width: Math.max(1, Math.min(vp.width - x, box.w + 128)), height: Math.max(1, Math.min(vp.height - y, box.h + 128)) };
    const crop = path.join("shots", `${base}_${f.kind}_${f.id}.png`);
    // An element outside the painted area (hidden sideways in a scroller) has no crop to take.
    try {
      await page.screenshot({ path: path.join(outDir, crop), clip });
      f.shot = crop;
    } catch {}
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-sweep-id="${id}"]`);
      if (el) el.style.outline = el.style.outlineOffset = "";
    }, f.id);
  }
  return shots;
}

function ranges(widths) {
  const out = [];
  for (const w of widths.sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && w - last[1] <= 16) last[1] = w;
    else out.push([w, w]);
  }
  return out.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(", ");
}

function writeReport(outDir, rows, shotsByRoute) {
  writeFileSync(path.join(outDir, "findings.json"), JSON.stringify(rows, null, 2));
  const tsv = rows.map((r) => [r.route, r.engine, r.size, r.level, r.kind, r.selector, r.detail].join("\t"));
  writeFileSync(path.join(outDir, "summary.tsv"), ["route\tengine\tsize\tlevel\tkind\tselector\tdetail", ...tsv].join("\n"));
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const routes = [...new Set([...rows.map((r) => r.route), ...shotsByRoute.keys()])].sort();
  const sections = routes.map((route) => {
    const list = rows
      .filter((r) => r.route === route && r.level !== "report")
      .map((r) => `<li class="${r.level}"><b>${esc(r.size)}</b> ${esc(r.engine)} ${esc(r.level)} ${esc(r.kind)} · ${esc(r.selector)} · ${esc(r.detail)}${r.shot ? ` <a href="${esc(r.shot)}">crop</a>` : ""}</li>`)
      .join("");
    const shots = (shotsByRoute.get(route) || []).map((s) => `<a href="${esc(s)}"><img loading="lazy" src="${esc(s)}" alt="${esc(s)}"></a>`).join("");
    return `<section><h2>${esc(route)}</h2><ul>${list || "<li>no fail or review findings</li>"}</ul><div class="shots">${shots}</div></section>`;
  });
  writeFileSync(
    path.join(outDir, "sheet.html"),
    `<!doctype html><meta charset="utf-8"><title>Layout sweep</title><style>body{font:14px system-ui;margin:24px}li.fail{color:#b00020}li.review{color:#7a5200}.shots{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}.shots img{width:220px;border:1px solid #ccc}</style>${sections.join("")}`
  );
}

async function main(baseUrl, routes, flags) {
  const outDir = flags.out || path.join(os.tmpdir(), `layout-sweep-${Date.now()}`);
  mkdirSync(path.join(outDir, "shots"), { recursive: true });
  const groups = flags.sizes ? flags.sizes.split(",") : Object.keys(SIZES);
  const origin = new URL(baseUrl).origin;
  const rows = [];
  const shotsByRoute = new Map();
  const engines = [["chromium", chromium, null]];
  if (flags.webkit) engines.push(["webkit", webkit, new Set(["390x844", "1440x900"])]);

  for (const [engine, type, only] of engines) {
    const browser = await type.launch();
    for (const group of groups) {
      for (const [width, height] of SIZES[group] || []) {
        const size = `${width}x${height}`;
        if (only && !only.has(size)) continue;
        const phone = group === "phone" || group === "landscape";
        const context = await browser.newContext({
          viewport: { width, height },
          ...(phone && engine === "chromium" ? MOBILE : {}),
          reducedMotion: "reduce",
          colorScheme: "light",
        });
        // Third-party feeds would make two runs disagree.
        await context.route("**/*", (route) => (new URL(route.request().url()).origin === origin ? route.continue() : route.abort()));
        await pool(routes, Number(flags.workers || 4), async (route) => {
          const page = await context.newPage();
          try {
            const status = await open(page, new URL(route, baseUrl).href);
            const fold = route === "/" && (group === "phone" || FOLD_SIZES.has(size));
            const { findings } = await measure(page, { phone: group === "phone", fold });
            if (status >= 500 || status === -1) findings.push({ level: status === -1 ? "review" : "fail", kind: "http", selector: "document", detail: status === -1 ? "never went network idle" : `HTTP ${status}`, rect: null });
            if (flags.shots && engine === "chromium" && SHOT_WIDTHS.has(width)) {
              const shots = await shoot(page, route, size, findings, outDir);
              shotsByRoute.set(route, [...(shotsByRoute.get(route) || []), ...shots]);
            }
            for (const f of findings) rows.push({ route, engine, size, ...f });
          } catch (error) {
            rows.push({ route, engine, size, level: "fail", kind: "error", selector: "document", detail: String(error).split("\n")[0] });
          } finally {
            await page.close();
          }
        });
        await context.close();
        console.error(`${engine} ${size} done`);
      }
    }
    await browser.close();
  }

  if (flags.scan) {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await context.route("**/*", (route) => (new URL(route.request().url()).origin === origin ? route.continue() : route.abort()));
    await pool(routes, Number(flags.workers || 4), async (route) => {
      const page = await context.newPage();
      try {
        await open(page, new URL(route, baseUrl).href);
        const seen = new Map();
        for (let width = 320; width <= 1920; width += 16) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
          const { findings } = await measure(page, { edgesOnly: true });
          for (const f of findings) {
            const key = `${f.level}|${f.kind}|${f.selector}`;
            if (!seen.has(key)) seen.set(key, { ...f, widths: [] });
            seen.get(key).widths.push(width);
          }
        }
        for (const f of seen.values()) rows.push({ route, engine: "chromium", size: "scan", ...f, detail: `${f.detail} (at ${ranges(f.widths)})`, widths: undefined });
      } catch (error) {
        rows.push({ route, engine: "chromium", size: "scan", level: "fail", kind: "error", selector: "document", detail: String(error).split("\n")[0] });
      } finally {
        await page.close();
      }
    });
    await browser.close();
  }

  writeReport(outDir, rows, shotsByRoute);
  const count = (level) => rows.filter((r) => r.level === level).length;
  const byKind = {};
  for (const r of rows.filter((x) => x.level !== "report")) byKind[`${r.level} ${r.kind}`] = (byKind[`${r.level} ${r.kind}`] || 0) + 1;
  for (const [key, n] of Object.entries(byKind).sort()) console.log(`${String(n).padStart(5)}  ${key}`);
  console.log(`${count("fail")} fail, ${count("review")} review, ${count("report")} report across ${routes.length} route(s). Report: ${outDir}`);
  process.exit(count("fail") === 0 ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const flags = Object.fromEntries(
    args.filter((a) => a.startsWith("--")).map((a) => {
      const [key, value] = a.slice(2).split("=");
      return [key, value ?? true];
    })
  );
  const [baseUrl, ...routes] = args.filter((a) => !a.startsWith("--"));
  if (!baseUrl) {
    console.error("usage: node scripts/layoutSweep.mjs <baseUrl> [route...] [--sizes=phone,laptop] [--shots] [--scan] [--webkit] [--out=dir]");
    process.exit(2);
  }
  await main(baseUrl, routes.length ? routes : defaultRoutes(), flags);
}
