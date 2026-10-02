import path from "path";
import {
  buildTechStartupSnapshot,
  type TechStartupSeedEntry,
} from "../src/lib/techStartups";
import type { TechStartupSnapshot } from "../src/types/techStartup";
import { writeFileAtomic } from "./snapshotFallback";

/**
 * The Tech Startup Tracker is editorially curated rather than sourced from a live
 * funding API (Crunchbase / PitchBook are gated). This script processes the
 * hand-maintained seed below into the derived snapshot (momentum scores, sector
 * and stage segments, totals) the dashboard reads at build time.
 *
 * Figures are approximate and tagged with an as-of date. Update the seed and
 * the `AS_OF` date, then run `npm run update:tech-startups` to regenerate the
 * snapshot.
 *
 * How the 2026-09-28 review read each entry:
 * - `lastRound` and `valuation` come from the page in `lastRound.sourceUrl`,
 *   which is the company's own announcement wherever one exists.
 * - `totalRaised` is the company's own stated total where it gives one
 *   (Commonwealth Fusion, Helion, Form Energy). Everywhere else it is the
 *   earlier total plus the primary rounds confirmed since, so it is a floor.
 *   A tender offer or share sale moves no new money to the company and adds
 *   nothing to it.
 * - Euro amounts are converted at the ECB reference rate for the announcement
 *   date (1.1744 on 2025-09-09, 1.1614 on 2026-09-08).
 * - An entry with no `sourceUrl` (Perplexity, Canva) had no primary source for
 *   a newer round, so it keeps its earlier figures and its earlier round date.
 *
 * Removed in that review, since the tracker covers private companies:
 * - xAI, acquired by SpaceX (announced 2026-02-02, https://x.ai/news/xai-joins-spacex)
 * - Brex, acquired by Capital One (completed 2026-04-07,
 *   https://www.capitalone.com/about/newsroom/capital-one-completes-acquisition-of-brex/)
 * - Anysphere (Cursor), acquired by SpaceX (completed 2026-08-14,
 *   https://cursor.com/blog/joining-spacex)
 * - SpaceX, listed on Nasdaq as SPCX after an offering launched 2026-06-04
 *   (https://ir.spacex.com/)
 */

// The date the seed was last read against its sources. Bump it only when every
// entry has been read again.
const AS_OF = "2026-09-28";

