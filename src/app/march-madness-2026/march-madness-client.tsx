"use client";

import Link from "next/link";
import { startTransition, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RegionBracket } from "./RegionBracket";
import {
  BRACKET,
  FINAL_FOUR_SUMMARY,
  INJURIES,
  MARCH_MADNESS_ARTICLE_SLUG,
  MARCH_MADNESS_FAQ,
  MARCH_MADNESS_POSTMORTEM_SLUG,
  MARCH_MADNESS_RESULT_NOTE,
  MARCH_MADNESS_UPDATED_LABEL,
  MODEL_PILLARS,
  PICKS,
  RANKINGS,
  SCURVE,
  TOP_UPSET_PICKS,
  TZ_IMPACTS,
  type EditorialCard,
  type PickEntry,
  type RegionData,
} from "./march-madness-data";
import {
  ANALYTICS_LABELS,
  buildMarchMadnessHref,
  REGION_LABELS,
  VIEW_LABELS,
  type MarchMadnessAnalytics,
  type MarchMadnessRegion,
  type MarchMadnessSearchState,
  type MarchMadnessView,
} from "./march-madness-state";
import "./march-madness.css";

const BADGE_TONE: Record<PickEntry["badge"], "red" | "green" | "amber" | "gray"> = {
  FLIP: "red",
  UPGRADE: "green",
  DOWNGRADE: "red",
  CONFIRM: "green",
  LOCKED: "green",
  WATCH: "amber",
};

const LEGEND_COPY: Record<PickEntry["badge"], string> = {
  FLIP: "Time zone penalty reversal",
  UPGRADE: "Better than their seeding",
  DOWNGRADE: "Worse than their seeding",
  WATCH: "Notable risk or edge",
  LOCKED: "High-conviction chalk",
  CONFIRM: "Analytics confirms the seed",
};

const EDITORIAL_TONE: Record<EditorialCard["color"], "red" | "amber" | "gray"> = {
  rose: "red",
  amber: "amber",
  blue: "gray",
};

const CHIP_CLASS: Record<"red" | "green" | "amber" | "gray", string> = {
  red: "c97-chip c97-chip-negative",
  green: "c97-chip c97-chip-positive",
  amber: "c97-chip c97-chip-warning",
  gray: "c97-chip",
};

function Tag({ children, color = "gray" }: { children: ReactNode; color?: "red" | "green" | "amber" | "gray" }) {
  return <span className={CHIP_CLASS[color]}>{children}</span>;
}

