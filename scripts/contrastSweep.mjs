#!/usr/bin/env node
// Text contrast sweep over live pages, in light and dark.
//   node scripts/contrastSweep.mjs http://localhost:3000 /earthquake-pulse /news-pulse
// For every visible element with its own text, it measures the text colour
// against the effective background (walking up until an opaque one) and
// reports anything under 4.5:1, or under 3:1 for large text. Colours are
// normalised by painting them onto a 1x1 canvas in the page, so color(srgb),
// oklab(), and color-mix() serialisations read correctly. Background images
// such as grain and halftone screens are ignored. Exits 1 on any failure.
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

/** Runs inside the page. Exported so it can be calibrated against a known page. */
export function measurePage() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const toRgba = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, bottom) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  };
  const luminance = ([r, g, b]) => {
    const [R, G, B] = [r, g, b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const ratio = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const background = (el) => {
    const layers = [];
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const bg = toRgba(getComputedStyle(node).backgroundColor);
      if (bg[3] > 0) layers.push(bg);
      if (bg[3] >= 1) break;
    }
    let base = [255, 255, 255, 1];
    if (layers.length && layers[layers.length - 1][3] >= 1) base = layers.pop();
    return layers.reverse().reduce((acc, layer) => over(layer, acc), base);
  };

  const failures = [];
  for (const el of document.body.querySelectorAll("*")) {
    const ownText = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!ownText || el.closest('[aria-hidden="true"], script, style, noscript, svg title')) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || Number(style.opacity) === 0 || el.getClientRects().length === 0) continue;
    const bg = background(el);
    const fg = over(toRgba(style.color), bg);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
    const needed = large ? 3 : 4.5;
    const measured = ratio(fg, bg);
    if (measured < needed) {
      const cls = [...el.classList].slice(0, 2).join(".");
      failures.push({
        selector: `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}`,
        text: ownText.slice(0, 48),
        ratio: Math.round(measured * 100) / 100,
        needed,
      });
    }
  }
  return failures;
}

async function main(baseUrl, routes) {
  const browser = await chromium.launch();
  let total = 0;
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
    await context.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
    }, theme);
    for (const route of routes) {
      const page = await context.newPage();
      await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(800);
      const seen = new Set();
      for (const f of await page.evaluate(measurePage)) {
        const key = `${f.selector}|${f.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        total += 1;
        console.log(`${route}\t${theme}\t${f.ratio}:1 (needs ${f.needed})\t${f.selector}\t${f.text}`);
      }
      await page.close();
    }
    await context.close();
  }
  await browser.close();
  console.log(total === 0 ? "No contrast failures." : `${total} contrast failure(s).`);
  process.exit(total === 0 ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [baseUrl, ...routes] = process.argv.slice(2);
  if (!baseUrl || routes.length === 0) {
    console.error("usage: node scripts/contrastSweep.mjs <baseUrl> <route...>");
    process.exit(2);
  }
  await main(baseUrl, routes);
}
