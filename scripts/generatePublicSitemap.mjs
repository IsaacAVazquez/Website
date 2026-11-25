#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import sitemapModule from "../src/lib/sitemap.js";

const { PUBLIC_SITEMAP_ENTRIES } = sitemapModule;
const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "public", "sitemap.xml");
const temporaryPath = `${outputPath}.tmp`;
const siteUrl = (process.env.SITE_URL || "https://isaacvazquez.com").replace(
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

const output = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...PUBLIC_SITEMAP_ENTRIES.map(renderEntry),
  "</urlset>",
].join("\n");

await fs.writeFile(temporaryPath, output, "utf8");
await fs.rename(temporaryPath, outputPath);
console.log(`Generated public/sitemap.xml with ${PUBLIC_SITEMAP_ENTRIES.length} routes.`);
