'use client';

import { useState } from 'react';

// ─── DATA ────────────────────────────────────────────────────────────────────

const RANKINGS = [
  { rank: 1,  team: 'Duke',         conf: 'ACC', record: '32-2', avg: 1.3,  bpi: 1,  em: 1,  kpi: 1,  net: 1,  pom: 1,  sor: 3,  tr: 1,  wab: 2,  trap: 'Trapezoid', odds: '+300',  seed: 1 },
  { rank: 2,  team: 'Michigan',     conf: 'B10', record: '31-3', avg: 2.0,  bpi: 2,  em: 2,  kpi: 3,  net: 2,  pom: 3,  sor: 2,  tr: 2,  wab: 1,  trap: 'Trapezoid', odds: '+360',  seed: 1 },
  { rank: 3,  team: 'Arizona',      conf: 'B12', record: '32-2', avg: 2.7,  bpi: 3,  em: 3,  kpi: 2,  net: 3,  pom: 2,  sor: 1,  tr: 3,  wab: 3,  trap: 'Trapezoid', odds: '+390',  seed: 1 },
  { rank: 4,  team: 'Florida',      conf: 'SEC', record: '26-7', avg: 4.6,  bpi: 5,  em: 4,  kpi: 4,  net: 4,  pom: 4,  sor: 5,  tr: 4,  wab: 7,  trap: 'Fringe (fast)', odds: '+750', seed: 1 },
  { rank: 5,  team: 'Houston',      conf: 'B12', record: '28-6', avg: 5.0,  bpi: 4,  em: 5,  kpi: 5,  net: 5,  pom: 5,  sor: 6,  tr: 5,  wab: 5,  trap: 'Slowest',   odds: '+1000', seed: 2 },
  { rank: 6,  team: 'Purdue',       conf: 'B10', record: '27-8', avg: 6.9,  bpi: 9,  em: 6,  kpi: 6,  net: 9,  pom: 8,  sor: 7,  tr: 8,  wab: 4,  trap: '—',         odds: '+2500', seed: 2 },
  { rank: 7,  team: 'UConn',        conf: 'BE',  record: '29-5', avg: 8.3,  bpi: 10, em: 9,  kpi: 7,  net: 10, pom: 11, sor: 4,  tr: 9,  wab: 6,  trap: 'Fringe (slow)', odds: '+2500', seed: 2 },
  { rank: 8,  team: 'Iowa St.',     conf: 'B12', record: '27-7', avg: 8.7,  bpi: 6,  em: 7,  kpi: 14, net: 6,  pom: 6,  sor: 14, tr: 7,  wab: 12, trap: 'Trapezoid', odds: '+1500', seed: 2 },
  { rank: 9,  team: 'Virginia',     conf: 'ACC', record: '29-5', avg: 11.0, bpi: 20, em: 13, kpi: 8,  net: 12, pom: 13, sor: 9,  tr: 14, wab: 8,  trap: 'Fringe (slow)', odds: '+7500', seed: 3 },
  { rank: 10, team: 'Gonzaga',      conf: 'WCC', record: '30-3', avg: 11.4, bpi: 8,  em: 10, kpi: 18, net: 7,  pom: 10, sor: 11, tr: 11, wab: 13, trap: 'Trapezoid', odds: '+4000', seed: 3 },
  { rank: 11, team: 'Illinois',     conf: 'B10', record: '24-8', avg: 11.6, bpi: 7,  em: 8,  kpi: 19, net: 8,  pom: 7,  sor: 17, tr: 6,  wab: 16, trap: 'Fringe (slow)', odds: '+1900', seed: 3 },
  { rank: 12, team: 'Michigan St.', conf: 'B10', record: '25-7', avg: 12.1, bpi: 13, em: 12, kpi: 13, net: 11, pom: 9,  sor: 13, tr: 13, wab: 11, trap: 'Fringe (net)', odds: '+4000', seed: 3 },
  { rank: 13, team: 'Vanderbilt',   conf: 'SEC', record: '26-8', avg: 12.1, bpi: 14, em: 14, kpi: 9,  net: 13, pom: 12, sor: 12, tr: 10, wab: 14, trap: '—',         odds: '+7500', seed: 5 },
  { rank: 14, team: 'Arkansas',     conf: 'SEC', record: '26-8', avg: 14.1, bpi: 17, em: 15, kpi: 17, net: 15, pom: 15, sor: 8,  tr: 19, wab: 9,  trap: '—',         odds: '+6000', seed: 4 },
  { rank: 15, team: "St. John's",   conf: 'BE',  record: '28-6', avg: 14.7, bpi: 16, em: 11, kpi: 10, net: 16, pom: 17, sor: 16, tr: 15, wab: 15, trap: '—',         odds: '+6000', seed: 5 },
];

const SCURVE = {
  under: [
    { team: 'Vanderbilt',   seed: 5,  diff: '+5', exp: 12, act: 17, note: 'Most underseeded team in the field' },
    { team: 'VCU',          seed: 11, diff: '+5', exp: 40, act: 45, note: 'Strong metrics for an 11-seed' },
    { team: 'UMBC',         seed: 16, diff: '+6', exp: 60, act: 66, note: 'First Four' },
    { team: "St. John's",   seed: 5,  diff: '+3', exp: 15, act: 18, note: 'Should be a 4-seed' },
    { team: 'Utah St.',     seed: 9,  diff: '+4', exp: 29, act: 33, note: 'Better than a 9' },
    { team: 'Iowa',         seed: 9,  diff: '+3', exp: 33, act: 36, note: '' },
    { team: 'Virginia',     seed: 3,  diff: '+3', exp: 9,  act: 12, note: 'Should be a 2-seed' },
  ],
  over: [
    { team: 'UCF',          seed: 10, diff: '−6', exp: 44, act: 38, note: 'Big gift from committee' },
    { team: 'Kansas',       seed: 4,  diff: '−5', exp: 20, act: 15, note: 'Overseeded by nearly a full seed line' },
    { team: 'TCU',          seed: 9,  diff: '−4', exp: 38, act: 34, note: '' },
    { team: 'Missouri',     seed: 10, diff: '−4', exp: 43, act: 39, note: '' },
    { team: 'Nebraska',     seed: 4,  diff: '−3', exp: 16, act: 13, note: '' },
    { team: 'Alabama',      seed: 4,  diff: '−3', exp: 17, act: 14, note: 'Worst defense in field' },
    { team: 'Michigan St.', seed: 3,  diff: '−3', exp: 12, act: 9,  note: 'Braden Huff questionable' },
  ],
};

