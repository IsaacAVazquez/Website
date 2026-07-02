import { StructuredData } from "@/components/StructuredData";
import { AIStructuredData } from "@/components/AIStructuredData";
import {
  HomeInstrument,
  type QuakePulse,
} from "@/components/home/HomeInstrument";
import {
  getHomepageFeaturedCaseStudies,
  getPortfolioProjects,
} from "@/constants/caseStudies";
import { getAllBlogPostPreviews } from "@/lib/blog";
import { getLiveToolGroups } from "@/constants/toolCategories";
import { getEarthquakeSummary } from "@/lib/earthquakeSnapshot";
import { profile, profileSameAs } from "@/lib/profile";

export { metadata } from "./metadata";

const HOUR_MS = 3_600_000;

/**
 * Bucket the earthquake snapshot's rolling 24h feed into hourly counts for
 * the hero's live-pulse sparkline. Fail-soft: an empty or malformed snapshot
 * yields an empty series and the hero simply hides the sparkline.
 */
async function buildQuakePulse(): Promise<QuakePulse> {
  try {
    const summary = await getEarthquakeSummary();
    const endTs = Date.parse(summary.generatedAt);
    const buckets = new Array<number>(24).fill(0);

    if (!Number.isNaN(endTs)) {
      for (const quake of summary.recent) {
        const age = endTs - Date.parse(quake.time);
        if (Number.isNaN(age) || age < 0 || age >= 24 * HOUR_MS) continue;
        buckets[23 - Math.floor(age / HOUR_MS)] += 1;
      }
    }

    // The caption count must describe the same events the line draws. The
    // snapshot's `recent` list is capped, so it can hold fewer events than
    // heroStats.total24h — quoting that larger number next to a line built
    // from the capped feed would misrepresent the chart.
    const windowTotal = buckets.reduce((sum, count) => sum + count, 0);
    return {
      series: windowTotal > 0 ? buckets : [],
      total24h: windowTotal,
      asOf: Number.isNaN(endTs) ? null : summary.generatedAt,
    };
  } catch {
    return { series: [], total24h: 0, asOf: null };
  }
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
  const quakePulse = await buildQuakePulse();

  return (
    <>
      <HomeInstrument
        featuredProjects={featuredProjects}
        recentPosts={allPosts}
        heroIndex={heroIndex}
        liveToolGroups={liveToolGroups}
        quakePulse={quakePulse}
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
