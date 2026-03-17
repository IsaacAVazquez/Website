export const MARCH_MADNESS_TITLE = "March Madness 2026 Bracket Analysis";
export const MARCH_MADNESS_DESCRIPTION =
  "Interactive 2026 March Madness bracket analysis with best upset picks, Final Four predictions, KenPom rankings, S-curve seed errors, injury notes, and a custom time-zone travel penalty model.";
export const MARCH_MADNESS_UPDATED_AT = "2026-03-17";
export const MARCH_MADNESS_UPDATED_LABEL = "Updated March 17, 2026";
export const MARCH_MADNESS_THESIS =
  "The edge in this bracket is time zones plus seed errors, not just chalk.";
export const MARCH_MADNESS_ARTICLE_SLUG = "2026-march-madness-bracket-analysis";

export interface RankingEntry {
  rank: number;
  team: string;
  conf: string;
  record: string;
  avg: number;
  bpi: number;
  em: number;
  kpi: number;
  net: number;
  pom: number;
  sor: number;
  tr: number;
  wab: number;
  trap: string;
  odds: string;
  seed: number;
}

export interface SCurveEntry {
  team: string;
  seed: number;
  diff: string;
  exp: number;
  act: number;
  note: string;
}

export interface InjuryEntry {
  team: string;
  seed: number;
  player: string;
  line: string;
  note: string;
}

export interface TimeZoneImpact {
  team: string;
  home: string;
  site: string;
  direction: "east" | "west";
  zones: number;
  pct: number;
  final: boolean;
  note: string;
}

export interface RoundOneMatchup {
  s1: number;
  t1: string;
  s2: number;
  t2: string;
  w: number;
  tags: string[];
}

export interface LaterRoundMatchup {
  t1: string;
  t2: string;
  w: number;
  tags: string[];
}

export interface RegionData {
  region: string;
  site: string;
  winner: string;
  r1: RoundOneMatchup[];
  r2: LaterRoundMatchup[];
  s16: LaterRoundMatchup[];
  e8: { t1: string; t2: string; w: number; note: string };
}

export interface PickEntry {
  group: "tz" | "analytics" | "confirm";
  badge: "FLIP" | "UPGRADE" | "DOWNGRADE" | "CONFIRM" | "LOCKED" | "WATCH";
  round: string;
  region: string;
  pick: string;
  reason: string;
  body: string;
}

