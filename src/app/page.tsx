import { readFile } from "fs/promises";
import path from "path";
import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import { HomeInstrument } from "@/components/home/HomeInstrument";
import type {
  HomeLiveFeedData,
  HomeLiveFeedLaunch,
  HomeLiveFeedMarket,
  HomeLiveFeedQuake,
} from "@/components/home/HomeLiveFeed";
import {
  getHomepageFeaturedCaseStudies,
  getPortfolioProjects,
} from "@/constants/caseStudies";
import { getAllBlogPostPreviews } from "@/lib/blog";
import { getLiveToolGroups } from "@/constants/toolCategories";
import { getEarthquakeSummary } from "@/lib/earthquakeSnapshot";
import { getSpaceXSnapshotSummary } from "@/lib/spacexSnapshot";
import { profile, profileSameAs } from "@/lib/profile";

export { metadata } from "./metadata";

// Relative "N min ago" style label for the live-feed readouts, computed at
// render time from an ISO timestamp.
function relativeAgo(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms) || ms < 0) return "just now";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

// The hero's live feed reads three production tools. Each readout fails soft to
// null so a missing or malformed snapshot just drops that row rather than
// breaking the hero.

// Latest USGS quake plus a short recent-magnitude series for the bar spark.
async function buildQuakeReadout(): Promise<HomeLiveFeedQuake | null> {
  try {
    const summary = await getEarthquakeSummary();
    const latest = summary.recent[0];
    if (!latest) return null;
    // `recent` is newest-first; reverse the trailing window so the spark reads
    // left-to-right chronologically with the latest quake as the final bar.
    const recentMagnitudes = summary.recent
      .slice(0, 12)
      .map((quake) => quake.magnitude)
      .reverse();
    return {
      magnitude: latest.magnitude,
      depthKm: latest.depthKm,
      place: latest.place,
      agoLabel: relativeAgo(latest.time),
      recentMagnitudes,
    };
  } catch {
    return null;
  }
}

// Next SpaceX launch for the T-minus readout.
function buildLaunchReadout(): HomeLiveFeedLaunch | null {
  try {
    const next = getSpaceXSnapshotSummary()?.nextLaunch;
    if (!next) return null;
    const vehicle =
      [next.rocketName, next.launchpadName].filter(Boolean).join(" · ") || "SpaceX";
    return {
      mission: next.name,
      vehicle,
      dateUtc: next.dateUtc,
      hasExactTime: next.hasExactTime,
    };
  } catch {
    return null;
  }
}

// S&P 500 day move from the committed SPY snapshot (daily closes).
async function buildMarketReadout(): Promise<HomeLiveFeedMarket | null> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "public", "data", "investments", "SPY", "snapshot.json"),
      "utf8",
    );
    const prices = (JSON.parse(raw) as { sections?: { price?: unknown } }).sections
      ?.price;
    if (!Array.isArray(prices) || prices.length < 2) return null;
    const last = prices[prices.length - 1] as { close?: unknown };
    const prev = prices[prices.length - 2] as { close?: unknown };
    if (typeof last.close !== "number" || typeof prev.close !== "number") return null;
    const delta = last.close - prev.close;
    const changePct = prev.close !== 0 ? (delta / prev.close) * 100 : 0;
    return {
      symbol: "SPY",
      name: "S&P 500 ETF",
      price: last.close.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      changePct,
      delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`,
    };
  } catch {
    return null;
  }
}

async function buildLiveFeed(): Promise<HomeLiveFeedData> {
  const [quake, market] = await Promise.all([
    buildQuakeReadout(),
    buildMarketReadout(),
  ]);
  return {
    quake,
    launch: buildLaunchReadout(),
    market,
    sourceNote: "Committed snapshots across three production tools",
  };
}

export default async function Home() {
  const featuredProjects = getHomepageFeaturedCaseStudies();

  // The hero live index reads real counts so it stays accurate as content
  // ships. Live tools are projects with a real hosted destination set on the
  // case study.
  const allPosts = getAllBlogPostPreviews();
  const allProjects = getPortfolioProjects();
  // The "Live tools" directory groups every project that ships a real
  // destination (on-site route or hosted app) by category, so the homepage
  // surfaces the full breadth of live surfaces rather than the 3 featured cards.
  const liveToolGroups = getLiveToolGroups(allProjects);
  const liveTools = liveToolGroups.reduce(
    (total, group) => total + group.tools.length,
    0,
  );
  const heroIndex = {
    projectCount: allProjects.length,
    essayCount: allPosts.length,
    liveToolCount: liveTools,
  };
  const liveFeed = await buildLiveFeed();

  return (
    <>
      <HomeInstrument
        featuredProjects={featuredProjects}
        recentPosts={allPosts}
        heroIndex={heroIndex}
        liveToolGroups={liveToolGroups}
        liveFeed={liveFeed}
      />

      <StructuredData type="ProfilePage" />
      <StructuredData type="WebSite" />
      <AIStructuredData
        schema={{
          type: "Person",
          data: {
            name: profile.name,
            jobTitle: profile.fullTitle,
            description: profile.description,
            url: "https://isaacavazquez.com",
            image: "https://isaacavazquez.com/opengraph-image",
            email: profile.email,
            sameAs: profileSameAs,
            address: {
              addressLocality: profile.location.locality,
              addressRegion: profile.location.region,
              addressCountry: profile.location.country,
            },
            knowsAbout: profile.knowsAbout,
            expertise: [
              {
                name: "Product Management",
                proficiencyLevel: "Advanced",
                yearsExperience: 3,
                description: "Product strategy, discovery, roadmapping, and cross-functional leadership",
              },
              {
                name: "Quality Assurance",
                proficiencyLevel: "Expert",
                yearsExperience: 6,
                description: "Test automation, quality strategy, release management, and continuous improvement",
              },
            ],
            alumniOf: [
              {
                "@type": "CollegeOrUniversity",
                name: profile.education[0].name,
                description: profile.education[0].description,
              },
              {
                "@type": "CollegeOrUniversity",
                name: profile.education[1].name,
                description: profile.education[1].description,
              },
            ],
            worksFor: {
              "@type": "Organization",
              name: profile.employer.name,
              description: profile.employer.description,
              url: profile.employer.url,
            },
          },
        }}
      />
    </>
  );
}
