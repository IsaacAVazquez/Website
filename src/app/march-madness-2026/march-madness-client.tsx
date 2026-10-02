"use client";

import Link from "next/link";
import { startTransition, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import { regionBracket } from "./bracketLayout";
import { RegionBracket } from "./RegionBracket";
import {
  BEST_UPSET_SHARE,
  BRACKET,
  BRACKET_THESIS_SHARE,
  FINAL_FOUR_SUMMARY,
  INJURIES,
  MARCH_MADNESS_ARTICLE_SLUG,
  MARCH_MADNESS_FAQ,
  MARCH_MADNESS_POSTMORTEM_SLUG,
  MARCH_MADNESS_RESULT_NOTE,
  MARCH_MADNESS_THESIS,
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
  MARCH_MADNESS_ROUTE,
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

function SectionIntro({
  eyebrow,
  title,
  description,
  titleId,
}: {
  eyebrow: string;
  title: string;
  description: string;
  titleId?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
        {eyebrow}
      </p>
      <h2 id={titleId} className="c97-poster-sm">
        {title}
      </h2>
      <p className="c97-prose">{description}</p>
    </div>
  );
}

function EditorialLinkCard({ card }: { card: EditorialCard }) {
  return (
    <Link
      href={card.href}
      className="c97-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: "var(--c97-sp-4)",
        textDecoration: "none",
      }}
    >
      <span className="c97-halftone c97-halftone-corner" aria-hidden="true" />
      <div style={{ marginBottom: "var(--c97-sp-3)" }}>
        <Tag color={EDITORIAL_TONE[card.color]}>{card.eyebrow}</Tag>
      </div>
      <h3 className="c97-serif c97-h3" style={{ marginBottom: "var(--c97-sp-2)" }}>
        {card.title}
      </h3>
      <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginBottom: "var(--c97-sp-3)" }}>
        {card.reason}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginTop: "auto" }}>
        <p className="c97-kicker" style={{ margin: 0 }}>
          {card.note}
        </p>
        <span className="c97-kicker" style={{ margin: 0, color: "var(--c97-ink)" }}>
          {card.cta} &rarr;
        </span>
      </div>
    </Link>
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
  return (
    <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-4)", marginBottom: "var(--c97-sp-2)" }}>
      {children}
    </p>
  );
}

function SiteLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="c97-prose"
      style={{ fontSize: "var(--c97-fs-small)", fontStyle: "italic", color: "var(--c97-ink-2)", marginBottom: "var(--c97-sp-1)" }}
    >
      {children}
    </p>
  );
}