const SOURCE_LABEL = "Curated from company announcements";
const SOURCE_URL = "https://news.crunchbase.com";
const DISCLAIMER =
  "Valuations and round details come from each company's own announcement where one exists, and each entry links to the page it was read from. Total raised is a floor, since it adds the rounds I could confirm to an earlier total and a round I did not find is missing from it. These are editorial figures for illustration and research, not verified financials or investment advice.";

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
    totalRaised: 186_000_000_000,
    valuation: 852_000_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Late-stage round",
      amount: 122_000_000_000,
      date: "2026-03",
      leadInvestors: ["SoftBank", "Andreessen Horowitz", "D. E. Shaw Ventures", "MGX", "TPG", "T. Rowe Price"],
      sourceUrl: "https://openai.com/index/accelerating-the-next-phase-ai/",
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
    // 27B before, plus Series F 13B (2025-09-02), Series G 30B (2026-02-12),
    // and Series H 65B, each from anthropic.com/news.
    totalRaised: 135_000_000_000,
    valuation: 965_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series H",
      amount: 65_000_000_000,
      date: "2026-05",
      leadInvestors: ["Altimeter Capital", "Dragoneer", "Greenoaks", "Sequoia Capital"],
      sourceUrl: "https://www.anthropic.com/news/series-h",
    },
    notableInvestors: ["Google", "Amazon", "Lightspeed", "Spark Capital"],
    tags: ["foundation models", "Claude", "AI safety"],
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
    // 1.1B before, plus Series C EUR 1.7B (2025-09-09) and Series D EUR 3B.
    totalRaised: 6_580_000_000,
    // More than EUR 21B post-money.
    valuation: 24_389_000_000,
    employees: "51-200",
    lastRound: {
      stage: "Series D",
      amount: 3_484_000_000,
      date: "2026-09",
      leadInvestors: ["Samsung Electronics", "Scaleup Europe Fund", "PSG Equity"],
      sourceUrl: "https://mistral.ai/news/mistral-makes-sovereign-open-weight-ai-to-frontier/",
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
    // Scale passed the proceeds of Meta's investment to its shareholders, so
    // the total is unchanged. The release gives no amount.
    totalRaised: 1_600_000_000,
    // "Over $29 billion."
    valuation: 29_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Strategic investment",
      amount: null,
      date: "2025-06",
      leadInvestors: ["Meta"],
      sourceUrl: "https://scale.com/blog/scale-ai-announces-next-phase-of-company-evolution",
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
    totalRaised: 1_470_000_000,
    valuation: 6_800_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Growth round",
      amount: 500_000_000,
      date: "2025-08",
      leadInvestors: ["Radical Ventures", "Inovia Capital"],
      sourceUrl: "https://cohere.com/blog/august-2025-funding-round",
    },
    notableInvestors: ["Inovia Capital", "Nvidia", "Oracle"],
    tags: ["enterprise LLMs", "RAG"],
  },
  {
    id: "hugging-face",
    name: "Hugging Face",
    description:
      "Open-source machine-learning hub hosting models, datasets, and tooling used across the AI community. NVIDIA announced an agreement to acquire it on September 3, 2026.",
    sector: { key: "sector-ai", label: "AI & ML" },
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "New York, NY",
    country: "United States",
    founded: 2016,
    website: "https://huggingface.co",
    totalRaised: 395_000_000,
    // The agreed purchase price, which is the newest price anyone has put on the company.
    valuation: 12_930_300_000,
    employees: "201-500",
    lastRound: {
      stage: "Acquisition agreement",
      amount: 12_930_300_000,
      date: "2026-09",
      leadInvestors: ["NVIDIA"],
      sourceUrl: "https://blogs.nvidia.com/blog/nvidia-to-acquire-hugging-face/",
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
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2023,
    website: "https://sierra.ai",
    totalRaised: 1_235_000_000,
    // "Over $15 billion."
    valuation: 15_000_000_000,
    employees: "51-200",
    lastRound: {
      stage: "Growth round",
      amount: 950_000_000,
      date: "2026-05",
      leadInvestors: ["Tiger Global", "GV"],
      sourceUrl: "https://sierra.ai/blog/better-customer-experiences-built-on-sierra",
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
    stage: { key: "stage-growth", label: "Growth (C–E)" },
    headquarters: "Pittsburgh, PA",
    country: "United States",
    founded: 2023,
    website: "https://www.skild.ai",
    totalRaised: 1_700_000_000,
    // "Over $14 billion."
    valuation: 14_000_000_000,
    employees: "11-50",
    lastRound: {
      stage: "Series C",
      amount: 1_400_000_000,
      date: "2026-01",
      leadInvestors: ["SoftBank"],
      sourceUrl: "https://www.skild.ai/blogs/series-c",
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
    valuation: 159_000_000_000,
    employees: "5,001-10,000",
    lastRound: {
      stage: "Tender offer",
      amount: null,
      date: "2026-02",
      leadInvestors: ["Thrive Capital", "Coatue", "Andreessen Horowitz"],
      sourceUrl: "https://stripe.com/newsroom/news/stripe-2025-update",
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
    valuation: 75_000_000_000,
    employees: "5,001-10,000",
    lastRound: {
      stage: "Secondary share sale",
      amount: null,
      date: "2025-11",
      leadInvestors: ["Coatue", "Greenoaks", "Dragoneer", "Fidelity"],
      sourceUrl:
        "https://www.revolut.com/news/revolut_completes_fundraising_process_establishing_75_billion_valuation/",
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
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "New York, NY",
    country: "United States",
    founded: 2019,
    website: "https://ramp.com",
    totalRaised: 2_750_000_000,
    valuation: 44_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Series F",
      amount: 750_000_000,
      date: "2026-06",
      leadInvestors: ["ICONIQ", "GIC", "Ontario Teachers' Pension Plan"],
      sourceUrl:
        "https://www.prnewswire.com/news-releases/ramp-raises-series-f-at-44-billion-valuation-302791103.html",
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
    // Plaid's press page carries the headline and the date, and neither the
    // round size nor a lead investor, so the total is unchanged.
    totalRaised: 734_000_000,
    valuation: 8_000_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Funding round",
      amount: null,
      date: "2026-02",
      leadInvestors: [],
      sourceUrl: "https://plaid.com/press/",
    },
    notableInvestors: ["NEA", "Andreessen Horowitz", "Index Ventures"],
    tags: ["open banking", "data connectivity"],
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
    // The release announces a signed term sheet and gives no round size, so
    // the total is unchanged.
    totalRaised: 14_000_000_000,
    valuation: 188_000_000_000,
    employees: "5,001-10,000",
    lastRound: {
      stage: "Strategic round",
      amount: null,
      date: "2026-07",
      leadInvestors: ["Coatue"],
      sourceUrl:
        "https://www.databricks.com/company/newsroom/press-releases/databricks-raising-strategic-round-funding-188-billion-valuation",
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
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "San Francisco, CA",
    country: "United States",
    founded: 2015,
    website: "https://vercel.com",
    totalRaised: 863_000_000,
    valuation: 9_300_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Series F",
      amount: 300_000_000,
      date: "2025-09",
      leadInvestors: ["Accel", "GIC"],
      sourceUrl: "https://vercel.com/blog/series-f",
    },
    notableInvestors: ["Accel", "GV", "Bedrock"],
    tags: ["frontend cloud", "Next.js"],
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
      // The announcement lists the investors and names none of them as the lead.
      leadInvestors: [],
      sourceUrl: "https://www.rippling.com/blog/series-g-fundraising-tender-offer",
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
    valuation: 11_000_000_000,
    employees: "501-1,000",
    lastRound: {
      stage: "Tender offer",
      amount: 270_000_000,
      date: "2026-01",
      leadInvestors: ["GIC", "Sequoia", "Index Ventures"],
      sourceUrl: "https://www.notion.com/blog/gic-sequoia-index-purchase-notion-shares",
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
    totalRaised: 980_000_000,
    valuation: 17_300_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Series E",
      amount: 300_000_000,
      date: "2025-10",
      leadInvestors: ["Ribbit Capital", "Andreessen Horowitz", "Coatue"],
      sourceUrl: "https://www.deel.com/blog/new-investment-valuation/",
    },
    notableInvestors: ["Andreessen Horowitz", "Coatue", "Spark Capital"],
    tags: ["global payroll", "employer of record"],
  },

  // ---- Defense & Space -------------------------------------------------------
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
    totalRaised: 8_700_000_000,
    valuation: 61_000_000_000,
    employees: "1,001-5,000",
    lastRound: {
      stage: "Series H",
      amount: 5_000_000_000,
      date: "2026-05",
      leadInvestors: ["Thrive Capital", "Andreessen Horowitz"],
      sourceUrl: "https://www.anduril.com/news/anduril-announces-usd5b-series-h-raise",
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
    totalRaised: 2_670_000_000,
    valuation: 18_000_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Series E",
      amount: 1_800_000_000,
      date: "2026-07",
      // The announcement lists the investors and names none of them as the lead.
      leadInvestors: [],
      sourceUrl: "https://helsing.ai/newsroom/helsing-raises-1-8bn-in-series-e",
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
    // The company's own stated total.
    totalRaised: 4_000_000_000,
    valuation: null,
    employees: "501-1,000",
    lastRound: {
      stage: "Equity financing",
      amount: 1_000_000_000,
      date: "2026-07",
      // The announcement describes the investors by type and names no lead.
      leadInvestors: [],
      sourceUrl:
        "https://cfs.energy/news-and-media/commonwealth-fusion-systems-raises-another-1-billion-bringing-total-capital-raised-to-4-billion/",
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
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "Everett, WA",
    country: "United States",
    founded: 2013,
    website: "https://www.helionenergy.com",
    // The company's own stated total, given at the round's first close.
    totalRaised: 1_500_000_000,
    valuation: 15_500_000_000,
    employees: "201-500",
    lastRound: {
      stage: "Series G",
      // Announced at 465M on 2026-06-04 and closed at 500M in September 2026.
      amount: 500_000_000,
      date: "2026-06",
      leadInvestors: ["Thrive Capital"],
      sourceUrl:
        "https://www.helionenergy.com/newsroom/helion-raises-465-million-series-g-funding-round-to-meet-surging-global-demand-for-power",
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
    stage: { key: "stage-late", label: "Late stage" },
    headquarters: "Somerville, MA",
    country: "United States",
    founded: 2017,
    website: "https://formenergy.com",
    // The company's own stated total, "over $2 billion".
    totalRaised: 2_000_000_000,
    valuation: null,
    employees: "501-1,000",
    lastRound: {
      stage: "Series G",
      amount: 750_000_000,
      date: "2026-08",
      leadInvestors: ["T. Rowe Price"],
      sourceUrl: "https://formenergy.com/form-energy-secures-750m-in-series-g-financing/",
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
    "src/data/techStartupSnapshot.json"
  );
  const fileContents = JSON.stringify(snapshot, null, 2) + "\n";

  writeFileAtomic(snapshotPath, fileContents);

  console.log(
    `Wrote ${snapshot.totals.startups} startups across ${snapshot.totals.sectors} sectors to ${snapshotPath}`
  );
}

main().catch((error) => {
  console.error("Failed to build tech startup snapshot:", error);
  process.exit(1);
});
