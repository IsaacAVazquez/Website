import { HOMEPAGE_FEATURED_SLUGS } from "@/constants/caseStudies";

/**
 * Projects that have a finished riso plate, generated for the site on
 * 2026-09-23. Home's selected work and the lead entries on /portfolio both
 * print from this list, so a new plate only needs adding here. Every featured
 * Home slug must have one, or `next/image` throws on the home page.
 */
const PLATES = {
  "before-you-buy": "/images/home/retro-before-you-buy.jpg",
  "investment-analytics-platform": "/images/home/retro-markets.jpg",
  "news-pulse-dashboard": "/images/home/retro-press.jpg",
  "interchange-iq": "/images/home/retro-card.jpg",
} satisfies Record<string, string> & Record<(typeof HOMEPAGE_FEATURED_SLUGS)[number], string>;

export const PROJECT_PLATES: Record<string, string> = PLATES;