const INJURIES = [
  { team: 'Michigan',     seed: 1, player: 'L.J. Cason',    line: '8 Pts / 2 Reb / 2 Ast', note: 'Key bench depth piece' },
  { team: 'Texas Tech',   seed: 5, player: 'JT Toppin',     line: '22 Pts / 11 Reb (All-American)', note: 'Lost Feb 17, team has adapted well' },
  { team: 'BYU',          seed: 6, player: 'Richie Saunders',line: '18 Pts / 6 Reb',        note: 'Returned strong, won Big 12 Tourney games' },
  { team: 'UNC',          seed: 6, player: 'Caleb Wilson',   line: '9 Pts / 5 Reb',         note: 'Freshman rotation piece' },
  { team: 'Clemson',      seed: 8, player: 'Carter Welling', line: '10 Pts / 5 Reb (starter)', note: 'Injured in ACC tourney — key flip factor' },
  { team: 'Villanova',    seed: 8, player: 'Matthew Hodge',  line: '9 Pts / 4 Reb (starter)', note: 'Out — contributes to TZ flip vs Utah St.' },
  { team: 'Michigan St.', seed: 3, player: 'Braden Huff (Q)',line: '18 Pts / 6 Reb',        note: 'Questionable status' },
];

const TZ_IMPACTS = [
  { team: 'Hawaii',       home: 'HT', site: 'Portland (PT)',     direction: 'east', zones: 3, pct: -9, final: false, note: "Doesn't matter vs Arkansas" },
  { team: 'UCLA',         home: 'PT', site: 'Philadelphia (ET)', direction: 'east', zones: 3, pct: -9, final: false, note: 'FLIP → UCF wins' },
  { team: "Saint Mary's", home: 'PT', site: 'Oklahoma City (CT)',direction: 'east', zones: 2, pct: -6, final: false, note: 'FLIP → Texas A&M wins' },
  { team: 'Idaho',        home: 'PT', site: 'Oklahoma City (CT)',direction: 'east', zones: 2, pct: -6, final: true,  note: "Doesn't affect outcome vs Houston" },
  { team: 'Purdue',       home: 'ET', site: 'San Jose (PT)',      direction: 'west', zones: 3, pct: -6, final: true,  note: 'Regional Sweet 16 — Gonzaga beats them' },
  { team: 'Santa Clara',  home: 'PT', site: 'St. Louis (CT)',     direction: 'east', zones: 2, pct: -6, final: false, note: "Doesn't matter vs Kentucky" },
  { team: 'Kansas',       home: 'CT', site: 'San Diego (PT)',     direction: 'west', zones: 2, pct: -4, final: true,  note: 'Final broadcast slot tightens vs Cal Baptist' },
  { team: 'TCU',          home: 'CT', site: 'Greenville (ET)',    direction: 'east', zones: 1, pct: -3, final: false, note: 'FLIP → Ohio St. wins' },
  { team: 'Alabama',      home: 'CT', site: 'Tampa (ET)',         direction: 'east', zones: 1, pct: -3, final: false, note: 'Compounds worst defense in field' },
  { team: 'Iowa',         home: 'CT', site: 'Tampa (ET)',         direction: 'east', zones: 1, pct: -3, final: false, note: 'Still beats Clemson (injury)' },
  { team: 'Illinois',     home: 'CT', site: 'Greenville (ET)',    direction: 'east', zones: 1, pct: -3, final: true,  note: 'Final slot, still beats Penn' },
  { team: 'Saint Louis',  home: 'CT', site: 'Buffalo (ET)',       direction: 'east', zones: 1, pct: -3, final: true,  note: 'Final slot' },
  { team: 'Michigan',     home: 'ET', site: 'Chicago (CT)',       direction: 'west', zones: 1, pct: -2, final: true,  note: 'Regional — still beats Alabama' },
  { team: 'Florida',      home: 'ET', site: 'Houston (CT)',       direction: 'west', zones: 1, pct: -2, final: true,  note: 'FLIP → Houston wins Elite Eight' },
  { team: 'Arizona',      home: 'PT', site: 'Indianapolis (ET)',  direction: 'east', zones: 3, pct: -9, final: false, note: 'Final Four — Duke unaffected at 0%' },
];