function NoteBox({ children }: { children: ReactNode }) {
  return (
    <div style={{ marginTop: "var(--c97-sp-3)", paddingTop: "var(--c97-sp-3)", borderTop: "1px solid var(--c97-rule)" }}>
      <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
        {children}
      </p>
    </div>
  );
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
    // Every TabBar sits in a space-y-5 stack, whose gap .c97-segmented's margin: 0 would drop.
    <div className="c97-segmented" role="tablist" aria-label={label} style={{ marginBottom: "var(--c97-sp-3)" }}>
      {items.map((item, index) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active === item.value}
          tabIndex={active === item.value ? 0 : -1}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onClick={() => onChange(item.value)}
          className="min-h-[44px]"
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
      className="c97-mono"
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
    <div className="space-y-4">
      <p className="c97-prose" style={{ marginBottom: "var(--c97-sp-2)", fontSize: "var(--c97-fs-small)" }}>
        Blended average across BPI, Evan Miya, KPI, NET, KenPom, SOR, T-Rank, and WAB, excluding the
        minimum and maximum system values.
      </p>
      <div className="mm-bracket-scroll" role="region" aria-label="Team rankings table (scrollable)" tabIndex={0}>
        <table className="c97-table" style={{ minWidth: "920px" }}>
          <thead>
            <tr>
              {RANKINGS_COLUMNS.map((heading) => (
                <th key={heading} data-align={heading === "Team" || heading === "Trapezoid" ? undefined : "end"}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RANKINGS.map((ranking) => (
              <tr key={ranking.team}>
                <td className="c97-mono">{ranking.rank}</td>
                <td style={{ fontWeight: 600 }}>{ranking.team}</td>
                <td>{ranking.conf}</td>
                <td className="c97-mono">{ranking.record}</td>
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
                <td data-align="end" className="c97-mono">
                  {ranking.seed}
                </td>
                <td data-align="end" className="c97-mono" style={{ fontWeight: 600 }}>
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
        { label: "Underseeded teams", data: SCURVE.under, positive: true },
        { label: "Overseeded teams", data: SCURVE.over, positive: false },
      ].map(({ label, data, positive }) => (
        <div key={label} className="c97-panel">
          <p
            className="c97-kicker"
            style={{ marginBottom: "var(--c97-sp-3)", color: positive ? "var(--c97-positive)" : "var(--c97-negative)" }}
          >
            {label}
          </p>
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.team} className="flex flex-wrap items-baseline gap-3">
                <span style={{ minWidth: "7rem", fontWeight: 600 }}>{item.team}</span>
                <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                  {item.seed}-seed &middot; {item.exp}&rarr;{item.act}
                </span>
                <span className={positive ? "c97-chip c97-chip-positive" : "c97-chip c97-chip-negative"}>
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
        <div key={injury.player} className="c97-panel" style={{ display: "flex", gap: "var(--c97-sp-3)" }}>
          <span className="c97-chip" style={{ minWidth: "2.5rem", justifyContent: "center" }}>
            {injury.seed}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, margin: 0 }}>
              {injury.team}, {injury.player}
            </p>
            <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-1)" }}>
              {injury.line}
            </p>
            <p
              className="c97-prose"
              style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
            >
              {injury.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TZSection() {
  const flips = TZ_IMPACTS.filter((impact) => impact.note.startsWith("FLIP"));
  const others = TZ_IMPACTS.filter((impact) => !impact.note.startsWith("FLIP"));

  return (
    <div className="space-y-6">
      <div>
        <p className="c97-kicker" style={{ color: "var(--c97-negative)", marginBottom: "var(--c97-sp-3)" }}>
          Bracket flips
        </p>
        <div className="space-y-3">
          {flips.map((impact) => (
            <div
              key={`${impact.team}-${impact.site}`}
              className="c97-panel"
              style={{ display: "grid", gap: "var(--c97-sp-2)", gridTemplateColumns: "minmax(0,120px) minmax(0,1fr) auto" }}
            >
              <span style={{ fontWeight: 600, color: "var(--c97-negative)" }}>{impact.team}</span>
              <span className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                {impact.home} to {impact.site} &middot; {impact.zones} zone{impact.zones > 1 ? "s" : ""}{" "}
                {impact.direction}
                {impact.final ? " · final slot" : ""}
              </span>
              <span className="c97-mono" style={{ fontWeight: 600, color: "var(--c97-negative)" }}>
                {impact.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-3)" }}>
          Other impacts
        </p>
        <div className="space-y-3">
          {others.map((impact) => (
            <div key={`${impact.team}-${impact.site}`} className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
              <div className="flex flex-wrap items-baseline gap-3">
                <span style={{ fontWeight: 600 }}>{impact.team}</span>
                <span className="c97-mono" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
                  {impact.home} to {impact.site.split(" ")[0]}
                </span>
                <span
                  className="c97-mono"
                  style={{
                    marginLeft: "auto",
                    fontWeight: 600,
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
              </div>
              <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                {impact.note}
              </p>
            </div>
          ))}
        </div>
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
 * keyboard and screen-reader path to everything the hero's bracket signature
 * draws, and the only place the region's site name and every tag renders as
 * running text.
 */
function RegionBracketDetail({ data }: { data: RegionData }) {
  const sites = SITE_MAP[data.region.toLowerCase()] ?? { r1a: "", r1b: "", r1c: "", r1d: "" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
        <Tag>{data.region}</Tag>
        <span>Regional site:</span>
        <span style={{ fontWeight: 600, color: "var(--c97-ink)" }}>{data.site}</span>
        <span>&middot;</span>
        <span>Advancing:</span>
        <span style={{ fontWeight: 600, color: "var(--c97-positive)" }}>{data.winner}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_0.84fr]">
        <div className="c97-panel">
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

        <div className="c97-panel">
          <RoundLabel>Round 2</RoundLabel>
          {data.r2.map((matchup, index) => (
            <Matchup2 key={`r2-${index}`} {...matchup} />
          ))}
          <RoundLabel>Sweet 16: {data.site}</RoundLabel>
          {data.s16.map((matchup, index) => (
            <Matchup2 key={`s16-${index}`} {...matchup} />
          ))}
        </div>

        <div className="c97-panel">
          <RoundLabel>Elite Eight</RoundLabel>
          <Matchup2 t1={data.e8.t1} t2={data.e8.t2} w={1} tags={["Final Four"]} />
          <NoteBox>{data.e8.note}</NoteBox>
        </div>
      </div>
    </div>
  );
}

function PicksSection() {
  // Hydrate the open pick from `?pick=...` so a shared link lands with the
  // referenced pick already expanded. We use replaceState below to keep the
  // URL in sync without spamming history.
  const [expanded, setExpanded] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
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
      label: "Time Zone Upsets",
      sublabel: "Bracket reversals driven by travel penalty.",
      tone: "var(--c97-negative)",
    },
    analytics: {
      label: "Analytics Upsets",
      sublabel: "KenPom, S-curve, and Trapezoid-driven calls.",
      tone: "var(--c97-ink)",
    },
    confirm: {
      label: "Final Four Picks",
      sublabel: "Chalk calls the model supports strongly.",
      tone: "var(--c97-positive)",
    },
  };

  return (
    <div className="space-y-8">
      {(["tz", "analytics", "confirm"] as const).map((group) => {
        const meta = groupMeta[group];
        const items = PICKS.filter((pick) => pick.group === group);

        return (
          <div key={group} className="space-y-3">
            <div>
              <p className="c97-kicker" style={{ color: meta.tone }}>
                {meta.label}
              </p>
              <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-1)" }}>
                {meta.sublabel}
              </p>
            </div>

            {items.map((item, index) => {
              const id = `${group}-${index}`;
              const isOpen = expanded === id;

              return (
                <div
                  key={id}
                  className="c97-panel"
                  style={{ border: isOpen ? "1px solid var(--c97-ink-2)" : "1px solid transparent" }}
                >
                  <button
                    type="button"
                    onClick={() => togglePick(id, isOpen)}
                    className="mm-pick-toggle flex flex-wrap items-start gap-2"
                    aria-expanded={isOpen}
                    aria-controls={`pick-body-${id}`}
                  >
                    <Tag color={BADGE_TONE[item.badge]}>{item.badge}</Tag>
                    <Tag>{item.round}</Tag>
                    <Tag>{item.region}</Tag>
                    <span style={{ minWidth: 0, flex: "1 1 0%", fontWeight: 600 }}>{item.pick}</span>
                    <span aria-hidden="true" style={{ color: "var(--c97-ink-2)" }}>
                      {isOpen ? "▾" : "▸"}
                    </span>
                  </button>

                  <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-2)" }}>
                    {item.reason}
                  </p>

                  {isOpen ? (
                    <p
                      id={`pick-body-${id}`}
                      className="c97-prose"
                      style={{
                        fontSize: "var(--c97-fs-small)",
                        marginTop: "var(--c97-sp-3)",
                        paddingTop: "var(--c97-sp-3)",
                        borderTop: "1px solid var(--c97-rule)",
                      }}
                    >
                      {item.body}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="c97-panel">
        <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-3)" }}>
          Legend
        </p>
        <div className="flex flex-wrap gap-4">
          {(["FLIP", "UPGRADE", "DOWNGRADE", "WATCH", "LOCKED"] as const).map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              <Tag color={BADGE_TONE[badge]}>{badge}</Tag>
              <span className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                {LEGEND_COPY[badge]}
              </span>
            </div>
          ))}
        </div>
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
}: {
  initialState: MarchMadnessSearchState;
}) {
  const router = useRouter();
  const [view, setView] = useState(initialState.view);
  const [region, setRegion] = useState(initialState.region);
  const [analytics, setAnalytics] = useState(initialState.analytics);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const lead = PROJECT_PRESS[MARCH_MADNESS_ROUTE].lead;
  const articleHref = `/writing/${MARCH_MADNESS_ARTICLE_SLUG}`;
  const regionLayout = regionBracket(BRACKET[region]);
  const upsetsInRegion = regionLayout.games.filter((game) => game.isUpset).length;
  const championshipWinner = FINAL_FOUR_SUMMARY[FINAL_FOUR_SUMMARY.length - 1]?.winner ?? null;
  const championRanking = RANKINGS.find((ranking) => ranking.team === championshipWinner) ?? null;
  const flipCount = PICKS.filter((pick) => pick.badge === "FLIP").length;

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
    <>
      <Catalog97ProjectHero
        ink={lead}
        title="March Madness Bracket Analysis"
        standfirst="I built this bracket on the consensus ratings and then moved picks for the two things seed lines miss, the travel penalty a team pays when it plays across time zones and the seeds the committee got wrong."
        meta={`2026 NCAA Tournament · ${MARCH_MADNESS_UPDATED_LABEL}`}
        readouts={[
          {
            label: "Champion pick",
            value: <span className="c97-serif">{championshipWinner ?? "TBD"}</span>,
            detail: championRanking ? `${championRanking.odds} title odds` : undefined,
          },
          {
            label: "Time-zone flips",
            value: `${flipCount}`,
            detail: "picks reversed by the travel-penalty model",
          },
          {
            label: `Upsets, ${REGION_LABELS[region]} region`,
            value: `${upsetsInRegion}`,
            detail: `of ${regionLayout.games.length} matchups drawn`,
          },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: "var(--c97-sp-4)" }}>
          <Link
            href={buildMarchMadnessHref({ view: "picks", region, analytics, hash: "analysis-workspace" })}
            className="c97-btn c97-offset"
          >
            See best upsets
          </Link>
          <Link
            href={buildMarchMadnessHref({ view, region, analytics, hash: "why-this-model-is-different" })}
            className="c97-btn-ghost"
          >
            How the model works
          </Link>
          <Link href={articleHref} className="c97-btn-ghost">
            Read the companion article
          </Link>
        </div>

        <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
          <div className="mm-bracket-scroll" role="region" aria-label="Region bracket (scrolls sideways)" tabIndex={0}>
            <RegionBracket data={BRACKET[region]} />
          </div>
        </div>
      </Catalog97ProjectHero>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell space-y-4">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
            National champion pick
          </p>
          <h2 className="c97-serif c97-h2" style={{ marginBottom: "var(--c97-sp-2)" }}>{championshipWinner ?? "TBD"}</h2>
          <p className="c97-prose">{MARCH_MADNESS_RESULT_NOTE}</p>
          <p className="c97-prose">
            I thought {championshipWinner} was the cleanest title pick in the field. The team ranked
            first across the blended metric set on this page, and it carried zero total travel
            penalty through every round, the same edge the Final Four summary below tracks.
            {championRanking
              ? ` Its record sat at ${championRanking.record} going in, with the best adjusted defensive efficiency in the bracket at 90.8, and that is a big part of why the championship odds landed at ${championRanking.odds}.`
              : null}
          </p>
          <Link href={`/writing/${MARCH_MADNESS_POSTMORTEM_SLUG}`} className="c97-btn-ghost">
            Read the postmortem
          </Link>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell space-y-6">
          <SectionIntro
            eyebrow="Searchable hooks"
            title="Top upset picks for the 2026 March Madness bracket"
            description="These are the calls most likely to earn clicks and debate: one pure time-zone flip, one seed-line correction, and one late-bracket structural upset built on travel math."
          />
          <div className="c97-columns">
            {TOP_UPSET_PICKS.map((card) => (
              <EditorialLinkCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="why-this-model-is-different"
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
      >
        <div className="c97-shell space-y-6">
          <SectionIntro
            eyebrow="The method"
            title="Why this model is different"
            description="Most brackets stop at seed lines and generic power ratings. This one blends consensus analytics with committee errors, roster context, and travel penalties that change game-day output."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {MODEL_PILLARS.map((card) => (
              <EditorialLinkCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="bone" data-seam="deckle">
        <div className="c97-shell space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="c97-kicker" style={{ margin: 0 }}>
                Share layer
              </p>
              <h2 className="c97-poster-sm" style={{ marginTop: "var(--c97-sp-2)" }}>
                Give people something quotable to pass around
              </h2>
            </div>
            <Link href={articleHref} className="c97-btn-ghost">
              Read the written breakdown
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="c97-panel">
              <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-3)" }}>
                Bracket thesis
              </p>
              <p className="c97-serif c97-h3" style={{ marginBottom: "var(--c97-sp-3)" }}>
                &ldquo;{MARCH_MADNESS_THESIS}&rdquo;
              </p>
              <p className="c97-prose">{BRACKET_THESIS_SHARE}</p>
            </div>

            <div className="c97-panel">
              <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-3)", color: "var(--c97-negative)" }}>
                Best upset share card
              </p>
              <p className="c97-serif c97-h3" style={{ marginBottom: "var(--c97-sp-3)" }}>
                UCF over UCLA
              </p>
              <p className="c97-prose">{BEST_UPSET_SHARE}</p>
              <Link
                href={buildMarchMadnessHref({ view: "picks", region, analytics, hash: "analysis-workspace" })}
                className="c97-btn-ghost"
                style={{ marginTop: "var(--c97-sp-3)" }}
              >
                Open the picks board
              </Link>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-3"
            style={{ borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-4)" }}
          >
            <button type="button" onClick={handleCopyLink} className="c97-btn-ghost">
              Copy current view link
            </button>
            <span className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", wordBreak: "break-all" }}>
              {copyStatus === "idle" ? currentHref : null}
              {/* The live region holds only the copy result, so a view change never announces the URL. */}
              <span role="status" aria-live="polite">
                {copyStatus === "copied"
                  ? "Deep link copied."
                  : copyStatus === "error"
                    ? "Clipboard blocked. Copy the URL from the address bar."
                    : null}
              </span>
            </span>
          </div>
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell space-y-5">
          <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-3)" }}>
            Final Four &middot; Indianapolis, IN (ET)
          </p>
          <div className="c97-columns">
            {FINAL_FOUR_SUMMARY.map((item) => (
              <div key={item.label} className="c97-panel">
                <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
                  {item.label}
                </p>
                <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                  {item.matchup}
                </p>
                <p className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-positive)" }}>
                  {item.winner}
                </p>
                <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="analysis-workspace"
        className="c97-band c97-sheet"
        data-c97-surface="bone"
        data-seam="deckle"
      >
        <div className="c97-shell space-y-5">
          <h2 className="c97-poster-sm">The analysis workspace</h2>
          <TabBar items={MAIN_TAB_ITEMS} active={view} onChange={(nextView) => updateRouteState({ view: nextView })} label="March Madness primary sections" />

          {view === "bracket" ? (
            <div style={{ marginTop: "var(--c97-sp-4)" }} className="space-y-5">
              <TabBar
                items={REGION_TAB_ITEMS}
                active={region}
                onChange={(nextRegion) => updateRouteState({ region: nextRegion })}
                label="March Madness regions"
              />
              <RegionBracketDetail data={BRACKET[region]} />
            </div>
          ) : null}

          {view === "picks" ? (
            <div style={{ marginTop: "var(--c97-sp-4)" }}>
              <PicksSection />
            </div>
          ) : null}

          {view === "analytics" ? (
            <div style={{ marginTop: "var(--c97-sp-4)" }} className="space-y-5">
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

          {view === "time-zones" ? (
            <div style={{ marginTop: "var(--c97-sp-4)" }}>
              <TZSection />
            </div>
          ) : null}
        </div>
      </section>

      <section className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn">
        <div className="c97-shell space-y-6">
          <section aria-labelledby="march-madness-questions">
            <SectionIntro
              eyebrow="Method questions"
              title="March Madness bracket questions"
              description="The short version of how the model reaches its picks and where it differs from a seed-only bracket."
              titleId="march-madness-questions"
            />
            <div className="grid gap-4 md:grid-cols-2" style={{ marginTop: "var(--c97-sp-5)" }}>
              {MARCH_MADNESS_FAQ.map((item) => (
                <div key={item.question} className="c97-panel">
                  <h3 className="c97-h3" style={{ fontWeight: 600, marginBottom: "var(--c97-sp-2)" }}>
                    {item.question}
                  </h3>
                  <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div
            className="flex flex-wrap items-center justify-between gap-3"
            style={{ borderTop: "1px solid var(--c97-rule)", paddingTop: "var(--c97-sp-4)" }}
          >
            <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", margin: 0 }}>
              Sources: KenPom &middot; ESPN BPI &middot; T-Rank &middot; NCAA NET &middot; Evan Miya &middot; SOR
              &middot; WAB &middot; VSIN Lines
            </p>
            <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", margin: 0 }}>
              2026 NCAA Tournament &middot; Isaac Vazquez
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