/** One of the column's upset picks: the call, why, and where the picks board picks it up. */
function UpsetCard({ card }: { card: EditorialCard }) {
  return (
    <li className="mm-upset">
      <Tag color={EDITORIAL_TONE[card.color]}>{card.eyebrow}</Tag>
      <h3 className="mm-h3">{card.title}</h3>
      <p className="mm-body">{card.reason}</p>
      <p className="mm-meta">
        {card.note} ·{" "}
        <Link href={card.href} className="mm-link">
          {card.cta}
        </Link>
      </p>
    </li>
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
    <div className="mm-matchup-row" data-winner={win ? "true" : "false"}>
      <span className="mm-matchup-seed">{seed ?? ""}</span>
      <span className="mm-matchup-name">{name}</span>
      {tags.length > 0 ? (
        <div className="mm-matchup-tags">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`} className="c97-chip">
              {tag}
            </span>
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
    <div className="mm-matchup">
      <TeamRow seed={s1} name={t1} win={w === 1} tags={w === 1 ? tags : []} />
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
    <div className="mm-matchup">
      <TeamRow name={t1} win={w === 1} tags={w === 1 ? tags : []} />
      <TeamRow name={t2} win={w === 2} tags={w === 2 ? tags : []} />
    </div>
  );
}

function RoundLabel({ children }: { children: ReactNode }) {
  return <p className="mm-round">{children}</p>;
}

function SiteLabel({ children }: { children: ReactNode }) {
  return <p className="mm-site">{children}</p>;
}

function TabBar<T extends string>({
  items,
  active,
  onChange,
  label,
}: {
  items: { label: string; value: T }[];
  active: T;
  onChange: (tab: T) => void;
  label: string;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    let nextIndex!: number;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = index === last ? 0 : index + 1;
        break;
      case "ArrowLeft":
        nextIndex = index === 0 ? last : index - 1;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    const list = event.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const next = list.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
    if (next) {
      next.focus();
      onChange(items[nextIndex].value);
    }
  };

  return (
    // Every TabBar sits in a flex stack, which spaces it with its gap.
    <div className="mm-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active === item.value}
          tabIndex={active === item.value ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function StatCell({ val, isRank, highlight }: { val: number; isRank?: boolean; highlight?: boolean }) {
  const isStrong = highlight || (isRank && val <= 5);
  const title = highlight
    ? "Top-3 average. This team rates among the strongest overall."
    : isRank && val <= 5
      ? "Top-5 by this system"
      : undefined;

  return (
    <td
      data-align="end"
      className="mm-num"
      style={{ color: isStrong ? "var(--c97-positive)" : "var(--c97-ink-2)" }}
      title={title}
      aria-label={title ? `${val} (${title})` : undefined}
    >
      {val}
    </td>
  );
}

const RANKINGS_COLUMNS = [
  "Rk",
  "Team",
  "Conf",
  "Record",
  "Avg",
  "BPI",
  "EM",
  "KPI",
  "NET",
  "POM",
  "SOR",
  "TR",
  "WAB",
  "Trapezoid",
  "Seed",
  "Odds",
];

function RankingsSection() {
  return (
    <div className="mm-stack-tight">
      <p className="mm-meta">
        Blended average across BPI, Evan Miya, KPI, NET, KenPom, SOR, T-Rank, and WAB, excluding the
        minimum and maximum system values.
      </p>
      <div className="mm-bracket-scroll" role="region" aria-label="Team rankings table (scrollable)" tabIndex={0}>
        <table className="c97-table" style={{ minWidth: "920px" }}>
          <thead>
            <tr>
              {RANKINGS_COLUMNS.map((heading) => (
                <th key={heading} scope="col" data-align={heading === "Team" || heading === "Trapezoid" ? undefined : "end"}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RANKINGS.map((ranking) => (
              <tr key={ranking.team}>
                <td className="mm-num">{ranking.rank}</td>
                <td style={{ fontWeight: 600 }}>{ranking.team}</td>
                <td>{ranking.conf}</td>
                <td className="mm-num">{ranking.record}</td>
                <StatCell val={ranking.avg} highlight={ranking.avg <= 3} />
                {[ranking.bpi, ranking.em, ranking.kpi, ranking.net, ranking.pom, ranking.sor, ranking.tr, ranking.wab].map(
                  (value, statIndex) => (
                    <StatCell key={`${ranking.team}-${statIndex}`} val={value} isRank />
                  )
                )}
                <td>
                  <span
                    className={
                      ranking.trap === "Trapezoid"
                        ? "c97-chip c97-chip-positive"
                        : ranking.trap === "—"
                          ? "c97-chip"
                          : "c97-chip c97-chip-warning"
                    }
                  >
                    {ranking.trap}
                  </span>
                </td>
                <td data-align="end" className="mm-num">
                  {ranking.seed}
                </td>
                <td data-align="end" className="mm-num" style={{ fontWeight: 600 }}>
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
    <div className="mm-pair">
      {[
        { label: "Underseeded teams", data: SCURVE.under, positive: true },
        { label: "Overseeded teams", data: SCURVE.over, positive: false },
      ].map(({ label, data, positive }) => (
        <div key={label}>
          <p className="mm-label" style={{ color: positive ? "var(--c97-positive)" : "var(--c97-negative)" }}>
            {label}
          </p>
          <ul className="mm-rows">
            {data.map((item) => (
              <li key={item.team} className="mm-scurve-row">
                <span className="mm-strong">{item.team}</span>
                <span className="mm-num mm-muted">
                  {item.seed}-seed &middot; {item.exp}&rarr;{item.act}
                </span>
                <span className={positive ? "c97-chip c97-chip-positive" : "c97-chip c97-chip-negative"}>
                  {item.diff}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function InjuriesSection() {
  return (
    <div className="mm-bracket-scroll" role="region" aria-label="Injury notes (scrollable)" tabIndex={0}>
      <table className="c97-table mm-table">
        <thead>
          <tr>
            <th scope="col" data-align="end">
              Seed
            </th>
            <th scope="col">Team and player</th>
            <th scope="col">Line</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {INJURIES.map((injury) => (
            <tr key={injury.player}>
              <td data-align="end" className="mm-num">
                {injury.seed}
              </td>
              <td className="mm-strong">
                {injury.team}, {injury.player}
              </td>
              <td>{injury.line}</td>
              <td className="mm-muted">{injury.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TZSection() {
  const flips = TZ_IMPACTS.filter((impact) => impact.note.startsWith("FLIP"));
  const others = TZ_IMPACTS.filter((impact) => !impact.note.startsWith("FLIP"));

  return (
    <div className="mm-stack">
      <div>
        <p className="mm-label" style={{ color: "var(--c97-negative)" }}>
          Bracket flips
        </p>
        <ul className="mm-rows">
          {flips.map((impact) => (
            <li key={`${impact.team}-${impact.site}`} className="mm-tz-row">
              <span className="mm-strong" style={{ color: "var(--c97-negative)" }}>
                {impact.team}
              </span>
              <span className="mm-body">
                {impact.home} to {impact.site} &middot; {impact.zones} zone{impact.zones > 1 ? "s" : ""}{" "}
                {impact.direction}
                {impact.final ? " · final slot" : ""}
              </span>
              <span className="mm-num mm-strong" style={{ color: "var(--c97-negative)" }}>
                {impact.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mm-label">Other impacts</p>
        <ul className="mm-rows">
          {others.map((impact) => (
            <li key={`${impact.team}-${impact.site}`} className="mm-tz-row">
              <span className="mm-strong">{impact.team}</span>
              <span className="mm-body">
                <span className="mm-num mm-muted">{impact.home} to {impact.site.split(" ")[0]}</span>{" "}
                {impact.note}
              </span>
              <span
                className="mm-num mm-strong"
                style={{
                  color:
                    impact.pct <= -6
                      ? "var(--c97-negative)"
                      : impact.pct <= -3
                        ? "var(--c97-accent)"
                        : "var(--c97-ink-2)",
                }}
              >
                {impact.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SITE_MAP: Record<string, { r1a: string; r1b: string; r1c: string; r1d: string }> = {
  east: {
    r1a: "Greenville, SC (ET)",
    r1b: "San Diego, CA (PT)",
    r1c: "Buffalo, NY (ET)",
    r1d: "Philadelphia, PA (ET)",
  },
  west: {
    r1a: "San Diego, CA (PT)",
    r1b: "Portland, OR (PT)",
    r1c: "Portland, OR (PT)",
    r1d: "St. Louis, MO (CT)",
  },
  south: {
    r1a: "Tampa, FL (ET)",
    r1b: "Oklahoma City, OK (CT)",
    r1c: "Oklahoma City, OK (CT)",
    r1d: "Greenville, SC (ET)",
  },
  midwest: {
    r1a: "Buffalo, NY (ET)",
    r1b: "Tampa, FL (ET)",
    r1c: "Philadelphia, PA (ET)",
    r1d: "St. Louis, MO (CT)",
  },
};

/**
 * The full matchup-by-matchup record of a region, round by round. This is the
 * keyboard and screen-reader path to everything the bracket above draws, and
 * the only place the region's site name and every tag renders as running text.
 */
function RegionBracketDetail({ data }: { data: RegionData }) {
  const sites = SITE_MAP[data.region.toLowerCase()] ?? { r1a: "", r1b: "", r1c: "", r1d: "" };

  return (
    <div className="mm-stack">
      <p className="mm-meta">
        <Tag>{data.region}</Tag> Regional site: <span className="mm-strong">{data.site}</span> &middot;
        Advancing: <span className="mm-strong" style={{ color: "var(--c97-positive)" }}>{data.winner}</span>
      </p>

      <div className="mm-rounds">
        <div>
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

        <div>
          <RoundLabel>Round 2</RoundLabel>
          {data.r2.map((matchup, index) => (
            <Matchup2 key={`r2-${index}`} {...matchup} />
          ))}
          <RoundLabel>Sweet 16: {data.site}</RoundLabel>
          {data.s16.map((matchup, index) => (
            <Matchup2 key={`s16-${index}`} {...matchup} />
          ))}
        </div>

        <div>
          <RoundLabel>Elite Eight</RoundLabel>
          <Matchup2 t1={data.e8.t1} t2={data.e8.t2} w={data.e8.w} tags={["Final Four"]} />
          <p className="mm-body mm-note">{data.e8.note}</p>
        </div>
      </div>
    </div>
  );
}

function PicksSection({ initialPick }: { initialPick: string | null }) {
  // Hydrate the open pick from `?pick=...` so a shared link lands with the
  // referenced pick already expanded. The server reads the same param and
  // passes it in, so the first paint matches what hydration reads from the
  // URL. We use replaceState below to keep the URL in sync without spamming
  // history.
  const [expanded, setExpanded] = useState<string | null>(() => {
    if (typeof window === "undefined") return initialPick;
    return new URL(window.location.href).searchParams.get("pick");
  });

  function togglePick(id: string, isOpen: boolean) {
    const next = isOpen ? null : id;
    setExpanded(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("pick", next);
    else url.searchParams.delete("pick");
    window.history.replaceState(null, "", url.toString());
  }

  const groupMeta: Record<PickEntry["group"], { label: string; sublabel: string; tone: string }> = {
    tz: {
      label: "Time zone upsets",
      sublabel: "Bracket reversals driven by travel penalty.",
      tone: "var(--c97-negative)",
    },
    analytics: {
      label: "Analytics upsets",
      sublabel: "KenPom, S-curve, and Trapezoid-driven calls.",
      tone: "var(--c97-ink)",
    },
    confirm: {
      label: "Final Four picks",
      sublabel: "Chalk calls the model supports strongly.",
      tone: "var(--c97-positive)",
    },
  };

  return (
    <div className="mm-stack">
      {(["tz", "analytics", "confirm"] as const).map((group) => {
        const meta = groupMeta[group];
        const items = PICKS.filter((pick) => pick.group === group);

        return (
          <div key={group} className="mm-stack-tight">
            <div>
              <p className="mm-label" style={{ color: meta.tone }}>
                {meta.label}
              </p>
              <p className="mm-meta">{meta.sublabel}</p>
            </div>

            <ul className="mm-picks">
              {items.map((item, index) => {
                const id = `${group}-${index}`;
                const isOpen = expanded === id;

                return (
                  <li key={id} className="mm-pick" data-open={isOpen ? "true" : undefined}>
                    <button
                      type="button"
                      onClick={() => togglePick(id, isOpen)}
                      className="mm-pick-toggle"
                      aria-expanded={isOpen}
                      aria-controls={`pick-body-${id}`}
                    >
                      <Tag color={BADGE_TONE[item.badge]}>{item.badge}</Tag>
                      <Tag>{item.round}</Tag>
                      <Tag>{item.region}</Tag>
                      <span className="mm-pick-name">{item.pick}</span>
                      <span aria-hidden="true" className="mm-muted">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </button>

                    <p className="mm-body">{item.reason}</p>

                    {isOpen ? (
                      <p id={`pick-body-${id}`} className="mm-body mm-note">
                        {item.body}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="mm-legend">
        <p className="mm-label">Legend</p>
        {(["FLIP", "UPGRADE", "DOWNGRADE", "CONFIRM", "WATCH", "LOCKED"] as const).map((badge) => (
          <span key={badge} className="mm-legend-item">
            <Tag color={BADGE_TONE[badge]}>{badge}</Tag>
            <span className="mm-meta">{LEGEND_COPY[badge]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const MAIN_TAB_ITEMS: { value: MarchMadnessView; label: string }[] = [
  { value: "bracket", label: VIEW_LABELS.bracket },
  { value: "picks", label: VIEW_LABELS.picks },
  { value: "analytics", label: VIEW_LABELS.analytics },
  { value: "time-zones", label: VIEW_LABELS["time-zones"] },
];

const REGION_TAB_ITEMS: { value: MarchMadnessRegion; label: string }[] = [
  { value: "east", label: REGION_LABELS.east },
  { value: "west", label: REGION_LABELS.west },
  { value: "south", label: REGION_LABELS.south },
  { value: "midwest", label: REGION_LABELS.midwest },
];

const ANALYTICS_TAB_ITEMS: { value: MarchMadnessAnalytics; label: string }[] = [
  { value: "rankings", label: ANALYTICS_LABELS.rankings },
  { value: "s-curve", label: ANALYTICS_LABELS["s-curve"] },
  { value: "injuries", label: ANALYTICS_LABELS.injuries },
];

export function MarchMadnessClient({
  initialState,
  initialPick = null,
}: {
  initialState: MarchMadnessSearchState;
  initialPick?: string | null;
}) {
  const router = useRouter();
  const [view, setView] = useState(initialState.view);
  const [region, setRegion] = useState(initialState.region);
  const [analytics, setAnalytics] = useState(initialState.analytics);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const articleHref = `/writing/${MARCH_MADNESS_ARTICLE_SLUG}`;
  const championshipWinner = FINAL_FOUR_SUMMARY[FINAL_FOUR_SUMMARY.length - 1]?.winner ?? null;
  const championRanking = RANKINGS.find((ranking) => ranking.team === championshipWinner) ?? null;

  const updateRouteState = (
    nextState: Partial<MarchMadnessSearchState>,
    options?: { scroll?: boolean; hash?: string }
  ) => {
    const mergedState = {
      view,
      region,
      analytics,
      ...nextState,
    };

    if (nextState.view) {
      setView(nextState.view);
    }

    if (nextState.region) {
      setRegion(nextState.region);
    }

    if (nextState.analytics) {
      setAnalytics(nextState.analytics);
    }
    // A copied link names the old view, so the status goes back to showing the new one.
    setCopyStatus("idle");

    const href = buildMarchMadnessHref({
      ...mergedState,
      hash: options?.hash,
    });

    startTransition(() => {
      router.replace(href, { scroll: options?.scroll ?? false });
    });
  };

  const currentHref = buildMarchMadnessHref({ view, region, analytics });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(new URL(currentHref, window.location.origin).toString());
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <div className="mm-root">
      <div className="c97-shell c97-frame mm-page">
        <header className="mm-head">
          <p className="mm-kicker">{`2026 NCAA Tournament · ${MARCH_MADNESS_UPDATED_LABEL}`}</p>
          <h1 className="mm-title">March Madness Bracket Analysis</h1>
          <p className="mm-standfirst">
            I built this bracket on the consensus ratings and then moved picks for the two things
            seed lines miss, the travel penalty a team pays when it plays across time zones and the
            seeds the committee got wrong.
          </p>
          <p className="mm-actions">
            <Link
              href={buildMarchMadnessHref({ view: "picks", region, analytics, hash: "analysis-workspace" })}
              className="c97-btn"
            >
              See best upsets
            </Link>
            <Link
              href={buildMarchMadnessHref({ view, region, analytics, hash: "why-this-model-is-different" })}
              className="mm-link"
            >
              How the model works
            </Link>
            <Link href={articleHref} className="mm-link">
              Read the companion article
            </Link>
            <Link
              href={buildMarchMadnessHref({ view, region, analytics, hash: "analysis-workspace" })}
              className="mm-link"
            >
              Open the analysis workspace
            </Link>
          </p>
        </header>

        <div className="mm-lead">
          <section className="mm-bracket-block" aria-labelledby="mm-region-heading">
            <div className="mm-bracket-bar">
              <h2 id="mm-region-heading" className="mm-h2">
                {REGION_LABELS[region]} region
              </h2>
              <TabBar
                items={REGION_TAB_ITEMS}
                active={region}
                onChange={(nextRegion) => updateRouteState({ region: nextRegion })}
                label="March Madness regions"
              />
            </div>
            <div className="mm-bracket-scroll" role="region" aria-label="Region bracket (scrolls sideways)" tabIndex={0}>
              <RegionBracket data={BRACKET[region]} />
            </div>
          </section>

          <aside className="mm-column" aria-label="Champion pick and top upsets">
            <section className="mm-stack-tight" aria-labelledby="mm-champion-heading">
              <p className="mm-label">Final Four &middot; Indianapolis, IN (ET)</p>
              <h2 id="mm-champion-heading" className="mm-h2">
                Champion pick, {championshipWinner ?? "TBD"}
                {championRanking ? (
                  <span className="mm-num mm-muted mm-odds"> {championRanking.odds} title odds</span>
                ) : null}
              </h2>
              <ol className="mm-rows">
                {FINAL_FOUR_SUMMARY.map((item) => (
                  <li key={item.label} className="mm-ff-row">
                    <span className="mm-meta">{item.label}</span>
                    <span className="mm-body">
                      {item.matchup}, <span className="mm-strong">{item.winner}</span>
                    </span>
                    <span className="mm-meta">{item.note}</span>
                  </li>
                ))}
              </ol>
              <p className="mm-body">
                I thought {championshipWinner} was the cleanest title pick in the field. The team
                ranked first across the blended metric set on this page and carried zero total
                travel penalty through every round
                {championRanking
                  ? `, with a ${championRanking.record} record going in and the best adjusted defensive efficiency in the bracket at 90.8.`
                  : "."}
              </p>
              <p className="mm-body mm-result">{MARCH_MADNESS_RESULT_NOTE}</p>
              <Link href={`/writing/${MARCH_MADNESS_POSTMORTEM_SLUG}`} className="mm-link">
                Read the postmortem
              </Link>
            </section>

            <section className="mm-stack-tight" aria-labelledby="mm-upsets-heading">
              <h2 id="mm-upsets-heading" className="mm-h2">
                Top upset picks
              </h2>
              <ul className="mm-upsets">
                {TOP_UPSET_PICKS.map((card) => (
                  <UpsetCard key={card.title} card={card} />
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <section id="analysis-workspace" className="mm-workspace" aria-labelledby="mm-workspace-heading">
          <div className="mm-workspace-bar">
            <h2 id="mm-workspace-heading" className="mm-h2">
              The analysis workspace
            </h2>
            <TabBar
              items={MAIN_TAB_ITEMS}
              active={view}
              onChange={(nextView) => updateRouteState({ view: nextView })}
              label="March Madness primary sections"
            />
            <p className="mm-copy">
              <button type="button" onClick={handleCopyLink} className="c97-btn-ghost">
                Copy current view link
              </button>
              {/* The live region holds only the copy result, so a view change never announces the URL. */}
              <span role="status" aria-live="polite" className="mm-meta">
                {copyStatus === "copied"
                  ? "Deep link copied."
                  : copyStatus === "error"
                    ? "Clipboard blocked. Copy the URL from the address bar."
                    : null}
              </span>
            </p>
          </div>

          {view === "bracket" ? <RegionBracketDetail data={BRACKET[region]} /> : null}

          {view === "picks" ? <PicksSection initialPick={initialPick} /> : null}

          {view === "analytics" ? (
            <div className="mm-stack">
              <TabBar
                items={ANALYTICS_TAB_ITEMS}
                active={analytics}
                onChange={(nextAnalytics) => updateRouteState({ analytics: nextAnalytics })}
                label="March Madness analytics sections"
              />
              {analytics === "rankings" ? <RankingsSection /> : null}
              {analytics === "s-curve" ? <SCurveSection /> : null}
              {analytics === "injuries" ? <InjuriesSection /> : null}
            </div>
          ) : null}

          {view === "time-zones" ? <TZSection /> : null}
        </section>

        <section id="why-this-model-is-different" className="mm-prose" aria-labelledby="mm-method-heading">
          <h2 id="mm-method-heading" className="mm-h2">
            Why this model is different
          </h2>
          <p className="mm-body">
            Most brackets stop at seed lines and generic power ratings. This one blends consensus
            analytics with committee errors, roster context, and travel penalties that change
            game-day output.
          </p>
          <div className="mm-prose-grid">
            {MODEL_PILLARS.map((card) => (
              <div key={card.title} className="mm-stack-tight">
                <h3 className="mm-h3">{card.title}</h3>
                <p className="mm-body">{card.reason}</p>
                <p className="mm-meta">
                  {card.note} ·{" "}
                  <Link href={card.href} className="mm-link">
                    {card.cta}
                  </Link>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mm-prose" aria-labelledby="march-madness-questions">
          <h2 id="march-madness-questions" className="mm-h2">
            March Madness bracket questions
          </h2>
          <div className="mm-prose-grid">
            {MARCH_MADNESS_FAQ.map((item) => (
              <div key={item.question} className="mm-stack-tight">
                <h3 className="mm-h3">{item.question}</h3>
                <p className="mm-body">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mm-sources">
          Sources: KenPom &middot; ESPN BPI &middot; T-Rank &middot; NCAA NET &middot; Evan Miya &middot; SOR
          &middot; WAB &middot; VSIN Lines
        </p>
      </div>
    </div>
  );
}
