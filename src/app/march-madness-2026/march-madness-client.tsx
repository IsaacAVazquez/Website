"use client";

import Link from "next/link";
import { startTransition, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BEST_UPSET_SHARE,
  BRACKET,
  BRACKET_THESIS_SHARE,
  FINAL_FOUR_SUMMARY,
  HERO_TAGS,
  INJURIES,
  MARCH_MADNESS_ARTICLE_SLUG,
  MARCH_MADNESS_THESIS,
  MARCH_MADNESS_UPDATED_AT,
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

const SURFACE_CLASS =
  "rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] shadow-[var(--shadow-sm)]";

const editorialCardClasses: Record<EditorialCard["color"], string> = {
  rose: "border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))] shadow-[var(--shadow-sm)]",
  amber: "border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] shadow-[var(--shadow-sm)]",
  blue: "border-[color-mix(in_srgb,var(--home-ink)_25%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-ink)_7%,var(--home-paper-alt))] shadow-[var(--shadow-sm)]",
};

function SurfaceCard({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`${SURFACE_CLASS} ${className}`}>
      {children}
    </div>
  );
}

function Tag({ children, color = "gray" }: { children: ReactNode; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: "border-[color-mix(in_srgb,var(--home-ink)_25%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-ink)_7%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-ink)_75%,var(--home-stone))]",
    green: "border-[color-mix(in_srgb,var(--home-positive)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]",
    red: "border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]",
    amber: "border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] text-[var(--home-signal)]",
    gray: "border-[var(--home-rule)] bg-[var(--home-overlay)] text-[var(--home-ink-muted)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-3xs font-semibold uppercase tracking-[0.14em] ${
        colorClasses[color] ?? colorClasses.gray
      }`}
    >
      {children}
    </span>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-[var(--home-signal)]">
        {eyebrow}
      </p>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--home-ink)] sm:text-3xl">{title}</h2>
        <p className="max-w-[72ch] text-sm leading-7 text-[var(--home-ink-muted)] sm:text-base">{description}</p>
      </div>
    </div>
  );
}

function EditorialLinkCard({ card }: { card: EditorialCard }) {
  return (
    <Link
      href={card.href}
      className={`group rounded-[var(--radius-3xl)] border p-5 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--home-ink)_20%,var(--home-rule))] hover:bg-[var(--home-overlay)] ${editorialCardClasses[card.color]}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag color={card.color === "blue" ? "blue" : card.color === "amber" ? "amber" : "red"}>
            {card.eyebrow}
          </Tag>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--home-ink)]">{card.title}</h3>
          <p className="text-sm leading-7 text-[var(--home-ink)]">{card.reason}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">{card.note}</p>
          <span className="text-sm font-semibold text-[var(--home-ink)] transition group-hover:text-[var(--home-signal)]">
            {card.cta}
          </span>
        </div>
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
    <div
      className={`flex flex-wrap items-center gap-2 px-3 py-3 sm:flex-nowrap ${
        win
          ? "border-l-2 border-[var(--home-positive)] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))]"
          : "border-l-2 border-transparent bg-[var(--home-overlay)]"
      }`}
    >
      <span className="w-5 shrink-0 text-right text-2xs font-medium text-[var(--home-ink-soft)]">
        {seed ?? ""}
      </span>
      <span className={`min-w-0 flex-1 text-sm font-semibold ${win ? "text-[var(--home-ink)]" : "text-[var(--home-ink-muted)]"}`}>
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
    <div className="mb-3 overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-black/20">
      <TeamRow seed={s1} name={t1} win={w === 1} tags={w === 1 ? tags : []} />
      <div className="h-px bg-[var(--home-overlay)]" />
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
    <div className="mb-3 overflow-hidden rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-black/20">
      <TeamRow name={t1} win={w === 1} tags={w === 1 ? tags : []} />
      <div className="h-px bg-[var(--home-overlay)]" />
      <TeamRow name={t2} win={w === 2} tags={w === 2 ? tags : []} />
    </div>
  );
}

function RoundLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 mt-5 border-b border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] pb-2 text-2xs font-semibold uppercase tracking-[0.2em] text-[var(--home-signal)]">
      {children}
    </p>
  );
}

function SiteLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 mt-3 text-xs italic text-[var(--home-ink-soft)]">{children}</p>;
}

function NoteBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-4 text-sm leading-6 text-[var(--home-ink-muted)]">
      {children}
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
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
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
    <div className="flex flex-wrap gap-2" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={active === item.value}
          tabIndex={active === item.value ? 0 : -1}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onClick={() => onChange(item.value)}
          className={`min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            active === item.value
              ? "border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] text-[var(--home-signal)]"
              : "border-[var(--home-rule)] bg-[var(--home-overlay)] text-[var(--home-ink-muted)] hover:border-[color-mix(in_srgb,var(--home-ink)_20%,var(--home-rule))] hover:bg-[var(--home-overlay)] hover:text-[var(--home-ink)]"
          }`}
        >
          {item.label}
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
    ? "text-[var(--home-signal)]"
    : isRank && val <= 5
      ? "text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]"
      : "text-[var(--home-ink-muted)]";

  // Surface what each color encodes so colorblind users get a tooltip + the
  // screen-reader text instead of a bare number.
  const title = highlight
    ? "Top-3 average: this team rates among the strongest overall"
    : isRank && val <= 5
      ? "Top-5 by this system"
      : undefined;

  return (
    <td
      className={`px-2 py-3 text-right text-xs font-medium tabular-nums ${textClass}`}
      title={title}
      aria-label={title ? `${val} (${title})` : undefined}
    >
      {val}
    </td>
  );
}