const BRACKET = {
  east: {
    region: 'East', site: 'Washington D.C. (ET)', winner: 'Duke',
    r1: [
      { s1: 1, t1: 'Duke',         s2: 16, t2: 'Siena',          w: 1, tags: [] },
      { s1: 8, t1: 'Ohio St.',     s2: 9,  t2: 'TCU',            w: 1, tags: ['TZ flip (TCU −3%)'] },
      { s1: 5, t1: "St. John's",   s2: 12, t2: 'N. Iowa',        w: 1, tags: ['underseeded +3'] },
      { s1: 4, t1: 'Kansas',       s2: 13, t2: 'Cal Baptist',    w: 1, tags: [] },
      { s1: 6, t1: 'Louisville',   s2: 11, t2: 'S. Florida',     w: 1, tags: [] },
      { s1: 3, t1: 'Michigan St.', s2: 14, t2: 'N. Dakota St.',  w: 1, tags: ['ND St. −3%'] },
      { s1: 10,t1: 'UCF',          s2: 7,  t2: 'UCLA',           w: 1, tags: ['TZ FLIP — UCLA −9%'] },
      { s1: 2, t1: 'UConn',        s2: 15, t2: 'Furman',         w: 1, tags: [] },
    ],
    r2: [
      { t1: 'Duke',         t2: 'Ohio St.',     w: 1, tags: [] },
      { t1: "St. John's",   t2: 'Kansas',       w: 1, tags: ["St. John's KP#17, Kansas overseeded −5"] },
      { t1: 'Michigan St.', t2: 'Louisville',   w: 1, tags: [] },
      { t1: 'UConn',        t2: 'UCF',          w: 1, tags: [] },
    ],
    s16: [
      { t1: 'Duke',         t2: "St. John's",   w: 1, tags: ["St. John's −9% (SD→DC)"] },
      { t1: 'Michigan St.', t2: 'UConn',        w: 1, tags: ['UConn fringe-slow'] },
    ],
    e8: { t1: 'Duke', t2: 'Michigan St.', w: 1, note: 'Duke to Final Four with 0% total penalty' },
  },
  west: {
    region: 'West', site: 'San Jose, CA (PT)', winner: 'Arizona',
    r1: [
      { s1: 1, t1: 'Arizona',      s2: 16, t2: 'Long Island',    w: 1, tags: [] },
      { s1: 9, t1: 'Utah St.',     s2: 8,  t2: 'Villanova',      w: 1, tags: ['Villanova −9%+ Hodge out'] },
      { s1: 5, t1: 'Wisconsin',    s2: 12, t2: 'High Point',     w: 1, tags: ['Both going to PT'] },
      { s1: 4, t1: 'Arkansas',     s2: 13, t2: 'Hawaii',         w: 1, tags: ['Hawaii −9%'] },
      { s1: 6, t1: 'BYU',         s2: 11, t2: 'NC St./Texas',   w: 1, tags: [] },
      { s1: 3, t1: 'Gonzaga',      s2: 14, t2: 'Kennesaw St.',   w: 1, tags: ['Kennesaw −6% final slot'] },
      { s1: 10,t1: 'Missouri',     s2: 7,  t2: 'Miami FL',      w: 1, tags: ['Miami FL −2% final slot'] },
      { s1: 2, t1: 'Purdue',       s2: 15, t2: 'Queens',         w: 1, tags: [] },
    ],
    r2: [
      { t1: 'Arizona',  t2: 'Utah St.',   w: 1, tags: [] },
      { t1: 'Arkansas', t2: 'Wisconsin',  w: 1, tags: ['Arkansas KP#14'] },
      { t1: 'Gonzaga',  t2: 'BYU',        w: 1, tags: ['Gonzaga Trapezoid'] },
      { t1: 'Purdue',   t2: 'Missouri',   w: 1, tags: [] },
    ],
    s16: [
      { t1: 'Arizona', t2: 'Arkansas', w: 1, tags: ['Arkansas CT→PT −6%'] },
      { t1: 'Gonzaga', t2: 'Purdue',   w: 1, tags: ['Purdue ET→PT −6% final'] },
    ],
    e8: { t1: 'Arizona', t2: 'Gonzaga', w: 1, note: 'Arizona to Final Four — PT perfect path, but −9% awaits in Indy' },
  },
  south: {
    region: 'South', site: 'Houston, TX (CT)', winner: 'Houston',
    r1: [
      { s1: 1, t1: 'Florida',       s2: 16, t2: 'Lehigh/PVAMU',  w: 1, tags: [] },
      { s1: 9, t1: 'Iowa',          s2: 8,  t2: 'Clemson',       w: 1, tags: ['Clemson overseeded, Welling out'] },
      { s1: 5, t1: 'Vanderbilt',    s2: 12, t2: 'McNeese',       w: 1, tags: ['Vanderbilt underseeded +5'] },
      { s1: 4, t1: 'Nebraska',      s2: 13, t2: 'Troy',          w: 1, tags: [] },
      { s1: 10,t1: 'Texas A&M',     s2: 7,  t2: "Saint Mary's",  w: 1, tags: ["TZ FLIP — Saint Mary's −6%"] },
      { s1: 2, t1: 'Houston',       s2: 15, t2: 'Idaho',         w: 1, tags: ['Idaho −6%'] },
      { s1: 6, t1: 'N. Carolina',   s2: 11, t2: 'VCU',           w: 1, tags: [] },
      { s1: 3, t1: 'Illinois',      s2: 14, t2: 'Penn',          w: 1, tags: ['Illinois −3% final slot'] },
    ],
    r2: [
      { t1: 'Florida',    t2: 'Iowa',      w: 1, tags: [] },
      { t1: 'Vanderbilt', t2: 'Nebraska',  w: 1, tags: ['Vanderbilt KP#12'] },
      { t1: 'Houston',    t2: 'Texas A&M', w: 1, tags: [] },
      { t1: 'Illinois',   t2: 'N. Carolina', w: 1, tags: ['Illinois KP#7'] },
    ],
    s16: [
      { t1: 'Florida',  t2: 'Vanderbilt', w: 1, tags: ['Florida −2% ET→CT'] },
      { t1: 'Houston',  t2: 'Illinois',   w: 1, tags: ['Houston home region 0%'] },
    ],
    e8: { t1: 'Houston', t2: 'Florida', w: 1, note: 'BIGGEST UPSET — Houston home regional (0%) vs Florida −2% final. KP#4 vs #5. Florida fringe-trap.' },
  },
  midwest: {
    region: 'Midwest', site: 'Chicago, IL (CT)', winner: 'Michigan',
    r1: [
      { s1: 1, t1: 'Michigan',   s2: 16, t2: 'HOW/UMBC',      w: 1, tags: [] },
      { s1: 8, t1: 'Georgia',    s2: 9,  t2: 'Saint Louis',   w: 1, tags: ['Saint Louis CT→ET −3%'] },
      { s1: 5, t1: 'Texas Tech', s2: 12, t2: 'Akron',         w: 1, tags: ['Texas Tech −3%'] },
      { s1: 4, t1: 'Alabama',    s2: 13, t2: 'Hofstra',       w: 1, tags: ['Alabama −3%'] },
      { s1: 6, t1: 'Tennessee',  s2: 11, t2: 'SMU/Miami OH',  w: 1, tags: ['SMU −3%'] },
      { s1: 3, t1: 'Virginia',   s2: 14, t2: 'Wright St.',    w: 1, tags: [] },
      { s1: 2, t1: 'Iowa St.',   s2: 15, t2: 'Tenn. St.',     w: 1, tags: [] },
      { s1: 7, t1: 'Kentucky',   s2: 10, t2: 'Santa Clara',   w: 1, tags: ['Santa Clara PT→CT −6%'] },
    ],
    r2: [
      { t1: 'Michigan',  t2: 'Georgia',    w: 1, tags: [] },
      { t1: 'Alabama',   t2: 'Texas Tech', w: 1, tags: ['Toppin still out'] },
      { t1: 'Virginia',  t2: 'Tennessee',  w: 1, tags: ['Virginia KP#9 blended'] },
      { t1: 'Iowa St.',  t2: 'Kentucky',   w: 1, tags: ['Iowa St. Trapezoid'] },
    ],
    s16: [
      { t1: 'Michigan', t2: 'Alabama',  w: 1, tags: ['Michigan −2% still better. Alabama 356th defense'] },
      { t1: 'Iowa St.', t2: 'Virginia', w: 1, tags: ['Virginia −2% ET→CT final'] },
    ],
    e8: { t1: 'Michigan', t2: 'Iowa St.', w: 1, note: "Michigan to Final Four. KP#3 vs KP#8. Michigan defense (#2 nationally, 91.0 adj eff.) is decisive." },
  },
};

