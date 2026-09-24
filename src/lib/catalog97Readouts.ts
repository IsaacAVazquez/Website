import { readFile } from "fs/promises";
import path from "path";
import { getPremierLeagueSummary } from "@/lib/premierLeagueSnapshot";
import { getLaLigaSummarySnapshot } from "@/lib/laLigaSnapshot";
import { getTransitSummary } from "@/lib/bayAreaTransitSnapshot";
import { getSpaceXSnapshot } from "@/lib/spacexSnapshot";
import { getFormula1Summary } from "@/lib/formula1Snapshot";
import type { InvestmentsIndex } from "@/types/investment";

/*
 * Readouts for the home board and the dashboards index, read from the
 * committed snapshots. Every reader fails soft to null so a missing or
 * malformed snapshot drops its tile instead of breaking the page. Every time is
 * printed in Pacific time.
 */

const PT = "America/Los_Angeles";

// Newer ICU builds print September as "Sept" in en-GB; the design uses "Sep".
const sep = (text: string) => text.replace(/\bSept\b/, "Sep");

function validDate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "22 Sep, 16:39 PT" */
export function formatPtTime(iso: string): string {
  const date = validDate(iso);
  if (!date) return "";
  const text = date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: PT,
  });
  return `${sep(text)} PT`;
}

/** "22 Sep 2026" */
export function formatPtDate(iso: string): string {
  const date = validDate(iso);
  if (!date) return "";
  return sep(
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: PT }),
  );
}

/** "22 Sep" */
export function formatPtDay(iso: string): string {
  const date = validDate(iso);
  if (!date) return "";
  return sep(date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: PT }));
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const inWords = (n: number) => NUMBER_WORDS[n] ?? String(n);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

async function safely<T>(read: () => T | Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch {
    return null;
  }
}

export interface LaunchReadout {
  cardLine: string;
  mission: string;
  vehicle: string;
  site: string;
  windowLabel: string;
  lastLabel: string | null;
  pulledAt: string;
}

export interface TableReadout {
  cardLine: string;
  matchday: number;
  top: { position: number; name: string; played: number; points: number }[];
  summary: string;
  pulledAt: string;
}

export interface FigureReadout {
  /** The index card's one-line readout. */
  cardLine: string;
  label: string;
  figure: string;
  detail: string;
  source: string;
  /** ISO time of the snapshot, for the pull log. */
  pulledAt: string;
}

export interface InvestmentsReadout extends FigureReadout {
  /** "Prices older than seven days are marked delayed. On the 14 Sep run…" */
  staleNote: string;
}

export interface SnapshotReadouts {
  launch: LaunchReadout | null;
  premierLeague: TableReadout | null;
  laLiga: FigureReadout | null;
  transit: FigureReadout | null;
  investments: InvestmentsReadout | null;
  /** One tabular readout line per dashboard route, for the index cards. */
  cardLines: Record<string, string>;
  /** Source name and ISO pull time, newest first. */
  pullLog: { label: string; pulledAt: string }[];
  latestPull: string | null;
}

function readLaunch(): LaunchReadout | null {
  const snapshot = getSpaceXSnapshot();
  const next = snapshot.summary?.nextLaunch;
  if (!next) return null;
  const vehicle = (next.rocketName ?? "").replace(/\s+Block\s+\d+$/i, "") || "SpaceX";
  const pad = (next.launchpadName ?? "")
    .replace(/^Space Launch Complex\s+/i, "SLC-")
    .replace(/^Launch Complex\s+/i, "LC-");
  const place = (next.launchpadLocation ?? "").split(",")[0].replace(/\s+(SFB|SFS)$/, "");
  const when = next.hasExactTime ? formatPtTime(next.dateUtc) : formatPtDay(next.dateUtc);
  const last = snapshot.pastLaunches?.[0];
  const outcome = last?.success === true ? ", successful" : last?.success === false ? ", failed" : "";
  return {
    cardLine: `Next: ${next.name}, ${vehicle}, ${next.net ? "no earlier than " : ""}${formatPtDay(next.dateUtc)}`,
    mission: next.name,
    vehicle,
    site: [place, pad].filter(Boolean).join(" "),
    windowLabel: `${next.net ? "No earlier than " : ""}${when}`,
    lastLabel: last ? `Last: ${last.name}, ${formatPtDay(last.dateUtc)}${outcome}` : null,
    pulledAt: snapshot.generatedAt ?? "",
  };
}

async function readPremierLeague(): Promise<TableReadout | null> {
  const summary = await getPremierLeagueSummary();
  const [leader] = summary.standings;
  if (!leader) return null;
  const leaderName = leader.team.shortName || leader.team.name;
  const leaderLine =
    leader.won === leader.playedGames
      ? `${leaderName} have won all ${inWords(leader.playedGames)}.`
      : `${leaderName} lead on ${leader.points} points.`;
  const scorer = summary.scorers[0];
  const top = summary.standings.slice(0, 3).map((row) => ({
    position: row.position,
    name: row.team.shortName || row.team.name,
    played: row.playedGames,
    points: row.points,
  }));
  return {
    cardLine: `Matchday ${leader.playedGames}: ${top.map((row) => `${row.name} ${row.points}`).join(", ")}`,
    matchday: leader.playedGames,
    top,
    summary: scorer
      ? `${leaderLine} ${scorer.name} leads the scorers with ${scorer.goals}.`
      : leaderLine,
    pulledAt: summary.generatedAt,
  };
}

