import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { NewsArticle } from "@/lib/news-pulse-utils";
import type { NewsFeedDefinition } from "./news-pulse-sources";

const DESCRIPTION_LIMIT = 300;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeMarkup(value: string): string {
  if (!value) return "";
  const normalizedValue = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  const $ = load(`<root>${normalizedValue}</root>`);
  return normalizeWhitespace($.root().text());
}

function getDirectChild(parent: Cheerio<AnyNode>, selector: string): Cheerio<AnyNode> {
  return parent.children(selector).first();
}

function getDirectChildText(parent: Cheerio<AnyNode>, selector: string): string {
  const child = getDirectChild(parent, selector);
  return decodeMarkup(child.html() ?? child.text());
}

function getDirectChildAttr(parent: Cheerio<AnyNode>, selector: string, attr: string): string {
  return normalizeWhitespace(getDirectChild(parent, selector).attr(attr) ?? "");
}

function normalizeLink(value: string): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizePubDate(value: string): string {
  const normalized = normalizeWhitespace(value);
  return normalized && !Number.isNaN(Date.parse(normalized)) ? normalized : "";
}

function normalizeCategory(value: string): string {
  return normalizeWhitespace(value) || "General";
}

function normalizeDescription(...values: string[]): string {
  const description = values.find((value) => normalizeWhitespace(value).length > 0) ?? "";
  return normalizeWhitespace(description).slice(0, DESCRIPTION_LIMIT);
}

function buildArticle(
  feed: NewsFeedDefinition,
  article: Omit<NewsArticle, "source" | "sourceName" | "sourceColor">,
): NewsArticle {
  return {
    ...article,
    source: feed.id,
    sourceName: feed.name,
    sourceColor: feed.color,
  };
}

function parseRssItem($: CheerioAPI, itemNode: AnyNode, feed: NewsFeedDefinition) {
  const item = $(itemNode);
  const title = getDirectChildText(item, "title");
  const link = normalizeLink(
    getDirectChildAttr(item, "link", "href") ||
      getDirectChildText(item, "link") ||
      getDirectChildText(item, "guid"),
  );

  if (!title || !link) return null;

  return buildArticle(feed, {
    title,
    link,
    description: normalizeDescription(
      getDirectChildText(item, "description"),
      getDirectChildText(item, "content\\:encoded"),
    ),
    pubDate: normalizePubDate(getDirectChildText(item, "pubDate")),
    category: normalizeCategory(
      getDirectChildAttr(item, "category", "term") || getDirectChildText(item, "category"),
    ),
  });
}

function parseAtomEntry($: CheerioAPI, entryNode: AnyNode, feed: NewsFeedDefinition) {
  const entry = $(entryNode);
  const title = getDirectChildText(entry, "title");
  const link = normalizeLink(
    getDirectChildAttr(entry, "link[rel='alternate']", "href") ||
      getDirectChildAttr(entry, "link[href]", "href"),
  );

  if (!title || !link) return null;

  return buildArticle(feed, {
    title,
    link,
    description: normalizeDescription(
      getDirectChildText(entry, "summary"),
      getDirectChildText(entry, "content"),
    ),
    pubDate: normalizePubDate(
      getDirectChildText(entry, "published") || getDirectChildText(entry, "updated"),
    ),
    category: normalizeCategory(
      getDirectChildAttr(entry, "category", "term") ||
        getDirectChildAttr(entry, "category", "label") ||
        getDirectChildText(entry, "category"),
    ),
  });
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

export function parseNewsFeed(xml: string, feed: NewsFeedDefinition): NewsArticle[] {
  const $ = load(xml, { xmlMode: true });
  const entries = $("entry").toArray();

  if (entries.length > 0) {
    return entries.map((entry) => parseAtomEntry($, entry, feed)).filter(isDefined);
  }

  return $("item").toArray().map((item) => parseRssItem($, item, feed)).filter(isDefined);
}