// Merged picks — each entry has a type group, an update badge, round/region metadata,
// a short headline reason, and a full analytical body paragraph.
const PICKS = [
  // ── TIME ZONE UPSETS ─────────────────────────────────────────────────────
  {
    group: 'tz', badge: 'FLIP', round: 'R1', region: 'East',
    pick: 'UCF over UCLA',
    reason: 'UCLA PT→ET −9% · spread only −2.5 · mathematically clean reversal',
    body: "UCLA (Pacific) travels cross-country to Philadelphia (Eastern) — a full 3-zone eastward jump, carrying a 9% output penalty. UCF is home time zone (Eastern), zero penalty. The opening line was only −2.5 for UCLA. With UCLA effectively operating at 91% of their statistical output, this flips cleanly to UCF. One of the highest-confidence TZ picks in the bracket.",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'R1', region: 'South',
    pick: "Texas A&M over Saint Mary's",
    reason: "Saint Mary's PT→CT −6% · Texas A&M home TZ (CT=CT) · 7/10 matchup on the margin",
    body: "Saint Mary's (Moraga, CA — Pacific) travels 2 time zones east to Oklahoma City (Central), absorbing a 6% output penalty. Texas A&M (College Station, TX) is Central time — same zone as the site, zero penalty. This is a 7-seed vs 10-seed matchup where that 6% edge is the entire margin. Texas A&M advances and faces Houston in Round 2 (where Houston wins).",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'R1', region: 'East',
    pick: 'Ohio St. over TCU',
    reason: 'TCU CT→ET −3% · already a coin-flip 8/9 — penalty breaks the tie',
    body: "TCU (Fort Worth, TX — Central) travels east to Greenville (Eastern), picking up a 3% penalty. Ohio St. is Eastern, zero penalty. This was going to be close regardless — 8/9 games are historically near 50/50 — but the TZ math cleanly tips it to Ohio St. Duke beats them in Round 2 without issue.",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'R1', region: 'West',
    pick: 'Utah St. over Villanova',
    reason: 'Villanova ET→PT −9% + Matthew Hodge (starting guard) out',
    body: "Villanova (Philadelphia, PA — Eastern) travels all the way west to San Diego (Pacific) — a 3-zone westward jump in the final broadcast slot, carrying a 9% output penalty. On top of that, Matthew Hodge (starting guard, 9 Pts/4 Reb) is out. Utah St. is a Mountain time team traveling to Pacific — just 1 zone, not in the final slot, so only a −3% hit. The net differential is enormous. Utah St. wins comfortably.",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'R1', region: 'West',
    pick: 'Missouri over Miami FL',
    reason: "Miami FL ET→CT −2% final broadcast slot · St. Louis is Miami's home turf on paper, not really",
    body: "Miami FL (Coral Gables — Eastern) travels to St. Louis (Central) in the final broadcast slot — triggering the 2% westward penalty. Missouri (Columbia, MO) is Central, zero penalty at a home-state site. This is the smallest flip in the bracket — 2% — but Miami FL's blended analytics rank (#31) vs Missouri's (#46) was already close enough for the penalty to decide it.",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'R1', region: 'Midwest',
    pick: 'Georgia over Saint Louis',
    reason: 'Saint Louis CT→ET −3% final slot · Georgia ET home TZ at Buffalo',
    body: "Saint Louis (Missouri — Central) travels east to Buffalo (Eastern) for the final evening game, absorbing a 3% penalty in the final broadcast slot. Georgia (Athens, GA) is Eastern — zero penalty. The blended rankings have Georgia at #32 vs Saint Louis at #41, so this was chalky to begin with. The TZ edge just makes it more comfortable.",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'R1', region: 'Midwest',
    pick: 'Kentucky over Santa Clara',
    reason: 'Santa Clara PT→CT −6% · two zones east · Kentucky ET travels to CT (west, not final slot — 0%)',
    body: "Santa Clara (Silicon Valley — Pacific) travels two zones east to St. Louis (Central), eating a 6% output penalty with no mitigating factors. Kentucky (Lexington — Eastern) is actually traveling *west* to St. Louis, but since it's not the final broadcast slot, the westward rule doesn't trigger. Net: Santa Clara at −6%, Kentucky at 0%. The bracket has Kentucky winning this comfortably.",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'S16', region: 'West',
    pick: 'Gonzaga over Purdue',
    reason: 'Purdue ET→PT −6% final slot at San Jose · Gonzaga 0% (home PT) · Trapezoid-qualified',
    body: "Purdue (West Lafayette, IN — Eastern) travels three zones west to San Jose (Pacific) for the Sweet 16 in what will be an evening game — triggering the 6% westward final-slot penalty. Gonzaga (Spokane, WA — Pacific) is home time zone, zero penalty. On top of that, Gonzaga is a legitimate Trapezoid of Excellence team (KP#10), while Purdue plays historically slow (364th pace). Purdue has the #1 adjusted offensive efficiency in the nation, making them a genuine dark horse — but the path kills them.",
  },
  {
    group: 'tz', badge: 'FLIP', round: 'E8', region: 'South',
    pick: 'Houston over Florida',
    reason: 'Florida ET→CT −2% final slot · Houston home regional (0%) · KP#5 vs KP#4 · Florida fringe-trap',
    body: "This is the biggest upset in the bracket and the most analytically loaded pick. Houston's regional site is literally their home city — they play Round 1/2 in Oklahoma City (CT, same zone), then the Elite Eight in Houston, TX (CT, still home). Zero accumulated TZ penalty through five rounds. Florida (Gainesville — Eastern) travels one zone west to Houston in what will be the final evening game, triggering the 2% westward penalty. The KenPom gap is razor thin: Florida is #4, Houston is #5 in the blended rankings. Florida is flagged as 'Fringe Trap — too fast' in the Trapezoid model. Houston's defense is elite (#5 adj. def. eff.). The TZ advantage plus defensive profile plus Trapezoid flag tips this to Houston.",
  },

  // ── ANALYTICS UPSETS ─────────────────────────────────────────────────────
  {
    group: 'analytics', badge: 'UPGRADE', round: 'R1', region: 'East',
    pick: "St. John's over N. Iowa",
    reason: "St. John's underseeded +3 · KP#15 as a 5-seed · N. Iowa is 68th in adjusted offensive efficiency",
    body: "St. John's (Big East) is the 15th-best team in the blended multi-system rankings playing as a 5-seed — underseeded by 3 positions on the S-curve. Northern Iowa ranks 68th in adjusted offensive efficiency among the 68 tournament teams (second-worst in the field). This is a comfortable first-round win.",
  },
  {
    group: 'analytics', badge: 'DOWNGRADE', round: 'R2', region: 'East',
    pick: "St. John's over Kansas",
    reason: "St. John's underseeded +3 (KP#15) · Kansas overseeded −5 (KP#21 as 4-seed) · biggest seed error in the field",
    body: "Kansas is overseeded by 5 positions on the S-curve — the largest overseeding error for a top-4 seed. The committee placed them 15th on the S-curve; analytics say 20th. St. John's, meanwhile, is underseeded by 3 (expected 15th, placed 18th). In reality these two teams are much closer to equals than the 4-vs-5 matchup implies, and St. John's has the better blended profile. Kansas exits in Round 2.",
  },
  {
    group: 'analytics', badge: 'UPGRADE', round: 'R2', region: 'South',
    pick: 'Vanderbilt to Sweet 16',
    reason: 'Most underseeded team in the field (+5 S-diff) · KP#12 playing as a 5-seed · beats Nebraska in R2',
    body: "S-curve analysis from the Eisenberg Guide confirms Vanderbilt is the single most underseeded team in the entire 68-team field. Their expected S-curve position is 12th; the committee placed them 17th — nearly a full seed line of error. The blended multi-system rank is #13 overall (BPI 14, EM 14, KPI 9, NET 13, KenPom 12). They're a 5-seed with a 2-seed's analytics profile. Nebraska (their Round 2 opponent) is overseeded by 3 on the S-curve and has a worse blended rank. Vanderbilt reaches the Sweet 16 with high conviction.",
  },
  {
    group: 'analytics', badge: 'CONFIRM', round: 'R1', region: 'South',
    pick: 'Iowa over Clemson',
    reason: 'Clemson overseeded −2 · Carter Welling (starter) out · Iowa underseeded +3 · TZ only −3%',
    body: "Iowa absorbs a −3% east penalty traveling to Tampa (CT→ET), which initially looks like a concern. But Clemson's starting forward Carter Welling is out with an ACC tourney injury, Clemson is overseeded by 2 on the S-curve, and Iowa is underseeded by 3. The Eisenberg Guide's opening line data also shows Clemson is a slow-paced team with mediocre defense — not a great matchup profile. The injury and S-curve gap comfortably outweigh the TZ penalty. Iowa advances.",
  },
  {
    group: 'analytics', badge: 'DOWNGRADE', round: 'S16', region: 'Midwest',
    pick: 'Michigan over Alabama',
    reason: 'Alabama 356th defense nationally · overseeded −3 · CT→ET −3% · Michigan #2 adj. def. eff.',
    body: "Alabama allows 83.5 PPG — dead last (356th nationally) among all 68 tournament teams. For context, that's historically bad defense for a 4-seed in any era. They're also overseeded by 3 on the S-curve and absorb a −3% TZ penalty going to Tampa. Their offense is real (fastest pace, #3 adj. off. eff., Aden Holloway and Louis Philon are legitimate scorers) but Michigan's #2 adjusted defensive efficiency (91.0) is purpose-built to neutralize exactly that style. Alabama's run ends in the Sweet 16.",
  },
  {
    group: 'analytics', badge: 'CONFIRM', round: 'R2', region: 'South',
    pick: 'Illinois over N. Carolina',
    reason: 'Illinois KP#7 · stronger analytics profile than their 3-seed suggests · UNC overseeded',
    body: "Illinois ranks 7th in the blended multi-system rankings — better than their 3-seed implies — with strong adjusted offensive efficiency (#2 nationally at 131.9) and a solid defensive profile. North Carolina (KP#24 blended) is a 6-seed that plays solid basketball but doesn't have the analytics profile to beat Illinois in a second-round game. Illinois advances to the Sweet 16 where they face Houston.",
  },
  {
    group: 'analytics', badge: 'CONFIRM', round: 'R2', region: 'Midwest',
    pick: 'Virginia over Tennessee',
    reason: 'Virginia KP#9 blended · underseeded +3 on S-curve · should be a 2-seed',
    body: "Virginia's blended multi-system rank is #9 overall — dramatically better than a 3-seed. The S-curve analysis has them underseeded by 3 positions (expected 9th, placed 12th). Their defensive efficiency is elite. Tennessee (22-11 record, KP#16 blended) is the weaker team here despite equivalent seeding. Virginia advances to the Sweet 16 where Iowa St. edges them.",
  },

  // ── CONFIRMED CHALK ───────────────────────────────────────────────────────
  {
    group: 'confirm', badge: 'LOCKED', round: 'FF', region: 'East',
    pick: 'Duke wins the championship',
    reason: '#1 in all 8 systems · 0% TZ penalty every round · best defense in country (90.8)',
    body: "Duke is ranked #1 in every one of the 8 metric systems used in the Eisenberg Guide: BPI (1), Evan Miya (1), KPI (1), NCAA NET (1), KenPom (1), SOR (3), T-Rank (1), WAB (2). They hold the best adjusted defensive efficiency in the nation at 90.8. Cooper Boozer scores at 22.5 PPG with 29.6% usage. Critically, Duke plays every single game in Eastern time — Greenville (ET), Washington D.C. (ET), Indianapolis (ET). Zero accumulated travel penalty from first round through the national championship. Their Final Four opponent Arizona absorbs a brutal −9% hit stepping off the plane in Indianapolis. The case is airtight.",
  },
  {
    group: 'confirm', badge: 'LOCKED', round: 'FF', region: 'Midwest',
    pick: 'Michigan to the Final Four',
    reason: '#2 in all 8 systems · #2 adj. def. eff. (91.0) · beats Alabama (worst defense) and Iowa St.',
    body: "Michigan is #2 in the blended multi-system rankings across every metric. Their adjusted defensive efficiency of 91.0 is second only to Duke in the entire field. They face Alabama in the Sweet 16 — the team with the worst defense in the tournament (356th nationally) — and Iowa St. in the Elite Eight. The Chicago regional is one zone west for Michigan (−2% in the final slot), but that's a manageable penalty against inferior opponents. Michigan reaches Indianapolis at 0% penalty for the Final Four.",
  },
  {
    group: 'confirm', badge: 'WATCH', round: 'FF', region: 'West',
    pick: 'Arizona to the Final Four (then −9% in Indy)',
    reason: 'Perfect PT path all the way — then the cliff: PT→ET −9% vs Duke at 0%',
    body: "Arizona's path through the West is perfectly aligned: Tucson (Pacific), San Diego (Pacific), San Jose (Pacific). Zero accumulated travel penalty through six rounds. They're #2 in the blended rankings, #1 in SOR. Then they board a plane to Indianapolis (Eastern) and absorb a 9% output penalty for the national semifinal against Duke — who has been at 100% output since day one. The analytics gap between Duke and Arizona is not large enough to survive a 9-point swing. Arizona is eliminated in the semis.",
  },
  {
    group: 'confirm', badge: 'WATCH', round: 'FF', region: 'South',
    pick: 'Houston to the Final Four',
    reason: 'Home regional (0% accumulated) · KP#5 · elite defense · only −3% at Final Four',
    body: "Houston's structural TZ advantage is the most underappreciated factor in the bracket. Oklahoma City (Round 1/2) is Central time — same zone as Houston. Their regional site is literally Houston, TX. Zero accumulated TZ penalty through five rounds. They pick up just −3% heading to Indianapolis for the Final Four — the smallest penalty among the four Final Four teams. For a KP#5 team with the 5th-best adjusted defensive efficiency in the field, that's a significant structural edge. They beat Florida (who pays −2% at the Houston regional) in the Elite Eight and face Michigan in Indianapolis.",
  },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const SURFACE_CLASS =
  'rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,24,0.96),rgba(8,12,18,0.88))] shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur';

function SurfaceCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${SURFACE_CLASS} ${className}`}>{children}</div>;
}

function Tag({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-sky-400/20 bg-sky-500/15 text-sky-200',
    green: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200',
    red: 'border-rose-400/20 bg-rose-500/15 text-rose-200',
    amber: 'border-amber-400/20 bg-amber-500/15 text-amber-200',
    gray: 'border-white/10 bg-white/[0.06] text-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
        colorClasses[color] ?? colorClasses.gray
      }`}
    >
      {children}
    </span>
  );
}