async function readLaLiga(): Promise<FigureReadout | null> {
  const summary = await getLaLigaSummarySnapshot();
  const [leader] = summary.clubs;
  if (!leader) return null;
  const difference = `${leader.goalDifference > 0 ? "+" : ""}${leader.goalDifference}`;
  const scorer = summary.scorers[0];
  const top = summary.clubs.slice(0, 3).map((club) => `${club.shortName || club.name} ${club.points}`);
  return {
    cardLine: `Matchday ${summary.matchday}: ${top.join(", ")}`,
    label: `La Liga · Matchday ${summary.matchday}`,
    figure: `${leader.shortName || leader.name}, ${leader.points} pts`,
    detail:
      `${capitalize(inWords(leader.won))} ${leader.won === 1 ? "win" : "wins"} from ${inWords(leader.played)}, goal difference ${difference}.` +
      (scorer ? ` ${scorer.name} has ${plural(scorer.total, "goal", "goals")}.` : ""),
    source: `${summary.sourceLabel || "football-data.org"} · pulled ${formatPtTime(summary.generatedAt)}`,
    pulledAt: summary.generatedAt,
  };
}

async function readTransit(): Promise<FigureReadout | null> {
  const summary = await getTransitSummary();
  const { heroStats, system } = summary;
  if (!system || system.seed) return null;
  // BART stamps its feed as "09/23/2026 10:25:33 AM PDT"; the snapshot's own
  // generatedAt is the fallback when that does not parse.
  const feedAt = validDate(system.feedTime)?.toISOString() ?? system.generatedAt;
  return {
    cardLine: `${heroStats.trainsTracked} trains tracked · feed ${formatPtTime(feedAt)}`,
    label: `BART · Feed ${formatPtTime(feedAt)}`,
    figure: `${heroStats.trainsTracked} trains tracked`,
    detail: `${plural(heroStats.activeAdvisories, "service advisory", "service advisories")} and ${plural(heroStats.elevatorOutages, "elevator outage", "elevator outages")} across ${heroStats.stationCount} stations.`,
    source: "api.bart.gov",
    pulledAt: system.generatedAt,
  };
}

async function readInvestments(): Promise<InvestmentsReadout | null> {
  const raw = await readFile(
    path.join(process.cwd(), "public", "data", "investments", "index.json"),
    "utf8",
  );
  const index = JSON.parse(raw) as InvestmentsIndex;
  const health = index.priceHealth;
  if (!health || !Array.isArray(index.symbols)) return null;
  const missing = health.missingCount
    ? `, and ${plural(health.missingCount, "has", "have")} no price yet`
    : "";
  return {
    cardLine: `${health.recentCount} prices current, ${health.delayedCount} delayed · run ${formatPtDay(index.lastUpdated)}`,
    label: `Investments · ${index.symbols.length} symbols`,
    figure: `${health.recentCount} prices current`,
    detail: `${health.delayedCount} more are over ${inWords(health.maxAgeDays)} days old and marked delayed${missing}.`,
    source: `Last refresh ${formatPtTime(index.lastUpdated)}`,
    pulledAt: index.lastUpdated,
    staleNote: `Prices older than ${inWords(health.maxAgeDays)} days are marked delayed. On the ${formatPtDay(index.lastUpdated)} run that was ${health.delayedCount} of ${index.symbols.length} symbols.`,
  };
}

export async function getSnapshotReadouts(): Promise<SnapshotReadouts> {
  const [launch, premierLeague, laLiga, transit, investments, formula1] = await Promise.all([
    safely(readLaunch),
    safely(readPremierLeague),
    safely(readLaLiga),
    safely(readTransit),
    safely(readInvestments),
    safely(async () => (await getFormula1Summary()).generatedAt),
  ]);

  const pullLog = [
    { label: "Launches", pulledAt: launch?.pulledAt },
    { label: "La Liga", pulledAt: laLiga?.pulledAt },
    { label: "Premier League", pulledAt: premierLeague?.pulledAt },
    { label: "BART", pulledAt: transit?.pulledAt },
    { label: "Formula 1", pulledAt: formula1 ?? undefined },
    { label: "Investments", pulledAt: investments?.pulledAt },
  ]
    .filter((entry): entry is { label: string; pulledAt: string } => Boolean(validDate(entry.pulledAt)))
    .sort((a, b) => Date.parse(b.pulledAt) - Date.parse(a.pulledAt));

  const cardLines: Record<string, string> = {};
  if (launch) cardLines["/spacex-mission-control"] = launch.cardLine;
  if (premierLeague) cardLines["/premier-league"] = premierLeague.cardLine;
  if (laLiga) cardLines["/la-liga"] = laLiga.cardLine;
  if (transit) cardLines["/bay-area-transit"] = transit.cardLine;
  if (investments) cardLines["/investments"] = investments.cardLine;
  if (formula1) cardLines["/formula-1"] = `Snapshot ${formatPtTime(formula1)}`;

  return {
    cardLines,
    launch,
    premierLeague,
    laLiga,
    transit,
    investments,
    pullLog,
    latestPull: pullLog[0]?.pulledAt ?? null,
  };
}