export interface EditorialCard {
  eyebrow: string;
  title: string;
  reason: string;
  note: string;
  href: string;
  cta: string;
  color: "rose" | "amber" | "blue";
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export const RANKINGS: RankingEntry[] = [
  { rank: 1, team: "Duke", conf: "ACC", record: "32-2", avg: 1.3, bpi: 1, em: 1, kpi: 1, net: 1, pom: 1, sor: 3, tr: 1, wab: 2, trap: "Trapezoid", odds: "+300", seed: 1 },
  { rank: 2, team: "Michigan", conf: "B10", record: "31-3", avg: 2.0, bpi: 2, em: 2, kpi: 3, net: 2, pom: 3, sor: 2, tr: 2, wab: 1, trap: "Trapezoid", odds: "+360", seed: 1 },
  { rank: 3, team: "Arizona", conf: "B12", record: "32-2", avg: 2.7, bpi: 3, em: 3, kpi: 2, net: 3, pom: 2, sor: 1, tr: 3, wab: 3, trap: "Trapezoid", odds: "+390", seed: 1 },
  { rank: 4, team: "Florida", conf: "SEC", record: "26-7", avg: 4.6, bpi: 5, em: 4, kpi: 4, net: 4, pom: 4, sor: 5, tr: 4, wab: 7, trap: "Fringe (fast)", odds: "+750", seed: 1 },
  { rank: 5, team: "Houston", conf: "B12", record: "28-6", avg: 5.0, bpi: 4, em: 5, kpi: 5, net: 5, pom: 5, sor: 6, tr: 5, wab: 5, trap: "Slowest", odds: "+1000", seed: 2 },
  { rank: 6, team: "Purdue", conf: "B10", record: "27-8", avg: 6.9, bpi: 9, em: 6, kpi: 6, net: 9, pom: 8, sor: 7, tr: 8, wab: 4, trap: "—", odds: "+2500", seed: 2 },
  { rank: 7, team: "UConn", conf: "BE", record: "29-5", avg: 8.3, bpi: 10, em: 9, kpi: 7, net: 10, pom: 11, sor: 4, tr: 9, wab: 6, trap: "Fringe (slow)", odds: "+2500", seed: 2 },
  { rank: 8, team: "Iowa St.", conf: "B12", record: "27-7", avg: 8.7, bpi: 6, em: 7, kpi: 14, net: 6, pom: 6, sor: 14, tr: 7, wab: 12, trap: "Trapezoid", odds: "+1500", seed: 2 },
  { rank: 9, team: "Virginia", conf: "ACC", record: "29-5", avg: 11.0, bpi: 20, em: 13, kpi: 8, net: 12, pom: 13, sor: 9, tr: 14, wab: 8, trap: "Fringe (slow)", odds: "+7500", seed: 3 },
  { rank: 10, team: "Gonzaga", conf: "WCC", record: "30-3", avg: 11.4, bpi: 8, em: 10, kpi: 18, net: 7, pom: 10, sor: 11, tr: 11, wab: 13, trap: "Trapezoid", odds: "+4000", seed: 3 },
  { rank: 11, team: "Illinois", conf: "B10", record: "24-8", avg: 11.6, bpi: 7, em: 8, kpi: 19, net: 8, pom: 7, sor: 17, tr: 6, wab: 16, trap: "Fringe (slow)", odds: "+1900", seed: 3 },
  { rank: 12, team: "Michigan St.", conf: "B10", record: "25-7", avg: 12.1, bpi: 13, em: 12, kpi: 13, net: 11, pom: 9, sor: 13, tr: 13, wab: 11, trap: "Fringe (net)", odds: "+4000", seed: 3 },
  { rank: 13, team: "Vanderbilt", conf: "SEC", record: "26-8", avg: 12.1, bpi: 14, em: 14, kpi: 9, net: 13, pom: 12, sor: 12, tr: 10, wab: 14, trap: "—", odds: "+7500", seed: 5 },
  { rank: 14, team: "Arkansas", conf: "SEC", record: "26-8", avg: 14.1, bpi: 17, em: 15, kpi: 17, net: 15, pom: 15, sor: 8, tr: 19, wab: 9, trap: "—", odds: "+6000", seed: 4 },
  { rank: 15, team: "St. John's", conf: "BE", record: "28-6", avg: 14.7, bpi: 16, em: 11, kpi: 10, net: 16, pom: 17, sor: 16, tr: 15, wab: 15, trap: "—", odds: "+6000", seed: 5 },
];

export const SCURVE: { under: SCurveEntry[]; over: SCurveEntry[] } = {
  under: [
    { team: "Vanderbilt", seed: 5, diff: "+5", exp: 12, act: 17, note: "Most underseeded team in the field" },
    { team: "VCU", seed: 11, diff: "+5", exp: 40, act: 45, note: "Strong metrics for an 11-seed" },
    { team: "UMBC", seed: 16, diff: "+6", exp: 60, act: 66, note: "First Four" },
    { team: "St. John's", seed: 5, diff: "+3", exp: 15, act: 18, note: "Should be a 4-seed" },
    { team: "Utah St.", seed: 9, diff: "+4", exp: 29, act: 33, note: "Better than a 9" },
    { team: "Iowa", seed: 9, diff: "+3", exp: 33, act: 36, note: "" },
    { team: "Virginia", seed: 3, diff: "+3", exp: 9, act: 12, note: "Should be a 2-seed" },
  ],
  over: [
    { team: "UCF", seed: 10, diff: "−6", exp: 44, act: 38, note: "Big gift from committee" },
    { team: "Kansas", seed: 4, diff: "−5", exp: 20, act: 15, note: "Overseeded by nearly a full seed line" },
    { team: "TCU", seed: 9, diff: "−4", exp: 38, act: 34, note: "" },
    { team: "Missouri", seed: 10, diff: "−4", exp: 43, act: 39, note: "" },
    { team: "Nebraska", seed: 4, diff: "−3", exp: 16, act: 13, note: "" },
    { team: "Alabama", seed: 4, diff: "−3", exp: 17, act: 14, note: "Worst defense in field" },
    { team: "Michigan St.", seed: 3, diff: "−3", exp: 12, act: 9, note: "Braden Huff questionable" },
  ],
};

export const INJURIES: InjuryEntry[] = [
  { team: "Michigan", seed: 1, player: "L.J. Cason", line: "8 Pts / 2 Reb / 2 Ast", note: "Key bench depth piece" },
  { team: "Texas Tech", seed: 5, player: "JT Toppin", line: "22 Pts / 11 Reb (All-American)", note: "Lost Feb 17, team has adapted well" },
  { team: "BYU", seed: 6, player: "Richie Saunders", line: "18 Pts / 6 Reb", note: "Returned strong, won Big 12 Tourney games" },
  { team: "UNC", seed: 6, player: "Caleb Wilson", line: "9 Pts / 5 Reb", note: "Freshman rotation piece" },
  { team: "Clemson", seed: 8, player: "Carter Welling", line: "10 Pts / 5 Reb (starter)", note: "Injured in ACC tourney — key flip factor" },
  { team: "Villanova", seed: 8, player: "Matthew Hodge", line: "9 Pts / 4 Reb (starter)", note: "Out — contributes to TZ flip vs Utah St." },
  { team: "Michigan St.", seed: 3, player: "Braden Huff (Q)", line: "18 Pts / 6 Reb", note: "Questionable status" },
];

export const TZ_IMPACTS: TimeZoneImpact[] = [
  { team: "Hawaii", home: "HT", site: "Portland (PT)", direction: "east", zones: 3, pct: -9, final: false, note: "Doesn't matter vs Arkansas" },
  { team: "UCLA", home: "PT", site: "Philadelphia (ET)", direction: "east", zones: 3, pct: -9, final: false, note: "FLIP → UCF wins" },
  { team: "Saint Mary's", home: "PT", site: "Oklahoma City (CT)", direction: "east", zones: 2, pct: -6, final: false, note: "FLIP → Texas A&M wins" },
  { team: "Idaho", home: "PT", site: "Oklahoma City (CT)", direction: "east", zones: 2, pct: -6, final: true, note: "Doesn't affect outcome vs Houston" },
  { team: "Purdue", home: "ET", site: "San Jose (PT)", direction: "west", zones: 3, pct: -6, final: true, note: "Regional Sweet 16 — Gonzaga beats them" },
  { team: "Santa Clara", home: "PT", site: "St. Louis (CT)", direction: "east", zones: 2, pct: -6, final: false, note: "Doesn't matter vs Kentucky" },
  { team: "Kansas", home: "CT", site: "San Diego (PT)", direction: "west", zones: 2, pct: -4, final: true, note: "Final broadcast slot tightens vs Cal Baptist" },
  { team: "TCU", home: "CT", site: "Greenville (ET)", direction: "east", zones: 1, pct: -3, final: false, note: "FLIP → Ohio St. wins" },
  { team: "Alabama", home: "CT", site: "Tampa (ET)", direction: "east", zones: 1, pct: -3, final: false, note: "Compounds worst defense in field" },
  { team: "Iowa", home: "CT", site: "Tampa (ET)", direction: "east", zones: 1, pct: -3, final: false, note: "Still beats Clemson (injury)" },
  { team: "Illinois", home: "CT", site: "Greenville (ET)", direction: "east", zones: 1, pct: -3, final: true, note: "Final slot, still beats Penn" },
  { team: "Saint Louis", home: "CT", site: "Buffalo (ET)", direction: "east", zones: 1, pct: -3, final: true, note: "Final slot" },
  { team: "Michigan", home: "ET", site: "Chicago (CT)", direction: "west", zones: 1, pct: -2, final: true, note: "Regional — still beats Alabama" },
  { team: "Florida", home: "ET", site: "Houston (CT)", direction: "west", zones: 1, pct: -2, final: true, note: "FLIP → Houston wins Elite Eight" },
  { team: "Arizona", home: "PT", site: "Indianapolis (ET)", direction: "east", zones: 3, pct: -9, final: false, note: "Final Four — Duke unaffected at 0%" },
];

export const BRACKET: Record<"east" | "west" | "south" | "midwest", RegionData> = {
  east: {
    region: "East",
    site: "Washington D.C. (ET)",
    winner: "Duke",
    r1: [
      { s1: 1, t1: "Duke", s2: 16, t2: "Siena", w: 1, tags: [] },
      { s1: 8, t1: "Ohio St.", s2: 9, t2: "TCU", w: 1, tags: ["TZ flip (TCU −3%)"] },
      { s1: 5, t1: "St. John's", s2: 12, t2: "N. Iowa", w: 1, tags: ["underseeded +3"] },
      { s1: 4, t1: "Kansas", s2: 13, t2: "Cal Baptist", w: 1, tags: [] },
      { s1: 6, t1: "Louisville", s2: 11, t2: "S. Florida", w: 1, tags: [] },
      { s1: 3, t1: "Michigan St.", s2: 14, t2: "N. Dakota St.", w: 1, tags: ["ND St. −3%"] },
      { s1: 10, t1: "UCF", s2: 7, t2: "UCLA", w: 1, tags: ["TZ FLIP — UCLA −9%"] },
      { s1: 2, t1: "UConn", s2: 15, t2: "Furman", w: 1, tags: [] },
    ],
    r2: [
      { t1: "Duke", t2: "Ohio St.", w: 1, tags: [] },
      { t1: "St. John's", t2: "Kansas", w: 1, tags: ["St. John's KP#17, Kansas overseeded −5"] },
      { t1: "Michigan St.", t2: "Louisville", w: 1, tags: [] },
      { t1: "UConn", t2: "UCF", w: 1, tags: [] },
    ],
    s16: [
      { t1: "Duke", t2: "St. John's", w: 1, tags: ["St. John's −9% (SD→DC)"] },
      { t1: "Michigan St.", t2: "UConn", w: 1, tags: ["UConn fringe-slow"] },
    ],
    e8: { t1: "Duke", t2: "Michigan St.", w: 1, note: "Duke to Final Four with 0% total penalty" },
  },
  west: {
    region: "West",
    site: "San Jose, CA (PT)",
    winner: "Arizona",
    r1: [
      { s1: 1, t1: "Arizona", s2: 16, t2: "Long Island", w: 1, tags: [] },
      { s1: 9, t1: "Utah St.", s2: 8, t2: "Villanova", w: 1, tags: ["Villanova −9%+ Hodge out"] },
      { s1: 5, t1: "Wisconsin", s2: 12, t2: "High Point", w: 1, tags: ["Both going to PT"] },
      { s1: 4, t1: "Arkansas", s2: 13, t2: "Hawaii", w: 1, tags: ["Hawaii −9%"] },
      { s1: 6, t1: "BYU", s2: 11, t2: "NC St./Texas", w: 1, tags: [] },
      { s1: 3, t1: "Gonzaga", s2: 14, t2: "Kennesaw St.", w: 1, tags: ["Kennesaw −6% final slot"] },
      { s1: 10, t1: "Missouri", s2: 7, t2: "Miami FL", w: 1, tags: ["Miami FL −2% final slot"] },
      { s1: 2, t1: "Purdue", s2: 15, t2: "Queens", w: 1, tags: [] },
    ],
    r2: [
      { t1: "Arizona", t2: "Utah St.", w: 1, tags: [] },
      { t1: "Arkansas", t2: "Wisconsin", w: 1, tags: ["Arkansas KP#14"] },
      { t1: "Gonzaga", t2: "BYU", w: 1, tags: ["Gonzaga Trapezoid"] },
      { t1: "Purdue", t2: "Missouri", w: 1, tags: [] },
    ],
    s16: [
      { t1: "Arizona", t2: "Arkansas", w: 1, tags: ["Arkansas CT→PT −6%"] },
      { t1: "Gonzaga", t2: "Purdue", w: 1, tags: ["Purdue ET→PT −6% final"] },
    ],
    e8: { t1: "Arizona", t2: "Gonzaga", w: 1, note: "Arizona to Final Four — PT perfect path, but −9% awaits in Indy" },
  },
  south: {
    region: "South",
    site: "Houston, TX (CT)",
    winner: "Houston",
    r1: [
      { s1: 1, t1: "Florida", s2: 16, t2: "Lehigh/PVAMU", w: 1, tags: [] },
      { s1: 9, t1: "Iowa", s2: 8, t2: "Clemson", w: 1, tags: ["Clemson overseeded, Welling out"] },
      { s1: 5, t1: "Vanderbilt", s2: 12, t2: "McNeese", w: 1, tags: ["Vanderbilt underseeded +5"] },
      { s1: 4, t1: "Nebraska", s2: 13, t2: "Troy", w: 1, tags: [] },
      { s1: 10, t1: "Texas A&M", s2: 7, t2: "Saint Mary's", w: 1, tags: ["TZ FLIP — Saint Mary's −6%"] },
      { s1: 2, t1: "Houston", s2: 15, t2: "Idaho", w: 1, tags: ["Idaho −6%"] },
      { s1: 6, t1: "N. Carolina", s2: 11, t2: "VCU", w: 1, tags: [] },
      { s1: 3, t1: "Illinois", s2: 14, t2: "Penn", w: 1, tags: ["Illinois −3% final slot"] },
    ],
    r2: [
      { t1: "Florida", t2: "Iowa", w: 1, tags: [] },
      { t1: "Vanderbilt", t2: "Nebraska", w: 1, tags: ["Vanderbilt KP#12"] },
      { t1: "Houston", t2: "Texas A&M", w: 1, tags: [] },
      { t1: "Illinois", t2: "N. Carolina", w: 1, tags: ["Illinois KP#7"] },
    ],
    s16: [
      { t1: "Florida", t2: "Vanderbilt", w: 1, tags: ["Florida −2% ET→CT"] },
      { t1: "Houston", t2: "Illinois", w: 1, tags: ["Houston home region 0%"] },
    ],
    e8: { t1: "Houston", t2: "Florida", w: 1, note: "BIGGEST UPSET — Houston home regional (0%) vs Florida −2% final. KP#4 vs #5. Florida fringe-trap." },
  },
  midwest: {
    region: "Midwest",
    site: "Chicago, IL (CT)",
    winner: "Michigan",
    r1: [
      { s1: 1, t1: "Michigan", s2: 16, t2: "HOW/UMBC", w: 1, tags: [] },
      { s1: 8, t1: "Georgia", s2: 9, t2: "Saint Louis", w: 1, tags: ["Saint Louis CT→ET −3%"] },
      { s1: 5, t1: "Texas Tech", s2: 12, t2: "Akron", w: 1, tags: ["Texas Tech −3%"] },
      { s1: 4, t1: "Alabama", s2: 13, t2: "Hofstra", w: 1, tags: ["Alabama −3%"] },
      { s1: 6, t1: "Tennessee", s2: 11, t2: "SMU/Miami OH", w: 1, tags: ["SMU −3%"] },
      { s1: 3, t1: "Virginia", s2: 14, t2: "Wright St.", w: 1, tags: [] },
      { s1: 2, t1: "Iowa St.", s2: 15, t2: "Tenn. St.", w: 1, tags: [] },
      { s1: 7, t1: "Kentucky", s2: 10, t2: "Santa Clara", w: 1, tags: ["Santa Clara PT→CT −6%"] },
    ],
    r2: [
      { t1: "Michigan", t2: "Georgia", w: 1, tags: [] },
      { t1: "Alabama", t2: "Texas Tech", w: 1, tags: ["Toppin still out"] },
      { t1: "Virginia", t2: "Tennessee", w: 1, tags: ["Virginia KP#9 blended"] },
      { t1: "Iowa St.", t2: "Kentucky", w: 1, tags: ["Iowa St. Trapezoid"] },
    ],
    s16: [
      { t1: "Michigan", t2: "Alabama", w: 1, tags: ["Michigan −2% still better. Alabama 356th defense"] },
      { t1: "Iowa St.", t2: "Virginia", w: 1, tags: ["Virginia −2% ET→CT final"] },
    ],
    e8: { t1: "Michigan", t2: "Iowa St.", w: 1, note: "Michigan to Final Four. KP#3 vs KP#8. Michigan defense (#2 nationally, 91.0 adj eff.) is decisive." },
  },
};

export const PICKS: PickEntry[] = [
  {
    group: "tz",
    badge: "FLIP",
    round: "R1",
    region: "East",
    pick: "UCF over UCLA",
    reason: "UCLA PT→ET −9% · spread only −2.5 · mathematically clean reversal",
    body: "UCLA (Pacific) travels cross-country to Philadelphia (Eastern) — a full 3-zone eastward jump, carrying a 9% output penalty. UCF is home time zone (Eastern), zero penalty. The opening line was only −2.5 for UCLA. With UCLA effectively operating at 91% of their statistical output, this flips cleanly to UCF. One of the highest-confidence TZ picks in the bracket.",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "R1",
    region: "South",
    pick: "Texas A&M over Saint Mary's",
    reason: "Saint Mary's PT→CT −6% · Texas A&M home TZ (CT=CT) · 7/10 matchup on the margin",
    body: "Saint Mary's (Moraga, CA — Pacific) travels 2 time zones east to Oklahoma City (Central), absorbing a 6% output penalty. Texas A&M (College Station, TX) is Central time — same zone as the site, zero penalty. This is a 7-seed vs 10-seed matchup where that 6% edge is the entire margin. Texas A&M advances and faces Houston in Round 2 (where Houston wins).",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "R1",
    region: "East",
    pick: "Ohio St. over TCU",
    reason: "TCU CT→ET −3% · already a coin-flip 8/9 — penalty breaks the tie",
    body: "TCU (Fort Worth, TX — Central) travels east to Greenville (Eastern), picking up a 3% penalty. Ohio St. is Eastern, zero penalty. This was going to be close regardless — 8/9 games are historically near 50/50 — but the TZ math cleanly tips it to Ohio St. Duke beats them in Round 2 without issue.",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "R1",
    region: "West",
    pick: "Utah St. over Villanova",
    reason: "Villanova ET→PT −9% + Matthew Hodge (starting guard) out",
    body: "Villanova (Philadelphia, PA — Eastern) travels all the way west to San Diego (Pacific) — a 3-zone westward jump in the final broadcast slot, carrying a 9% output penalty. On top of that, Matthew Hodge (starting guard, 9 Pts/4 Reb) is out. Utah St. is a Mountain time team traveling to Pacific — just 1 zone, not in the final slot, so only a −3% hit. The net differential is enormous. Utah St. wins comfortably.",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "R1",
    region: "West",
    pick: "Missouri over Miami FL",
    reason: "Miami FL ET→CT −2% final broadcast slot · St. Louis is Miami's home turf on paper, not really",
    body: "Miami FL (Coral Gables — Eastern) travels to St. Louis (Central) in the final broadcast slot — triggering the 2% westward penalty. Missouri (Columbia, MO) is Central, zero penalty at a home-state site. This is the smallest flip in the bracket — 2% — but Miami FL's blended analytics rank (#31) vs Missouri's (#46) was already close enough for the penalty to decide it.",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "R1",
    region: "Midwest",
    pick: "Georgia over Saint Louis",
    reason: "Saint Louis CT→ET −3% final slot · Georgia ET home TZ at Buffalo",
    body: "Saint Louis (Missouri — Central) travels east to Buffalo (Eastern) for the final evening game, absorbing a 3% penalty in the final broadcast slot. Georgia (Athens, GA) is Eastern — zero penalty. The blended rankings have Georgia at #32 vs Saint Louis at #41, so this was chalky to begin with. The TZ edge just makes it more comfortable.",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "R1",
    region: "Midwest",
    pick: "Kentucky over Santa Clara",
    reason: "Santa Clara PT→CT −6% · two zones east · Kentucky ET travels to CT (west, not final slot — 0%)",
    body: "Santa Clara (Silicon Valley — Pacific) travels two zones east to St. Louis (Central), eating a 6% output penalty with no mitigating factors. Kentucky (Lexington — Eastern) is actually traveling west to St. Louis, but since it's not the final broadcast slot, the westward rule doesn't trigger. Net: Santa Clara at −6%, Kentucky at 0%. The bracket has Kentucky winning this comfortably.",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "S16",
    region: "West",
    pick: "Gonzaga over Purdue",
    reason: "Purdue ET→PT −6% final slot at San Jose · Gonzaga 0% (home PT) · Trapezoid-qualified",
    body: "Purdue (West Lafayette, IN — Eastern) travels three zones west to San Jose (Pacific) for the Sweet 16 in what will be an evening game — triggering the 6% westward final-slot penalty. Gonzaga (Spokane, WA — Pacific) is home time zone, zero penalty. On top of that, Gonzaga is a legitimate Trapezoid of Excellence team (KP#10), while Purdue plays historically slow (364th pace). Purdue has the #1 adjusted offensive efficiency in the nation, making them a genuine dark horse — but the path kills them.",
  },
  {
    group: "tz",
    badge: "FLIP",
    round: "E8",
    region: "South",
    pick: "Houston over Florida",
    reason: "Florida ET→CT −2% final slot · Houston home regional (0%) · KP#5 vs KP#4 · Florida fringe-trap",
    body: "This is the biggest upset in the bracket and the most analytically loaded pick. Houston's regional site is literally their home city — they play Round 1/2 in Oklahoma City (CT, same zone), then the Elite Eight in Houston, TX (CT, still home). Zero accumulated TZ penalty through five rounds. Florida (Gainesville — Eastern) travels one zone west to Houston in what will be the final evening game, triggering the 2% westward penalty. The KenPom gap is razor thin: Florida is #4, Houston is #5 in the blended rankings. Florida is flagged as 'Fringe Trap — too fast' in the Trapezoid model. Houston's defense is elite (#5 adj. def. eff.). The TZ advantage plus defensive profile plus Trapezoid flag tips this to Houston.",
  },
  {
    group: "analytics",
    badge: "UPGRADE",
    round: "R1",
    region: "East",
    pick: "St. John's over N. Iowa",
    reason: "St. John's underseeded +3 · KP#15 as a 5-seed · N. Iowa is 68th in adjusted offensive efficiency",
    body: "St. John's (Big East) is the 15th-best team in the blended multi-system rankings playing as a 5-seed — underseeded by 3 positions on the S-curve. Northern Iowa ranks 68th in adjusted offensive efficiency among the 68 tournament teams (second-worst in the field). This is a comfortable first-round win.",
  },
  {
    group: "analytics",
    badge: "DOWNGRADE",
    round: "R2",
    region: "East",
    pick: "St. John's over Kansas",
    reason: "St. John's underseeded +3 (KP#15) · Kansas overseeded −5 (KP#21 as 4-seed) · biggest seed error in the field",
    body: "Kansas is overseeded by 5 positions on the S-curve — the largest overseeding error for a top-4 seed. The committee placed them 15th on the S-curve; analytics say 20th. St. John's, meanwhile, is underseeded by 3 (expected 15th, placed 18th). In reality these two teams are much closer to equals than the 4-vs-5 matchup implies, and St. John's has the better blended profile. Kansas exits in Round 2.",
  },
  {
    group: "analytics",
    badge: "UPGRADE",
    round: "R2",
    region: "South",
    pick: "Vanderbilt to Sweet 16",
    reason: "Most underseeded team in the field (+5 S-diff) · KP#12 playing as a 5-seed · beats Nebraska in R2",
    body: "S-curve analysis from the Eisenberg Guide confirms Vanderbilt is the single most underseeded team in the entire 68-team field. Their expected S-curve position is 12th; the committee placed them 17th — nearly a full seed line of error. The blended multi-system rank is #13 overall (BPI 14, EM 14, KPI 9, NET 13, KenPom 12). They're a 5-seed with a 2-seed's analytics profile. Nebraska (their Round 2 opponent) is overseeded by 3 on the S-curve and has a worse blended rank. Vanderbilt reaches the Sweet 16 with high conviction.",
  },
  {
    group: "analytics",
    badge: "CONFIRM",
    round: "R1",
    region: "South",
    pick: "Iowa over Clemson",
    reason: "Clemson overseeded −2 · Carter Welling (starter) out · Iowa underseeded +3 · TZ only −3%",
    body: "Iowa absorbs a −3% east penalty traveling to Tampa (CT→ET), which initially looks like a concern. But Clemson's starting forward Carter Welling is out with an ACC tourney injury, Clemson is overseeded by 2 on the S-curve, and Iowa is underseeded by 3. The Eisenberg Guide's opening line data also shows Clemson is a slow-paced team with mediocre defense — not a great matchup profile. The injury and S-curve gap comfortably outweigh the TZ penalty. Iowa advances.",
  },
  {
    group: "analytics",
    badge: "DOWNGRADE",
    round: "S16",
    region: "Midwest",
    pick: "Michigan over Alabama",
    reason: "Alabama 356th defense nationally · overseeded −3 · CT→ET −3% · Michigan #2 adj. def. eff.",
    body: "Alabama allows 83.5 PPG — dead last (356th nationally) among all 68 tournament teams. For context, that's historically bad defense for a 4-seed in any era. They're also overseeded by 3 on the S-curve and absorb a −3% TZ penalty going to Tampa. Their offense is real (fastest pace, #3 adj. off. eff., Aden Holloway and Louis Philon are legitimate scorers) but Michigan's #2 adjusted defensive efficiency (91.0) is purpose-built to neutralize exactly that style. Alabama's run ends in the Sweet 16.",
  },
  {
    group: "analytics",
    badge: "CONFIRM",
    round: "R2",
    region: "South",
    pick: "Illinois over N. Carolina",
    reason: "Illinois KP#7 · stronger analytics profile than their 3-seed suggests · UNC overseeded",
    body: "Illinois ranks 7th in the blended multi-system rankings — better than their 3-seed implies — with strong adjusted offensive efficiency (#2 nationally at 131.9) and a solid defensive profile. North Carolina (KP#24 blended) is a 6-seed that plays solid basketball but doesn't have the analytics profile to beat Illinois in a second-round game. Illinois advances to the Sweet 16 where they face Houston.",
  },
  {
    group: "analytics",
    badge: "CONFIRM",
    round: "R2",
    region: "Midwest",
    pick: "Virginia over Tennessee",
    reason: "Virginia KP#9 blended · underseeded +3 on S-curve · should be a 2-seed",
    body: "Virginia's blended multi-system rank is #9 overall — dramatically better than a 3-seed. The S-curve analysis has them underseeded by 3 positions (expected 9th, placed 12th). Their defensive efficiency is elite. Tennessee (22-11 record, KP#16 blended) is the weaker team here despite equivalent seeding. Virginia advances to the Sweet 16 where Iowa St. edges them.",
  },
  {
    group: "confirm",
    badge: "LOCKED",
    round: "FF",
    region: "East",
    pick: "Duke wins the championship",
    reason: "#1 in all 8 systems · 0% TZ penalty every round · best defense in country (90.8)",
    body: "Duke is ranked #1 in every one of the 8 metric systems used in the Eisenberg Guide: BPI (1), Evan Miya (1), KPI (1), NCAA NET (1), KenPom (1), SOR (3), T-Rank (1), WAB (2). They hold the best adjusted defensive efficiency in the nation at 90.8. Cooper Boozer scores at 22.5 PPG with 29.6% usage. Critically, Duke plays every single game in Eastern time — Greenville (ET), Washington D.C. (ET), Indianapolis (ET). Zero accumulated travel penalty from first round through the national championship. Their Final Four opponent Arizona absorbs a brutal −9% hit stepping off the plane in Indianapolis. The case is airtight.",
  },
  {
    group: "confirm",
    badge: "LOCKED",
    round: "FF",
    region: "Midwest",
    pick: "Michigan to the Final Four",
    reason: "#2 in all 8 systems · #2 adj. def. eff. (91.0) · beats Alabama (worst defense) and Iowa St.",
    body: "Michigan is #2 in the blended multi-system rankings across every metric. Their adjusted defensive efficiency of 91.0 is second only to Duke in the entire field. They face Alabama in the Sweet 16 — the team with the worst defense in the tournament (356th nationally) — and Iowa St. in the Elite Eight. The Chicago regional is one zone west for Michigan (−2% in the final slot), but that's a manageable penalty against inferior opponents. Michigan reaches Indianapolis at 0% penalty for the Final Four.",
  },
  {
    group: "confirm",
    badge: "WATCH",
    round: "FF",
    region: "West",
    pick: "Arizona to the Final Four (then −9% in Indy)",
    reason: "Perfect PT path all the way — then the cliff: PT→ET −9% vs Duke at 0%",
    body: "Arizona's path through the West is perfectly aligned: Tucson (Pacific), San Diego (Pacific), San Jose (Pacific). Zero accumulated travel penalty through six rounds. They're #2 in the blended rankings, #1 in SOR. Then they board a plane to Indianapolis (Eastern) and absorb a 9% output penalty for the national semifinal against Duke — who has been at 100% output since day one. The analytics gap between Duke and Arizona is not large enough to survive a 9-point swing. Arizona is eliminated in the semis.",
  },
  {
    group: "confirm",
    badge: "WATCH",
    round: "FF",
    region: "South",
    pick: "Houston to the Final Four",
    reason: "Home regional (0% accumulated) · KP#5 · elite defense · only −3% at Final Four",
    body: "Houston's structural TZ advantage is the most underappreciated factor in the bracket. Oklahoma City (Round 1/2) is Central time — same zone as Houston. Their regional site is literally Houston, TX. Zero accumulated TZ penalty through five rounds. They pick up just −3% heading to Indianapolis for the Final Four — the smallest penalty among the four Final Four teams. For a KP#5 team with the 5th-best adjusted defensive efficiency in the field, that's a significant structural edge. They beat Florida (who pays −2% at the Houston regional) in the Elite Eight and face Michigan in Indianapolis.",
  },
];

export const HERO_TAGS = ["KenPom", "S-Curve", "Time Zones", "Injury Model"] as const;

export const FINAL_FOUR_SUMMARY = [
  { label: "Semifinal 1", matchup: "Duke vs Arizona", winner: "Duke", note: "Arizona −9% PT→ET" },
  { label: "Semifinal 2", matchup: "Michigan vs Houston", winner: "Michigan", note: "Houston −3% CT→ET" },
  { label: "Championship", matchup: "Duke vs Michigan", winner: "Duke", note: "Both ET, 0% penalty" },
] as const;

export const TOP_UPSET_PICKS: EditorialCard[] = [
  {
    eyebrow: "Top upset pick",
    title: "UCF over UCLA",
    reason: "The cleanest Round 1 reversal in the bracket comes from UCLA absorbing a full 9% Pacific-to-Eastern penalty.",
    note: "Spread only −2.5 · three time zones east",
    href: "/march-madness-2026?view=picks#analysis-workspace",
    cta: "Open upset board",
    color: "rose",
  },
  {
    eyebrow: "Seed error",
    title: "St. John's over Kansas",
    reason: "St. John's grades like a stronger team than a 5-seed, while Kansas is one of the biggest overseeded teams in the field.",
    note: "Underseeded +3 vs overseeded −5",
    href: "/march-madness-2026?view=picks#analysis-workspace",
    cta: "See the analytics case",
    color: "amber",
  },
  {
    eyebrow: "Bracket swing",
    title: "Houston over Florida",
    reason: "The home regional and zero accumulated travel penalty make Houston the biggest structural upset call in the bracket.",
    note: "KP#5 vs KP#4 · Houston at 0%",
    href: "/march-madness-2026?view=picks#analysis-workspace",
    cta: "Jump to Elite Eight call",
    color: "blue",
  },
];

export const MODEL_PILLARS: EditorialCard[] = [
  {
    eyebrow: "Consensus ranking",
    title: "KenPom plus seven other systems",
    reason: "The rankings blend BPI, Evan Miya, KPI, NET, KenPom, SOR, T-Rank, and WAB so no single model controls the board.",
    note: "Open the full rankings table",
    href: "/march-madness-2026?view=analytics&analytics=rankings#analysis-workspace",
    cta: "View rankings",
    color: "blue",
  },
  {
    eyebrow: "Committee stress test",
    title: "S-curve seed errors",
    reason: "The model highlights underseeded and overseeded teams so seed lines do not get treated as truth when the committee misses.",
    note: "Best example: Vanderbilt +5",
    href: "/march-madness-2026?view=analytics&analytics=s-curve#analysis-workspace",
    cta: "View S-curve",
    color: "amber",
  },
  {
    eyebrow: "Roster context",
    title: "Injury adjustments",
    reason: "Questionable starters and missing rotation pieces change upset probability fast, especially in coin-flip 8/9 and 7/10 games.",
    note: "Clemson and Villanova are key examples",
    href: "/march-madness-2026?view=analytics&analytics=injuries#analysis-workspace",
    cta: "View injuries",
    color: "rose",
  },
  {
    eyebrow: "Travel edge",
    title: "Time-zone penalties",
    reason: "The page applies a travel tax to east-west jumps and final-slot games, which creates several non-obvious bracket flips.",
    note: "UCLA and Arizona take the biggest hits",
    href: "/march-madness-2026?view=time-zones#analysis-workspace",
    cta: "View time zones",
    color: "rose",
  },
];

export const MARCH_MADNESS_FAQ: FAQEntry[] = [
  {
    question: "What is the best upset pick in this March Madness bracket?",
    answer:
      "The strongest first-round upset is UCF over UCLA because UCLA takes a full 9% Pacific-to-Eastern time-zone penalty while the betting line is already short enough for that travel hit to flip the game.",
  },
  {
    question: "How does the time-zone model work?",
    answer:
      "The bracket applies percentage penalties based on direction of travel, number of time zones crossed, and whether the game is in the final broadcast slot. Eastward travel is the biggest first-round edge, while late westward games matter later in the bracket.",
  },
  {
    question: "Who is the champion pick for the 2026 bracket?",
    answer:
      "Duke is the championship pick because the team ranks first across the blended metric set, carries a 0% total travel penalty through the entire path, and owns the strongest defensive profile in the field.",
  },
  {
    question: "Why does this bracket differ from chalk picks?",
    answer:
      "It does not treat seed lines as the full story. The model combines consensus analytics, S-curve seed errors, injuries, and travel penalties, which is why teams like St. John's, Vanderbilt, Gonzaga, and Houston get stronger paths than a basic chalk bracket would show.",
  },
];

export const BRACKET_THESIS_SHARE =
  "Bracket thesis: the edge in this 2026 March Madness bracket is time zones plus seed errors, not just chalk.";

export const BEST_UPSET_SHARE =
  "Best upset: UCF over UCLA. UCLA loses 9% crossing three time zones east, and the line is only UCLA −2.5.";