function TeamRow({
  seed,
  name,
  win,
  tags = [],
}: {
  seed?: number;
  name: string;
  win: boolean;
  tags?: string[];
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 px-3 py-3 sm:flex-nowrap ${
        win
          ? 'border-l-2 border-emerald-400 bg-emerald-500/[0.08]'
          : 'border-l-2 border-transparent bg-white/[0.03]'
      }`}
    >
      <span className="w-5 shrink-0 text-right text-[11px] font-medium text-slate-500">
        {seed ?? ''}
      </span>
      <span className={`min-w-0 flex-1 text-sm font-semibold ${win ? 'text-white' : 'text-slate-400'}`}>
        {name}
      </span>
      {tags.length > 0 ? (
        <div className="flex flex-wrap justify-end gap-1.5">
          {tags.map((tag, index) => (
            <Tag key={`${tag}-${index}`} color="amber">
              {tag}
            </Tag>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Matchup({
  s1,
  t1,
  s2,
  t2,
  w,
  tags = [],
}: {
  s1: number;
  t1: string;
  s2: number;
  t2: string;
  w: number;
  tags?: string[];
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
      <TeamRow seed={s1} name={t1} win={w === 1} tags={w === 1 ? tags : []} />
      <div className="h-px bg-white/10" />
      <TeamRow seed={s2} name={t2} win={w === 2} tags={w === 2 ? tags : []} />
    </div>
  );
}

function Matchup2({
  t1,
  t2,
  w,
  tags = [],
}: {
  t1: string;
  t2: string;
  w: number;
  tags?: string[];
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
      <TeamRow name={t1} win={w === 1} tags={w === 1 ? tags : []} />
      <div className="h-px bg-white/10" />
      <TeamRow name={t2} win={w === 2} tags={w === 2 ? tags : []} />
    </div>
  );
}

function RoundLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-5 border-b border-amber-400/10 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
      {children}
    </p>
  );
}

function SiteLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 mt-3 text-xs italic text-slate-500">{children}</p>;
}

function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-slate-300">
      {children}
    </div>
  );
}

function TabBar({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={`min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            active === tab
              ? 'border-amber-400/30 bg-amber-400/15 text-amber-200'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function StatCell({
  val,
  isRank,
  highlight,
}: {
  val: number;
  isRank?: boolean;
  highlight?: boolean;
}) {
  const textClass = highlight
    ? 'text-amber-300'
    : isRank && val <= 5
      ? 'text-emerald-300'
      : 'text-slate-300';

  return <td className={`px-2 py-3 text-right text-xs font-medium tabular-nums ${textClass}`}>{val}</td>;
}

// ─── SECTIONS ────────────────────────────────────────────────────────────────

function RankingsSection() {
  return (
    <div className="space-y-4">
      <p className="max-w-[72ch] text-sm leading-6 text-slate-400">
        Blended average across BPI, Evan Miya, KPI, NET, KenPom, SOR, T-Rank, and WAB, excluding the minimum and maximum system values.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-[920px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Rk', 'Team', 'Conf', 'Record', 'Avg', 'BPI', 'EM', 'KPI', 'NET', 'POM', 'SOR', 'TR', 'WAB', 'Trapezoid', 'Seed', 'Odds'].map((heading) => (
                <th
                  key={heading}
                  className={`px-2 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 ${
                    heading === 'Team' || heading === 'Trapezoid' ? 'text-left' : 'text-right'
                  }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RANKINGS.map((ranking, index) => (
              <tr
                key={ranking.team}
                className={`border-b border-white/5 ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
              >
                <td className="px-2 py-3 text-xs text-slate-500">{ranking.rank}</td>
                <td className="px-2 py-3 text-sm font-semibold text-white">{ranking.team}</td>
                <td className="px-2 py-3 text-xs text-slate-400">{ranking.conf}</td>
                <td className="px-2 py-3 text-xs text-slate-400">{ranking.record}</td>
                <StatCell val={ranking.avg} highlight={ranking.avg <= 3} />
                {[ranking.bpi, ranking.em, ranking.kpi, ranking.net, ranking.pom, ranking.sor, ranking.tr, ranking.wab].map((value, statIndex) => (
                  <StatCell key={`${ranking.team}-${statIndex}`} val={value} isRank />
                ))}
                <td className="px-2 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                      ranking.trap === 'Trapezoid'
                        ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200'
                        : ranking.trap === '—'
                          ? 'border-white/10 bg-white/[0.04] text-slate-500'
                          : 'border-amber-400/20 bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    {ranking.trap}
                  </span>
                </td>
                <td className="px-2 py-3 text-right text-xs text-slate-400">{ranking.seed}</td>
                <td className="px-2 py-3 text-right text-xs font-semibold tabular-nums text-amber-300">
                  {ranking.odds}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SCurveSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {[
        { label: 'Underseeded — got a raw deal', data: SCURVE.under, positive: true },
        { label: 'Overseeded — got a gift', data: SCURVE.over, positive: false },
      ].map(({ label, data, positive }) => (
        <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className={`mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
            {label}
          </p>
          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.team}
                className="flex flex-wrap items-center gap-3 rounded-[18px] border border-white/8 bg-black/10 px-3 py-3"
              >
                <span className="min-w-[110px] text-sm font-semibold text-white">{item.team}</span>
                <span className="flex-1 text-xs text-slate-400">
                  {item.seed}-seed · {item.exp}→{item.act}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    positive
                      ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200'
                      : 'border-rose-400/20 bg-rose-500/15 text-rose-200'
                  }`}
                >
                  {item.diff}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function InjuriesSection() {
  return (
    <div className="space-y-3">
      {INJURIES.map((injury) => (
        <div
          key={injury.player}
          className="flex gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/12 text-sm font-semibold text-amber-200">
            {injury.seed}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {injury.team} — {injury.player}
            </p>
            <p className="mt-1 text-sm text-slate-300">{injury.line}</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">{injury.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TZSection() {
  const flips = TZ_IMPACTS.filter((impact) => impact.note.startsWith('FLIP'));
  const others = TZ_IMPACTS.filter((impact) => !impact.note.startsWith('FLIP'));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { value: '3', label: 'Round 1 flips from TZ' },
          { value: '−9%', label: "Arizona's Final Four penalty" },
          { value: '0%', label: "Duke's total penalty" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4"
          >
            <p className="text-2xl font-semibold tabular-nums text-amber-300">{metric.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-300">
          Bracket Flips
        </p>
        <div className="space-y-3">
          {flips.map((impact) => (
            <div
              key={`${impact.team}-${impact.site}`}
              className="grid gap-2 rounded-[22px] border border-rose-400/15 bg-rose-500/[0.07] px-4 py-4 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)_auto]"
            >
              <span className="text-sm font-semibold text-rose-200">{impact.team}</span>
              <span className="text-xs leading-6 text-slate-300">
                {impact.home} → {impact.site} · {impact.zones} zone{impact.zones > 1 ? 's' : ''} {impact.direction}
                {impact.final ? ' · final slot' : ''}
              </span>
              <span className="text-sm font-semibold tabular-nums text-rose-200">{impact.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Other Impacts
        </p>
        <div className="space-y-3">
          {others.map((impact) => (
            <div
              key={`${impact.team}-${impact.site}`}
              className="grid gap-2 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 lg:grid-cols-[minmax(0,120px)_minmax(0,140px)_minmax(0,1fr)_auto]"
            >
              <span className="text-sm font-medium text-white">{impact.team}</span>
              <span className="text-xs text-slate-400">
                {impact.home} → {impact.site.split(' ')[0]}
              </span>
              <span className="text-xs leading-6 text-slate-400">{impact.note}</span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  impact.pct <= -6
                    ? 'text-rose-300'
                    : impact.pct <= -3
                      ? 'text-amber-300'
                      : 'text-slate-300'
                }`}
              >
                {impact.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RegionData {
  region: string;
  site: string;
  winner: string;
  r1: { s1: number; t1: string; s2: number; t2: string; w: number; tags: string[] }[];
  r2: { t1: string; t2: string; w: number; tags: string[] }[];
  s16: { t1: string; t2: string; w: number; tags: string[] }[];
  e8: { t1: string; t2: string; w: number; note: string };
}

function RegionBracket({ data }: { data: RegionData }) {
  const siteMap: Record<string, { r1a: string; r1b: string; r1c: string; r1d: string }> = {
    east: { r1a: 'Greenville, SC (ET)', r1b: 'San Diego, CA (PT)', r1c: 'Buffalo, NY (ET)', r1d: 'Philadelphia, PA (ET)' },
    west: { r1a: 'San Diego, CA (PT)', r1b: 'Portland, OR (PT)', r1c: 'Portland, OR (PT)', r1d: 'St. Louis, MO (CT)' },
    south: { r1a: 'Tampa, FL (ET)', r1b: 'Oklahoma City, OK (CT)', r1c: 'Oklahoma City, OK (CT)', r1d: 'Greenville, SC (ET)' },
    midwest: { r1a: 'Buffalo, NY (ET)', r1b: 'Tampa, FL (ET)', r1c: 'Philadelphia, PA (ET)', r1d: 'St. Louis, MO (CT)' },
  };

  const sites = siteMap[data.region.toLowerCase()] ?? { r1a: '', r1b: '', r1c: '', r1d: '' };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <Tag color="gray">{data.region}</Tag>
        <span>Regional site:</span>
        <span className="font-semibold text-amber-200">{data.site}</span>
        <span className="text-slate-500">·</span>
        <span>Advancing:</span>
        <span className="font-semibold text-emerald-200">{data.winner}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_0.84fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <RoundLabel>Round 1</RoundLabel>
          <SiteLabel>{sites.r1a}</SiteLabel>
          {data.r1.slice(0, 2).map((matchup, index) => (
            <Matchup key={`r1a-${index}`} {...matchup} />
          ))}
          <SiteLabel>{sites.r1b}</SiteLabel>
          {data.r1.slice(2, 4).map((matchup, index) => (
            <Matchup key={`r1b-${index}`} {...matchup} />
          ))}
          <SiteLabel>{sites.r1c}</SiteLabel>
          {data.r1.slice(4, 6).map((matchup, index) => (
            <Matchup key={`r1c-${index}`} {...matchup} />
          ))}
          <SiteLabel>{sites.r1d}</SiteLabel>
          {data.r1.slice(6, 8).map((matchup, index) => (
            <Matchup key={`r1d-${index}`} {...matchup} />
          ))}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <RoundLabel>Round 2</RoundLabel>
          {data.r2.map((matchup, index) => (
            <Matchup2 key={`r2-${index}`} {...matchup} />
          ))}
          <RoundLabel>Sweet 16 — {data.site}</RoundLabel>
          {data.s16.map((matchup, index) => (
            <Matchup2 key={`s16-${index}`} {...matchup} />
          ))}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <RoundLabel>Elite Eight</RoundLabel>
          <Matchup2 t1={data.e8.t1} t2={data.e8.t2} w={1} tags={['Final Four']} />
          <NoteBox>{data.e8.note}</NoteBox>
        </div>
      </div>
    </div>
  );
}

function PicksSection() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const groupMeta: Record<
    string,
    {
      label: string;
      sublabel: string;
      headingClass: string;
      openSurface: string;
      openBorder: string;
    }
  > = {
    tz: {
      label: 'Time Zone Upsets',
      sublabel: 'Bracket reversals driven by travel penalty.',
      headingClass: 'text-rose-300',
      openSurface: 'bg-rose-500/[0.07]',
      openBorder: 'border-rose-400/15',
    },
    analytics: {
      label: 'Analytics Upsets',
      sublabel: 'KenPom, S-curve, and Trapezoid-driven calls.',
      headingClass: 'text-sky-300',
      openSurface: 'bg-sky-500/[0.06]',
      openBorder: 'border-sky-400/15',
    },
    confirm: {
      label: 'Final Four Picks',
      sublabel: 'Chalk calls the model supports strongly.',
      headingClass: 'text-emerald-300',
      openSurface: 'bg-emerald-500/[0.06]',
      openBorder: 'border-emerald-400/15',
    },
  };

  const badgeClasses: Record<string, string> = {
    FLIP: 'border-rose-400/20 bg-rose-500/15 text-rose-200',
    UPGRADE: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200',
    DOWNGRADE: 'border-rose-400/20 bg-rose-500/15 text-rose-200',
    CONFIRM: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200',
    LOCKED: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-200',
    WATCH: 'border-amber-400/20 bg-amber-500/15 text-amber-200',
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { value: '9', sub: 'TZ-driven picks', tone: 'text-rose-300' },
          { value: '7', sub: 'Analytics-driven picks', tone: 'text-sky-300' },
          { value: '4', sub: 'Final Four picks', tone: 'text-emerald-300' },
          { value: '0%', sub: "Duke's total TZ penalty", tone: 'text-amber-300' },
        ].map((metric) => (
          <div key={metric.sub} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
            <p className={`text-2xl font-semibold tabular-nums ${metric.tone}`}>{metric.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{metric.sub}</p>
          </div>
        ))}
      </div>

      {(['tz', 'analytics', 'confirm'] as const).map((group) => {
        const meta = groupMeta[group];
        const items = PICKS.filter((pick) => pick.group === group);

        return (
          <div key={group} className="space-y-3">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${meta.headingClass}`}>
                {meta.label}
              </p>
              <p className="mt-1 text-sm text-slate-400">{meta.sublabel}</p>
            </div>

            {items.map((item, index) => {
              const id = `${group}-${index}`;
              const isOpen = expanded === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    isOpen
                      ? `${meta.openSurface} ${meta.openBorder}`
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${badgeClasses[item.badge] ?? badgeClasses.CONFIRM}`}>
                      {item.badge}
                    </span>
                    {item.round ? <Tag color="gray">{item.round}</Tag> : null}
                    {item.region ? <Tag color="gray">{item.region}</Tag> : null}
                    <span className="min-w-0 flex-1 text-sm font-semibold text-white">{item.pick}</span>
                    <span className={`text-lg text-slate-500 transition ${isOpen ? 'rotate-90' : ''}`}>›</span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-400">{item.reason}</p>

                  {isOpen ? (
                    <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-slate-300">
                      {item.body}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Legend</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { label: 'FLIP', className: badgeClasses.FLIP, desc: 'Time zone penalty reversal' },
            { label: 'UPGRADE', className: badgeClasses.UPGRADE, desc: 'Better than their seeding' },
            { label: 'DOWNGRADE', className: badgeClasses.DOWNGRADE, desc: 'Worse than their seeding' },
            { label: 'WATCH', className: badgeClasses.WATCH, desc: 'Notable risk or edge' },
            { label: 'LOCKED', className: badgeClasses.LOCKED, desc: 'High-conviction chalk' },
          ].map((legendItem) => (
            <div key={legendItem.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-2">
              <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${legendItem.className}`}>
                {legendItem.label}
              </span>
              <span className="text-xs text-slate-400">{legendItem.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function MarchMadness2026() {
  const [mainTab, setMainTab] = useState('Bracket');
  const [bracketTab, setBracketTab] = useState('East');
  const [analyticsTab, setAnalyticsTab] = useState('Rankings');

  const bracketData: Record<string, RegionData> = {
    East: BRACKET.east,
    West: BRACKET.west,
    South: BRACKET.south,
    Midwest: BRACKET.midwest,
  };

  return (
    <section
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_20%),linear-gradient(180deg,#06090f_0%,#0a0f17_45%,#070b12_100%)] text-slate-100"
      aria-label="March Madness bracket analysis"
      data-testid="march-madness-shell"
    >
      <div className="mx-auto w-full max-w-[1480px] px-4 pb-20 pt-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <SurfaceCard className="relative overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_34%)]" />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  2026 NCAA Tournament · Data Analysis
                </p>
                <h1 className="mt-4 text-[clamp(2.5rem,5vw,4.75rem)] font-bold leading-[0.95] tracking-tight text-white">
                  March Madness
                  <span className="block text-amber-300">Bracket Analysis</span>
                </h1>
                <p className="mt-4 max-w-[64ch] text-sm leading-7 text-slate-300 sm:text-base">
                  A data-driven bracket built on KenPom metrics, the Trapezoid of Excellence, S-curve positioning, injury reports, and a time zone travel penalty model applied to every first-round game.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Tag color="amber">KenPom</Tag>
                  <Tag color="blue">S-Curve</Tag>
                  <Tag color="green">Time Zones</Tag>
                  <Tag color="gray">Injury Model</Tag>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="bg-[linear-gradient(135deg,rgba(8,18,12,0.96),rgba(9,18,28,0.92))] p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                National Champion Pick
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Duke Blue Devils</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                #1 in all 8 metric systems, a Trapezoid of Excellence team, and the cleanest travel path in the field at 0% total penalty.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ['32-2', 'Record'],
                  ['0%', 'TZ Penalty'],
                  ['90.8', 'Adj. Def. Eff. (#1)'],
                  ['+300', 'Title Odds'],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3"
                  >
                    <p className="font-mono text-xl font-semibold text-amber-300">{value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Tag color="amber">Final Four</Tag>
              <span className="text-sm text-slate-400">Indianapolis, IN (ET)</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { label: 'Semifinal 1', matchup: 'Duke vs Arizona', winner: 'Duke', note: 'Arizona −9% PT→ET' },
                { label: 'Semifinal 2', matchup: 'Michigan vs Houston', winner: 'Michigan', note: 'Houston −3% CT→ET' },
                { label: 'Championship', matchup: 'Duke vs Michigan', winner: 'Duke', note: 'Both ET, 0% penalty' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{item.matchup}</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-200">{item.winner}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div className="space-y-4">
            <TabBar
              tabs={['Bracket', 'Picks', 'Analytics', 'Time Zones']}
              active={mainTab}
              onChange={setMainTab}
              label="March Madness primary sections"
            />

            {mainTab === 'Bracket' ? (
              <SurfaceCard className="space-y-5 p-5 sm:p-6">
                <TabBar
                  tabs={['East', 'West', 'South', 'Midwest']}
                  active={bracketTab}
                  onChange={setBracketTab}
                  label="March Madness regions"
                />
                <RegionBracket data={bracketData[bracketTab]} />
              </SurfaceCard>
            ) : null}

            {mainTab === 'Picks' ? (
              <SurfaceCard className="p-5 sm:p-6">
                <PicksSection />
              </SurfaceCard>
            ) : null}

            {mainTab === 'Analytics' ? (
              <SurfaceCard className="space-y-5 p-5 sm:p-6">
                <TabBar
                  tabs={['Rankings', 'S-Curve', 'Injuries']}
                  active={analyticsTab}
                  onChange={setAnalyticsTab}
                  label="March Madness analytics sections"
                />
                {analyticsTab === 'Rankings' ? <RankingsSection /> : null}
                {analyticsTab === 'S-Curve' ? <SCurveSection /> : null}
                {analyticsTab === 'Injuries' ? <InjuriesSection /> : null}
              </SurfaceCard>
            ) : null}

            {mainTab === 'Time Zones' ? (
              <SurfaceCard className="p-5 sm:p-6">
                <TZSection />
              </SurfaceCard>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500">
            <span>Sources: KenPom · ESPN BPI · T-Rank · NCAA NET · Evan Miya · SOR · WAB · VSIN Lines</span>
            <span>2026 NCAA Tournament · Matt Eisenberg Guide</span>
          </div>
        </div>
      </div>
    </section>
  );
}
