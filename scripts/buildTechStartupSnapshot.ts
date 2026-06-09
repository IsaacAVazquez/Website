import { promises as fs } from "fs";
import path from "path";
import {
  buildTechStartupSnapshot,
  type TechStartupSeedEntry,
} from "../src/lib/techStartups";
import type { TechStartupSnapshot } from "../src/types/techStartup";

/**
 * The Tech Startup Tracker is editorially curated rather than sourced from a live
 * funding API (Crunchbase / PitchBook are gated). This script processes the
 * hand-maintained seed below into the derived snapshot (momentum scores, sector
 * and stage segments, totals) the dashboard reads at build time.
 *
 * Figures are approximate, compiled from public reporting, and tagged with an
 * as-of date. Update the seed and the `AS_OF` date, then run
 * `npm run update:tech-startups` to regenerate the snapshot.
 */

const AS_OF = "2026-05-01";

const SOURCE_LABEL = "Curated from public reporting";
const SOURCE_URL = "https://news.crunchbase.com";
const DISCLAIMER =
  "Funding totals, valuations, and round details are approximate figures compiled from public reporting and press releases, current as of the as-of date shown. They are editorial estimates for illustration and research, not verified financials or investment advice.";

const SEED: TechStartupSeedEntry[] = [
  // ---- AI & ML ---------------------------------------------------------------
  {
    id: "openai",
    name: "OpenAI",
    description:
      "Frontier AI lab behind ChatGPT and the GPT model family, spanning consumer assistants and enterprise APIs.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2015,
    website: "https://openai.com",
    totalRaised: 64_000_000_000,
    valuation: 300_000_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Late-stage round",
      amount: 40_000_000_000,
      date: "2025-03",
      leadInvestors: ["SoftBank"],
    },
    notableInvestors: ["Microsoft", "SoftBank", "Thrive Capital"],
    tags: ["foundation models", "ChatGPT", "generative AI"],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description:
      "AI safety company building the Claude family of models for assistants, coding, and enterprise workloads.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2021,
    website: "https://www.anthropic.com",
    totalRaised: 27_000_000_000,
    valuation: 61_500_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series E",
      amount: 3_500_000_000,
      date: "2025-03",
      leadInvestors: ["Lightspeed Venture Partners"],
    },
    notableInvestors: ["Google", "Amazon", "Lightspeed", "Spark Capital"],
    tags: ["foundation models", "Claude", "AI safety"],
  },
  {
    id: "xai",
    name: "xAI",
    description:
      "Elon Musk's AI venture developing the Grok assistant and training infrastructure integrated with X.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "Palo Alto, CA",
    country: "United States",
    founded: 2023,
    website: "https://x.ai",
    totalRaised: 12_000_000_000,
    valuation: 50_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series C",
      amount: 6_000_000_000,
      date: "2024-12",
      leadInvestors: ["Valor Equity Partners"],
    },
    notableInvestors: ["Valor Equity Partners", "Sequoia Capital", "Andreessen Horowitz"],
    tags: ["foundation models", "Grok", "compute"],
  },
  {
    id: "mistral-ai",
    name: "Mistral AI",
    description:
      "European AI lab shipping open-weight and commercial models with a focus on efficiency and sovereignty.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "Paris",
    country: "France",
    founded: 2023,
    website: "https://mistral.ai",
    totalRaised: 1_100_000_000,
    valuation: 6_200_000_000,
    employees: "51-200",
    lastRound: {
      stage: "Series B",
      amount: 640_000_000,
      date: "2024-06",
      leadInvestors: ["General Catalyst"],
    },
    notableInvestors: ["General Catalyst", "Andreessen Horowitz", "Lightspeed"],
    tags: ["open-weight models", "European AI"],
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    description:
      "Conversational answer engine that pairs live web retrieval with large language models for cited responses.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2022,
    website: "https://www.perplexity.ai",
    totalRaised: 1_000_000_000,
    valuation: 9_000_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Growth round",
      amount: 500_000_000,
      date: "2024-12",
      leadInvestors: ["Institutional Venture Partners"],
    },
    notableInvestors: ["IVP", "NEA", "Nvidia", "Jeff Bezos"],
    tags: ["answer engine", "search", "RAG"],
  },
  {
    id: "scale-ai",
    name: "Scale AI",
    description:
      "Data engine for AI — labeling, evaluation, and model-readiness infrastructure for enterprises and governments.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2016,
    website: "https://scale.com",
    totalRaised: 1_600_000_000,
    valuation: 13_800_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series F",
      amount: 1_000_000_000,
      date: "2024-05",
      leadInvestors: ["Accel"],
    },
    notableInvestors: ["Accel", "Index Ventures", "Founders Fund"],
    tags: ["data labeling", "model evaluation"],
  },
  {
    id: "cohere",
    name: "Cohere",
    description:
      "Enterprise-focused LLM provider offering retrieval-augmented generation and private deployment options.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "Toronto",
    country: "Canada",
    founded: 2019,
    website: "https://cohere.com",
    totalRaised: 970_000_000,
    valuation: 5_500_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Series D",
      amount: 500_000_000,
      date: "2024-07",
      leadInvestors: ["PSP Investments"],
    },
    notableInvestors: ["Inovia Capital", "Nvidia", "Oracle"],
    tags: ["enterprise LLMs", "RAG"],
  },
  {
    id: "hugging-face",
    name: "Hugging Face",
    description:
      "Open-source machine-learning hub hosting models, datasets, and tooling used across the AI community.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "New York, NY",
    country: "United States",
    founded: 2016,
    website: "https://huggingface.co",
    totalRaised: 395_000_000,
    valuation: 4_500_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Series D",
      amount: 235_000_000,
      date: "2023-08",
      leadInvestors: ["Salesforce Ventures"],
    },
    notableInvestors: ["Sequoia", "Coatue", "Nvidia", "Google"],
    tags: ["open-source ML", "model hub"],
  },
  {
    id: "sierra",
    name: "Sierra",
    description:
      "Conversational AI agent platform for customer experience, founded by Bret Taylor and Clay Bavor.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-early", label: "Early (Seed–B)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2023,
    website: "https://sierra.ai",
    totalRaised: 285_000_000,
    valuation: 4_500_000_000,
    employees: "51-200",
    lastRound: {
      stage: "Series B",
      amount: 175_000_000,
      date: "2024-10",
      leadInvestors: ["Greenoaks"],
    },
    notableInvestors: ["Sequoia", "Benchmark", "Thrive Capital"],
    tags: ["AI agents", "customer experience"],
  },
  {
    id: "skild-ai",
    name: "Skild AI",
    description:
      "Robotics startup training a general-purpose foundation model for embodied agents across hardware.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-early", label: "Early (Seed–B)" },
    headquarters: "Pittsburgh, PA",
    country: "United States",
    founded: 2023,
    website: "https://www.skild.ai",
    totalRaised: 300_000_000,
    valuation: 1_500_000_000,
    employees: "11-50",
    lastRound: {
      stage: "Series A",
      amount: 300_000_000,
      date: "2024-07",
      leadInvestors: ["Lightspeed Venture Partners"],
    },
    notableInvestors: ["Lightspeed", "Coatue", "SoftBank"],
    tags: ["robotics", "embodied AI"],
  },

  // ---- Fintech ---------------------------------------------------------------
  {
    id: "stripe",
    name: "Stripe",
    description:
      "Payments and financial infrastructure platform powering online businesses, marketplaces, and platforms.",
    sector: { key: "sector-fintech", label: "Fintech" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2010,
    website: "https://stripe.com",
    totalRaised: 9_400_000_000,
    valuation: 70_000_000_000,
    employees: "5,001-10,000",
    lastRound: {
      stage: "Tender offer",
      amount: 694_000_000,
      date: "2025-02",
      leadInvestors: ["Sequoia Capital"],
    },
    notableInvestors: ["Sequoia", "Andreessen Horowitz", "Thrive Capital"],
    tags: ["payments", "financial infrastructure"],
  },
  {
    id: "revolut",
    name: "Revolut",
    description:
      "Global neobank offering banking, FX, investing, and crypto across consumer and business accounts.",
    sector: { key: "sector-fintech", label: "Fintech" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "London",
    country: "United Kingdom",
    founded: 2015,
    website: "https://www.revolut.com",
    totalRaised: 2_000_000_000,
    valuation: 45_000_000_000,
    employees: "5,001-10,000",
    lastRound: {
      stage: "Secondary",
      amount: 500_000_000,
      date: "2024-08",
      leadInvestors: ["Coatue"],
    },
    notableInvestors: ["SoftBank", "Tiger Global", "Index Ventures"],
    tags: ["neobank", "consumer fintech"],
  },
  {
    id: "ramp",
    name: "Ramp",
    description:
      "Corporate card and spend-management platform that automates expenses, bill pay, and procurement.",
    sector: { key: "sector-fintech", label: "Fintech" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "New York, NY",
    country: "United States",
    founded: 2019,
    website: "https://ramp.com",
    totalRaised: 2_000_000_000,
    valuation: 13_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series E",
      amount: 150_000_000,
      date: "2025-04",
      leadInvestors: ["Founders Fund"],
    },
    notableInvestors: ["Founders Fund", "Thrive Capital", "Sequoia"],
    tags: ["corporate cards", "spend management"],
  },
  {
    id: "plaid",
    name: "Plaid",
    description:
      "Open-banking data network connecting consumer financial accounts to fintech apps and services.",
    sector: { key: "sector-fintech", label: "Fintech" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2013,
    website: "https://plaid.com",
    totalRaised: 734_000_000,
    valuation: 6_100_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Series D",
      amount: 575_000_000,
      date: "2025-04",
      leadInvestors: ["Franklin Templeton"],
    },
    notableInvestors: ["NEA", "Andreessen Horowitz", "Index Ventures"],
    tags: ["open banking", "data connectivity"],
  },
  {
    id: "brex",
    name: "Brex",
    description:
      "Financial stack for startups and enterprises combining corporate cards, banking, and expense controls.",
    sector: { key: "sector-fintech", label: "Fintech" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2017,
    website: "https://www.brex.com",
    totalRaised: 1_500_000_000,
    valuation: 12_300_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Series D-2",
      amount: 300_000_000,
      date: "2022-01",
      leadInvestors: ["Greenoaks"],
    },
    notableInvestors: ["Y Combinator", "Ribbit Capital", "Greenoaks"],
    tags: ["corporate cards", "startup banking"],
  },

  // ---- Dev Tools & Infra -----------------------------------------------------
  {
    id: "databricks",
    name: "Databricks",
    description:
      "Data and AI lakehouse platform unifying analytics, ML, and governance on top of open formats.",
    sector: { key: "sector-devtools", label: "Dev Tools & Infra" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2013,
    website: "https://www.databricks.com",
    totalRaised: 14_000_000_000,
    valuation: 62_000_000_000,
    employees: "5,001-10,000",
    lastRound: {
      stage: "Series J",
      amount: 10_000_000_000,
      date: "2024-12",
      leadInvestors: ["Thrive Capital"],
    },
    notableInvestors: ["Andreessen Horowitz", "Thrive Capital", "DST Global"],
    tags: ["data lakehouse", "analytics"],
  },
  {
    id: "vercel",
    name: "Vercel",
    description:
      "Frontend cloud and deployment platform behind Next.js, focused on developer experience and edge delivery.",
    sector: { key: "sector-devtools", label: "Dev Tools & Infra" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2015,
    website: "https://vercel.com",
    totalRaised: 563_000_000,
    valuation: 3_250_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Series E",
      amount: 250_000_000,
      date: "2024-05",
      leadInvestors: ["Accel"],
    },
    notableInvestors: ["Accel", "GV", "Bedrock"],
    tags: ["frontend cloud", "Next.js"],
  },
  {
    id: "anysphere",
    name: "Anysphere (Cursor)",
    description:
      "Maker of the Cursor AI code editor, building agentic developer tooling on top of large language models.",
    sector: { key: "sector-devtools", label: "Dev Tools & Infra" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2022,
    website: "https://www.cursor.com",
    totalRaised: 1_000_000_000,
    valuation: 9_900_000_000,
    employees: "51-200",
    lastRound: {
      stage: "Series C",
      amount: 900_000_000,
      date: "2025-05",
      leadInvestors: ["Thrive Capital"],
    },
    notableInvestors: ["Thrive Capital", "Andreessen Horowitz", "Accel"],
    tags: ["AI code editor", "developer tools"],
  },

  // ---- SaaS & Productivity ---------------------------------------------------
  {
    id: "canva",
    name: "Canva",
    description:
      "Visual design platform spanning documents, presentations, and brand workflows for teams and creators.",
    sector: { key: "sector-saas", label: "SaaS & Productivity" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "Sydney",
    country: "Australia",
    founded: 2013,
    website: "https://www.canva.com",
    totalRaised: 580_000_000,
    valuation: 32_000_000_000,
    employees: "5,001-10,000",
    lastRound: {
      stage: "Tender offer",
      amount: 1_500_000_000,
      date: "2024-08",
      leadInvestors: ["ICONIQ Growth"],
    },
    notableInvestors: ["Sequoia", "Blackbird Ventures", "Bessemer"],
    tags: ["design platform", "creative SaaS"],
  },
  {
    id: "rippling",
    name: "Rippling",
    description:
      "Workforce platform unifying HR, IT, and finance — payroll, devices, and spend in one system of record.",
    sector: { key: "sector-saas", label: "SaaS & Productivity" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2016,
    website: "https://www.rippling.com",
    totalRaised: 1_700_000_000,
    valuation: 16_800_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Series G",
      amount: 450_000_000,
      date: "2025-05",
      leadInvestors: ["GIC"],
    },
    notableInvestors: ["Kleiner Perkins", "Founders Fund", "Greenoaks"],
    tags: ["HR & IT platform", "workforce management"],
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Connected workspace combining docs, wikis, and project management with embedded AI assistance.",
    sector: { key: "sector-saas", label: "SaaS & Productivity" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2013,
    website: "https://www.notion.so",
    totalRaised: 343_000_000,
    valuation: 10_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series C",
      amount: 275_000_000,
      date: "2021-10",
      leadInvestors: ["Coatue", "Sequoia"],
    },
    notableInvestors: ["Index Ventures", "Coatue", "Sequoia"],
    tags: ["workspace", "productivity"],
  },
  {
    id: "deel",
    name: "Deel",
    description:
      "Global payroll and employer-of-record platform handling hiring, compliance, and payments across borders.",
    sector: { key: "sector-saas", label: "SaaS & Productivity" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2019,
    website: "https://www.deel.com",
    totalRaised: 680_000_000,
    valuation: 12_100_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Series D extension",
      amount: 300_000_000,
      date: "2025-01",
      leadInvestors: ["Andreessen Horowitz"],
    },
    notableInvestors: ["Andreessen Horowitz", "Coatue", "Spark Capital"],
    tags: ["global payroll", "employer of record"],
  },

  // ---- Defense & Space -------------------------------------------------------
  {
    id: "spacex",
    name: "SpaceX",
    description:
      "Launch and satellite company operating Falcon and Starship vehicles and the Starlink broadband network.",
    sector: { key: "sector-defense", label: "Defense & Space" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "Hawthorne, CA",
    country: "United States",
    founded: 2002,
    website: "https://www.spacex.com",
    totalRaised: 10_000_000_000,
    valuation: 350_000_000_000,
    employees: "10,001+",
    lastRound: {
      stage: "Tender offer",
      amount: 1_250_000_000,
      date: "2024-12",
      leadInvestors: ["Existing investors"],
    },
    notableInvestors: ["Founders Fund", "Sequoia", "Andreessen Horowitz"],
    tags: ["launch", "Starlink", "space"],
  },
  {
    id: "anduril",
    name: "Anduril Industries",
    description:
      "Defense technology company building autonomous systems and the Lattice software platform.",
    sector: { key: "sector-defense", label: "Defense & Space" },
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "Costa Mesa, CA",
    country: "United States",
    founded: 2017,
    website: "https://www.anduril.com",
    totalRaised: 3_700_000_000,
    valuation: 28_000_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Series F",
      amount: 1_500_000_000,
      date: "2024-08",
      leadInvestors: ["Founders Fund"],
    },
    notableInvestors: ["Founders Fund", "Andreessen Horowitz", "8VC"],
    tags: ["defense tech", "autonomy"],
  },
  {
    id: "helsing",
    name: "Helsing",
    description:
      "European defense AI company building software for real-time battlefield awareness and autonomy.",
    sector: { key: "sector-defense", label: "Defense & Space" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "Munich",
    country: "Germany",
    founded: 2021,
    website: "https://helsing.ai",
    totalRaised: 870_000_000,
    valuation: 5_400_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Series C",
      amount: 450_000_000,
      date: "2024-07",
      leadInvestors: ["General Catalyst"],
    },
    notableInvestors: ["General Catalyst", "Accel", "Lightspeed"],
    tags: ["defense AI", "European defense"],
  },

  // ---- Climate & Energy ------------------------------------------------------
  {
    id: "commonwealth-fusion",
    name: "Commonwealth Fusion Systems",
    description:
      "MIT spinout building the SPARC tokamak to commercialize fusion energy with high-temperature superconductors.",
    sector: { key: "sector-climate", label: "Climate & Energy" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "Devens, MA",
    country: "United States",
    founded: 2018,
    website: "https://cfs.energy",
    totalRaised: 2_000_000_000,
    valuation: null,
    employees: "501-1,000",
    lastRound: {
      stage: "Series B",
      amount: 1_800_000_000,
      date: "2021-12",
      leadInvestors: ["Tiger Global"],
    },
    notableInvestors: ["Breakthrough Energy Ventures", "Bill Gates", "Google"],
    tags: ["fusion energy", "deep tech"],
  },
  {
    id: "helion-energy",
    name: "Helion Energy",
    description:
      "Fusion startup pursuing a pulsed, non-thermal approach to electricity generation with commercial timelines.",
    sector: { key: "sector-climate", label: "Climate & Energy" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "Everett, WA",
    country: "United States",
    founded: 2013,
    website: "https://www.helionenergy.com",
    totalRaised: 1_000_000_000,
    valuation: null,
    employees: "201-500",
    lastRound: {
      stage: "Series E",
      amount: 500_000_000,
      date: "2021-11",
      leadInvestors: ["Sam Altman"],
    },
    notableInvestors: ["Sam Altman", "Mithril Capital", "Capricorn"],
    tags: ["fusion energy", "power"],
  },
  {
    id: "form-energy",
    name: "Form Energy",
    description:
      "Grid-storage company developing long-duration iron-air batteries for multi-day renewable backup.",
    sector: { key: "sector-climate", label: "Climate & Energy" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "Somerville, MA",
    country: "United States",
    founded: 2017,
    website: "https://formenergy.com",
    totalRaised: 1_200_000_000,
    valuation: null,
    employees: "501-1,000",
    lastRound: {
      stage: "Series F",
      amount: 405_000_000,
      date: "2024-10",
      leadInvestors: ["T. Rowe Price"],
    },
    notableInvestors: ["Breakthrough Energy", "ArcelorMittal", "TPG Rise"],
    tags: ["iron-air batteries", "grid storage"],
  },
];

async function main(): Promise<void> {
  const snapshot: TechStartupSnapshot = buildTechStartupSnapshot({
    entries: SEED,
    generatedAt: new Date().toISOString(),
    asOf: AS_OF,
    verified: false,
    sourceLabel: SOURCE_LABEL,
    sourceUrl: SOURCE_URL,
    disclaimer: DISCLAIMER,
  });

  const snapshotPath = path.resolve(
    process.cwd(),
    "src/data/techStartupSnapshot.ts"
  );
  const fileContents = `import type { TechStartupSnapshot } from "@/types/techStartup";

// Generated by scripts/buildTechStartupSnapshot.ts. Edit the curated seed in that
// script and re-run \`npm run update:tech-startups\` rather than editing this file.
export const techStartupSnapshot: TechStartupSnapshot = ${JSON.stringify(
    snapshot,
    null,
    2
  )};
`;

  const tmpPath = `${snapshotPath}.tmp`;
  await fs.writeFile(tmpPath, fileContents, "utf8");
  await fs.rename(tmpPath, snapshotPath);

  console.log(
    `Wrote ${snapshot.totals.startups} startups across ${snapshot.totals.sectors} sectors to ${snapshotPath}`
  );
}

main().catch((error) => {
  console.error("Failed to build tech startup snapshot:", error);
  process.exit(1);
});
