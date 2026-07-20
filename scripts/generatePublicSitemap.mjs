#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import sitemapModule from "../src/lib/sitemap.js";

const { PUBLIC_SITEMAP_ENTRIES } = sitemapModule;
const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "public", "sitemap.xml");
const temporaryPath = `${outputPath}.tmp`;
const siteUrl = (process.env.SITE_URL || "https://isaacavazquez.com").replace(
  /\/$/,
  ""
);

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function readExistingOrder(source) {
  const paths = [];
  for (const match of source.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const value = match[1].replaceAll("&amp;", "&");
      paths.push(new URL(value).pathname || "/");
    } catch {
      // Ignore malformed legacy entries. The canonical inventory rebuilds them.
    }
  }
  return paths;
}

async function getOrderedEntries() {
  let existingOrder = [];
  try {
    existingOrder = readExistingOrder(await fs.readFile(outputPath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const entriesByPath = new Map(
    PUBLIC_SITEMAP_ENTRIES.map((entry) => [entry.loc, entry])
  );
  const ordered = [];

  for (const routePath of existingOrder) {
    const entry = entriesByPath.get(routePath);
    if (!entry) continue;
    ordered.push(entry);
    entriesByPath.delete(routePath);
  }

  ordered.push(
    ...Array.from(entriesByPath.values()).sort((a, b) =>
      a.loc.localeCompare(b.loc)
    )
  );
  return ordered;
}

function renderEntry(entry) {
  const pathname = entry.loc === "/" ? "" : entry.loc;
  return [
    "<url>",
    `<loc>${escapeXml(`${siteUrl}${pathname}`)}</loc>`,
    `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
    `<changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
    `<priority>${escapeXml(entry.priority)}</priority>`,
    "</url>",
  ].join("");
}

const entries = await getOrderedEntries();
const output = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
  ...entries.map(renderEntry),
  "</urlset>",
].join("\n");

await fs.writeFile(temporaryPath, output, "utf8");
await fs.rename(temporaryPath, outputPath);
console.log(`Generated public/sitemap.xml with ${entries.length} routes.`);