function RankingsSection() {
  return (
    <div className="space-y-4">
      <p className="max-w-[72ch] text-sm leading-6 text-[var(--home-ink-muted)]">
        Blended average across BPI, Evan Miya, KPI, NET, KenPom, SOR, T-Rank,
        and WAB, excluding the minimum and maximum system values.
      </p>
      <div
        className="scroll-shadow-x overflow-x-auto rounded-[var(--radius-3xl)] border border-[var(--home-rule)]"
        role="region"
        aria-label="Team rankings table (scrollable)"
        tabIndex={0}
      >
        <table className="min-w-[920px] w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--home-rule)]">
              {[
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
              ].map((heading) => (
                <th
                  key={heading}
                  className={`px-2 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--home-ink-soft)] ${
                    heading === "Team" || heading === "Trapezoid" ? "text-left" : "text-right"
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
                className={`border-b border-[var(--home-rule)] ${index % 2 === 0 ? "bg-[var(--home-overlay)]" : ""}`}
              >
                <td className="px-2 py-3 text-xs tabular-nums text-[var(--home-ink-soft)]">{ranking.rank}</td>
                <td className="px-2 py-3 text-sm font-semibold text-[var(--home-ink)]">{ranking.team}</td>
                <td className="px-2 py-3 text-xs text-[var(--home-ink-muted)]">{ranking.conf}</td>
                <td className="px-2 py-3 text-xs tabular-nums text-[var(--home-ink-muted)]">{ranking.record}</td>
                <StatCell val={ranking.avg} highlight={ranking.avg <= 3} />
                {[
                  ranking.bpi,
                  ranking.em,
                  ranking.kpi,
                  ranking.net,
                  ranking.pom,
                  ranking.sor,
                  ranking.tr,
                  ranking.wab,
                ].map((value, statIndex) => (
                  <StatCell key={`${ranking.team}-${statIndex}`} val={value} isRank />
                ))}
                <td className="px-2 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-3xs font-semibold uppercase tracking-[0.14em] ${
                      ranking.trap === "Trapezoid"
                        ? "border-[color-mix(in_srgb,var(--home-positive)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]"
                        : ranking.trap === "—"
                          ? "border-[var(--home-rule)] bg-[var(--home-overlay)] text-[var(--home-ink-soft)]"
                          : "border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] text-[var(--home-signal)]"
                    }`}
                  >
                    {ranking.trap}
                  </span>
                </td>
                <td className="px-2 py-3 text-right text-xs tabular-nums text-[var(--home-ink-muted)]">{ranking.seed}</td>
                <td className="px-2 py-3 text-right text-xs font-semibold tabular-nums text-[var(--home-signal)]">
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
        { label: "Underseeded: got a raw deal", data: SCURVE.under, positive: true },
        { label: "Overseeded: got a gift", data: SCURVE.over, positive: false },
      ].map(({ label, data, positive }) => (
        <div key={label} className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] p-4">
          <p
            className={`mb-4 text-2xs font-semibold uppercase tracking-[0.16em] ${
              positive ? "text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]" : "text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]"
            }`}
          >
            {label}
          </p>
          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.team}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-black/10 px-3 py-3"
              >
                <span className="min-w-[110px] text-sm font-semibold text-[var(--home-ink)]">{item.team}</span>
                <span className="flex-1 text-xs text-[var(--home-ink-muted)]">
                  {item.seed}-seed · {item.exp}→{item.act}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    positive
                      ? "border-[color-mix(in_srgb,var(--home-positive)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]"
                      : "border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]"
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
          className="flex gap-4 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-2xl)] border border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] text-sm font-semibold text-[var(--home-signal)]">
            {injury.seed}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--home-ink)]">
              {injury.team}: {injury.player}
            </p>
            <p className="mt-1 text-sm text-[var(--home-ink-muted)]">{injury.line}</p>
            <p className="mt-2 text-xs leading-6 text-[var(--home-ink-muted)]">{injury.note}</p>
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { value: "3", label: "Round 1 flips from TZ" },
          { value: "−9%", label: "Arizona's Final Four penalty" },
          { value: "0%", label: "Duke's total penalty" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-4"
          >
            <p className="text-2xl font-semibold tabular-nums text-[var(--home-signal)]">{metric.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">{metric.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]">
          Bracket Flips
        </p>
        <div className="space-y-3">
          {flips.map((impact) => (
            <div
              key={`${impact.team}-${impact.site}`}
              className="grid gap-2 rounded-[var(--radius-3xl)] border border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))] px-4 py-4 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)_auto]"
            >
              <span className="text-sm font-semibold text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]">{impact.team}</span>
              <span className="text-xs leading-6 text-[var(--home-ink-muted)]">
                {impact.home} → {impact.site} · {impact.zones} zone{impact.zones > 1 ? "s" : ""}{" "}
                {impact.direction}
                {impact.final ? " · final slot" : ""}
              </span>
              <span className="text-sm font-semibold tabular-nums text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]">{impact.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-[var(--home-ink-muted)]">
          Other Impacts
        </p>
        <div className="space-y-3">
          {others.map((impact) => (
            <div
              key={`${impact.team}-${impact.site}`}
              className="grid gap-2 rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-4 lg:grid-cols-[minmax(0,120px)_minmax(0,140px)_minmax(0,1fr)_auto]"
            >
              <span className="text-sm font-medium text-[var(--home-ink)]">{impact.team}</span>
              <span className="text-xs text-[var(--home-ink-muted)]">
                {impact.home} → {impact.site.split(" ")[0]}
              </span>
              <span className="text-xs leading-6 text-[var(--home-ink-muted)]">{impact.note}</span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  impact.pct <= -6
                    ? "text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]"
                    : impact.pct <= -3
                      ? "text-[var(--home-signal)]"
                      : "text-[var(--home-ink-muted)]"
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

function RegionBracket({ data }: { data: RegionData }) {
  const siteMap: Record<string, { r1a: string; r1b: string; r1c: string; r1d: string }> = {
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

  const sites = siteMap[data.region.toLowerCase()] ?? { r1a: "", r1b: "", r1c: "", r1d: "" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--home-ink-muted)]">
        <Tag color="gray">{data.region}</Tag>
        <span>Regional site:</span>
        <span className="font-semibold text-[var(--home-signal)]">{data.site}</span>
        <span className="text-[var(--home-ink-soft)]">·</span>
        <span>Advancing:</span>
        <span className="font-semibold text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]">{data.winner}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_0.84fr]">
        <div className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] p-4">
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

        <div className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] p-4">
          <RoundLabel>Round 2</RoundLabel>
          {data.r2.map((matchup, index) => (
            <Matchup2 key={`r2-${index}`} {...matchup} />
          ))}
          <RoundLabel>Sweet 16: {data.site}</RoundLabel>
          {data.s16.map((matchup, index) => (
            <Matchup2 key={`s16-${index}`} {...matchup} />
          ))}
        </div>

        <div className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] p-4">
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

  const groupMeta: Record<
    PickEntry["group"],
    {
      label: string;
      sublabel: string;
      headingClass: string;
      openSurface: string;
      openBorder: string;
    }
  > = {
    tz: {
      label: "Time Zone Upsets",
      sublabel: "Bracket reversals driven by travel penalty.",
      headingClass: "text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]",
      openSurface: "bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))]",
      openBorder: "border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))]",
    },
    analytics: {
      label: "Analytics Upsets",
      sublabel: "KenPom, S-curve, and Trapezoid-driven calls.",
      headingClass: "text-[color-mix(in_srgb,var(--home-ink)_75%,var(--home-stone))]",
      openSurface: "bg-[color-mix(in_srgb,var(--home-ink)_7%,var(--home-paper-alt))]",
      openBorder: "border-[color-mix(in_srgb,var(--home-ink)_25%,var(--home-rule))]",
    },
    confirm: {
      label: "Final Four Picks",
      sublabel: "Chalk calls the model supports strongly.",
      headingClass: "text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]",
      openSurface: "bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))]",
      openBorder: "border-[color-mix(in_srgb,var(--home-positive)_30%,var(--home-rule))]",
    },
  };

  const badgeClasses: Record<PickEntry["badge"], string> = {
    FLIP: "border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]",
    UPGRADE: "border-[color-mix(in_srgb,var(--home-positive)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]",
    DOWNGRADE: "border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]",
    CONFIRM: "border-[color-mix(in_srgb,var(--home-positive)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]",
    LOCKED: "border-[color-mix(in_srgb,var(--home-positive)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_10%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]",
    WATCH: "border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] text-[var(--home-signal)]",
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { value: "9", sub: "TZ-driven picks", tone: "text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]" },
          { value: "7", sub: "Analytics-driven picks", tone: "text-[color-mix(in_srgb,var(--home-ink)_75%,var(--home-stone))]" },
          { value: "4", sub: "Final Four picks", tone: "text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]" },
          { value: "0%", sub: "Duke's total TZ penalty", tone: "text-[var(--home-signal)]" },
        ].map((metric) => (
          <div key={metric.sub} className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-4">
            <p className={`text-2xl font-semibold tabular-nums ${metric.tone}`}>{metric.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">{metric.sub}</p>
          </div>
        ))}
      </div>

      {(["tz", "analytics", "confirm"] as const).map((group) => {
        const meta = groupMeta[group];
        const items = PICKS.filter((pick) => pick.group === group);

        return (
          <div key={group} className="space-y-3">
            <div>
              <p className={`text-2xs font-semibold uppercase tracking-[0.18em] ${meta.headingClass}`}>
                {meta.label}
              </p>
              <p className="mt-1 text-sm text-[var(--home-ink-muted)]">{meta.sublabel}</p>
            </div>

            {items.map((item, index) => {
              const id = `${group}-${index}`;
              const isOpen = expanded === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => togglePick(id, isOpen)}
                  className={`w-full rounded-[var(--radius-3xl)] border px-4 py-4 text-left transition ${
                    isOpen
                      ? `${meta.openSurface} ${meta.openBorder}`
                      : "border-[var(--home-rule)] bg-[var(--home-overlay)] hover:border-[color-mix(in_srgb,var(--home-ink)_20%,var(--home-rule))] hover:bg-[var(--home-overlay)]"
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-3xs font-semibold uppercase tracking-[0.14em] ${badgeClasses[item.badge]}`}
                    >
                      {item.badge}
                    </span>
                    <Tag color="gray">{item.round}</Tag>
                    <Tag color="gray">{item.region}</Tag>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-[var(--home-ink)]">{item.pick}</span>
                    <span className={`text-lg text-[var(--home-ink-soft)] transition ${isOpen ? "rotate-90" : ""}`}>›</span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[var(--home-ink-muted)]">{item.reason}</p>

                  {isOpen ? (
                    <div className="mt-4 border-t border-[var(--home-rule)] pt-4 text-sm leading-7 text-[var(--home-ink-muted)]">
                      {item.body}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-4">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-soft)]">Legend</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { label: "FLIP", className: badgeClasses.FLIP, desc: "Time zone penalty reversal" },
            { label: "UPGRADE", className: badgeClasses.UPGRADE, desc: "Better than their seeding" },
            { label: "DOWNGRADE", className: badgeClasses.DOWNGRADE, desc: "Worse than their seeding" },
            { label: "WATCH", className: badgeClasses.WATCH, desc: "Notable risk or edge" },
            { label: "LOCKED", className: badgeClasses.LOCKED, desc: "High-conviction chalk" },
          ].map((legendItem) => (
            <div
              key={legendItem.label}
              className="flex items-center gap-2 rounded-full border border-[var(--home-rule)] bg-black/10 px-3 py-2"
            >
              <span
                className={`inline-flex rounded-full border px-2 py-1 text-3xs font-semibold uppercase tracking-[0.14em] ${legendItem.className}`}
              >
                {legendItem.label}
              </span>
              <span className="text-xs text-[var(--home-ink-muted)]">{legendItem.desc}</span>
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

  const articleHref = `/writing/${MARCH_MADNESS_ARTICLE_SLUG}`;

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
    <section
      className="home-page min-h-screen text-[var(--home-ink)]"
      aria-label="March Madness bracket analysis"
      data-testid="march-madness-shell"
    >
      <div className="home-shell home-shell-wide home-section">
        <div className="space-y-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <SurfaceCard className="relative overflow-hidden p-6 sm:p-8">
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-center gap-3 text-2xs font-semibold uppercase tracking-[0.22em] text-[var(--home-signal)]">
                  <span>2026 NCAA Tournament</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--home-signal)]" />
                  <time dateTime={MARCH_MADNESS_UPDATED_AT}>{MARCH_MADNESS_UPDATED_LABEL}</time>
                </div>

                <div className="space-y-4">
                  <h1 className="text-[clamp(2.5rem,5vw,4.75rem)] font-bold leading-[0.95] tracking-tight text-[var(--home-ink)]">
                    March Madness
                    <span className="block text-[var(--home-signal)]">Bracket Analysis</span>
                  </h1>
                  <p className="max-w-[30ch] text-xl font-semibold leading-tight text-[var(--home-ink)] sm:text-2xl">
                    {MARCH_MADNESS_THESIS}
                  </p>
                  <p className="max-w-[64ch] text-sm leading-7 text-[var(--home-ink-muted)] sm:text-base">
                    A full 2026 bracket built from KenPom consensus metrics, S-curve seed errors,
                    injury context, and a custom time-zone travel penalty model. Best upset picks
                    and Final Four predictions included.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {HERO_TAGS.map((tag) => (
                    <Tag
                      key={tag}
                      color={
                        tag === "KenPom"
                          ? "amber"
                          : tag === "S-Curve"
                            ? "blue"
                            : tag === "Time Zones"
                              ? "green"
                              : "gray"
                      }
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={buildMarchMadnessHref({
                      view: "picks",
                      region,
                      analytics,
                      hash: "analysis-workspace",
                    })}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] px-5 py-2.5 text-sm font-semibold text-[var(--home-signal)] transition hover:bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))]"
                  >
                    See Best Upsets
                  </Link>
                  <Link
                    href={buildMarchMadnessHref({
                      view,
                      region,
                      analytics,
                      hash: "why-this-model-is-different",
                    })}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-overlay)] px-5 py-2.5 text-sm font-semibold text-[var(--home-ink)] transition hover:border-[color-mix(in_srgb,var(--home-ink)_20%,var(--home-rule))] hover:bg-[var(--home-overlay)]"
                  >
                    How The Model Works
                  </Link>
                  <Link
                    href={articleHref}
                    className="text-sm font-semibold text-[var(--home-ink-muted)] underline-offset-4 transition hover:text-[var(--home-ink)] hover:underline"
                  >
                    Read the companion article
                  </Link>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="bg-[color-mix(in_srgb,var(--home-positive)_6%,var(--home-paper-raised))] p-6 sm:p-7">
              <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]">
                National Champion Pick
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--home-ink)]">Duke Blue Devils</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--home-ink-muted)]">
                Duke is the cleanest title pick in the field: first across the blended metric set,
                zero total travel penalty, and the strongest defensive profile in the bracket.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["32-2", "Record"],
                  ["0%", "TZ Penalty"],
                  ["90.8", "Adj. Def. Eff. (#1)"],
                  ["+300", "Title Odds"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] px-4 py-3"
                  >
                    <p className="font-mono text-xl font-semibold tabular-nums text-[var(--home-signal)]">{value}</p>
                    <p className="mt-1 text-2xs uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">{label}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard id="top-upset-picks" className="space-y-6 p-5 sm:p-6">
            <SectionIntro
              eyebrow="Searchable hooks"
              title="Top upset picks for the 2026 March Madness bracket"
              description="These are the calls most likely to earn clicks and debate: one pure time-zone flip, one seed-line correction, and one late-bracket structural upset built on travel math."
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {TOP_UPSET_PICKS.map((card) => (
                <EditorialLinkCard key={card.title} card={card} />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard id="why-this-model-is-different" className="space-y-6 p-5 sm:p-6 scroll-mt-28">
            <SectionIntro
              eyebrow="Methodology"
              title="Why this model is different"
              description="Most brackets stop at seed lines and generic power ratings. This one blends consensus analytics with committee errors, roster context, and travel penalties that change game-day output."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {MODEL_PILLARS.map((card) => (
                <EditorialLinkCard key={card.title} card={card} />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-muted)]">
                  Share Layer
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--home-ink)]">
                  Give people something quotable to pass around
                </h2>
              </div>
              <Link
                href={articleHref}
                className="text-sm font-semibold text-[var(--home-ink-muted)] underline-offset-4 transition hover:text-[var(--home-ink)] hover:underline"
              >
                Read the written breakdown
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[var(--radius-3xl)] border border-[color-mix(in_srgb,var(--home-signal)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-signal)_10%,var(--home-paper-alt))] p-5">
                <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[var(--home-signal)]">
                  Bracket Thesis
                </p>
                <p className="mt-4 text-2xl font-semibold leading-tight text-[var(--home-ink)]">
                  “{MARCH_MADNESS_THESIS}”
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--home-ink)]">{BRACKET_THESIS_SHARE}</p>
              </div>

              <div className="rounded-[var(--radius-3xl)] border border-[color-mix(in_srgb,var(--home-negative)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_9%,var(--home-paper-alt))] p-5">
                <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]">
                  Best Upset Share Card
                </p>
                <p className="mt-4 text-2xl font-semibold leading-tight text-[var(--home-ink)]">UCF over UCLA</p>
                <p className="mt-3 text-sm leading-7 text-[var(--home-ink)]">{BEST_UPSET_SHARE}</p>
                <Link
                  href={buildMarchMadnessHref({
                    view: "picks",
                    region,
                    analytics,
                    hash: "analysis-workspace",
                  })}
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--home-ink)] underline-offset-4 transition hover:text-[var(--home-signal)] hover:underline"
                >
                  Open the picks board
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[var(--home-rule)] pt-4">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-overlay)] px-5 py-2.5 text-sm font-semibold text-[var(--home-ink)] transition hover:border-[color-mix(in_srgb,var(--home-ink)_20%,var(--home-rule))] hover:bg-[var(--home-overlay)]"
              >
                Copy current view link
              </button>
              <span className="break-all text-sm text-[var(--home-ink-muted)]">
                {copyStatus === "copied"
                  ? "Deep link copied."
                  : copyStatus === "error"
                    ? "Clipboard blocked. Copy the URL from the address bar."
                    : currentHref}
              </span>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Tag color="amber">Final Four</Tag>
              <span className="text-sm text-[var(--home-ink-muted)]">Indianapolis, IN (ET)</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {FINAL_FOUR_SUMMARY.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-3xl)] border border-[var(--home-rule)] bg-[var(--home-overlay)] p-4"
                >
                  <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-soft)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm text-[var(--home-ink-muted)]">{item.matchup}</p>
                  <p className="mt-2 text-lg font-semibold text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]">{item.winner}</p>
                  <p className="mt-2 text-xs text-[var(--home-ink-soft)]">{item.note}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <div id="analysis-workspace" className="space-y-4 scroll-mt-28">
            <TabBar
              items={MAIN_TAB_ITEMS}
              active={view}
              onChange={(nextView) => updateRouteState({ view: nextView })}
              label="March Madness primary sections"
            />

            {view === "bracket" ? (
              <SurfaceCard className="space-y-5 p-5 sm:p-6">
                <TabBar
                  items={REGION_TAB_ITEMS}
                  active={region}
                  onChange={(nextRegion) => updateRouteState({ region: nextRegion })}
                  label="March Madness regions"
                />
                <RegionBracket data={BRACKET[region]} />
              </SurfaceCard>
            ) : null}

            {view === "picks" ? (
              <SurfaceCard className="p-5 sm:p-6">
                <PicksSection />
              </SurfaceCard>
            ) : null}

            {view === "analytics" ? (
              <SurfaceCard className="space-y-5 p-5 sm:p-6">
                <TabBar
                  items={ANALYTICS_TAB_ITEMS}
                  active={analytics}
                  onChange={(nextAnalytics) => updateRouteState({ analytics: nextAnalytics })}
                  label="March Madness analytics sections"
                />
                {analytics === "rankings" ? <RankingsSection /> : null}
                {analytics === "s-curve" ? <SCurveSection /> : null}
                {analytics === "injuries" ? <InjuriesSection /> : null}
              </SurfaceCard>
            ) : null}

            {view === "time-zones" ? (
              <SurfaceCard className="p-5 sm:p-6">
                <TZSection />
              </SurfaceCard>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--home-rule)] pt-6 text-xs text-[var(--home-ink-soft)]">
            <span>Sources: KenPom · ESPN BPI · T-Rank · NCAA NET · Evan Miya · SOR · WAB · VSIN Lines</span>
            <span>2026 NCAA Tournament · Isaac Vazquez</span>
          </div>
        </div>
      </div>
    </section>
  );
}
