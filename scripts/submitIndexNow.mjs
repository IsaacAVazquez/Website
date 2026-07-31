#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const siteUrl = "https://isaacvazquez.com";
const siteHost = new URL(siteUrl).hostname;
const key = "9f7d1a8c2fca455871c1520aaeb5753c";
const keyLocation = `${siteUrl}/${key}.txt`;
const endpoint =
  process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
const dryRun = process.argv.includes("--dry-run");

const sitemap = await fs.readFile(sitemapPath, "utf8");
const urlList = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) =>
  match[1].replaceAll("&amp;", "&"),
);

if (urlList.length === 0 || urlList.length > 10_000) {
  throw new Error(`IndexNow URL count is outside the allowed range: ${urlList.length}`);
}

for (const value of urlList) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== siteHost) {
    throw new Error(`IndexNow rejected a noncanonical URL: ${value}`);
  }
}

const payload = {
  host: siteHost,
  key,
  keyLocation,
  urlList,
};

if (dryRun) {
  console.log(`IndexNow payload is valid for ${urlList.length} canonical URLs.`);
  process.exit(0);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

if (![200, 202].includes(response.status)) {
  const detail = (await response.text()).trim();
  throw new Error(
    `IndexNow submission failed with HTTP ${response.status}${
      detail ? `: ${detail}` : ""
    }`,
  );
}

console.log(
  `IndexNow accepted ${urlList.length} canonical URLs with HTTP ${response.status}.`,
);
