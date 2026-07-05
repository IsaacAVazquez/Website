"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { CrestAvatar } from "./CrestAvatar";
import { TeamResultPill } from "./TeamResultPill";
import { StatFascia, type StatFasciaItem } from "./StatFascia";
import type { GenericFixture } from "./FixtureCard";

export interface ClubDrawerScorer {
  name: string;
  goals: number;
  assists: number;
}

export interface ClubDrawerClub {
  /**
   * Must match the id used on `recentFixtures`/`upcomingFixtures`'
   * `homeTeam.id`/`awayTeam.id` (football-data.org's numeric team id) so
   * `DrawerFixtureRow` can tell home from away — for La Liga that is
   * `teamSnapshot.team.id`, NOT the TLA-based standings-row id used for
   * routing/crest lookups.
   */
  id: string;
  name: string;
  crest: string | null;
  /** Brand accent hex resolved from `src/data/clubColors.ts`, or null/undefined to fall back to a neutral token. Rendered only as a thin top rail, never a decorative wash. */
  accentColor?: string | null;
  position: number;
  points: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  manager?: string | null;
  venue?: string | null;
}

const KICKOFF_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

function formatKickoff(utcDate: string): string {
  const date = new Date(utcDate);
  return Number.isNaN(date.getTime()) ? "Time TBD" : KICKOFF_FORMATTER.format(date);
}

function formatFixed(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}

function DrawerFixtureRow({ fixture, clubId }: { fixture: GenericFixture; clubId: string }) {
  const isHome = fixture.homeTeam.id === clubId;
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam;
  const isFinal = fixture.status === "FINISHED";
  const goalsFor = isHome ? fixture.score.home : fixture.score.away;
  const goalsAgainst = isHome ? fixture.score.away : fixture.score.home;
  const win = isFinal && goalsFor !== null && goalsAgainst !== null && goalsFor > goalsAgainst;
  const loss = isFinal && goalsFor !== null && goalsAgainst !== null && goalsAgainst > goalsFor;

  return (
    <div className="grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-[color-mix(in_srgb,var(--home-rule)_50%,transparent)] py-2.5 last:border-b-0">
      <span
        className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--home-rule)] font-mono text-3xs text-[var(--home-ink-muted)]"
        aria-label={isHome ? "Home fixture" : "Away fixture"}
      >
        {isHome ? "H" : "A"}
      </span>
      <span className={`truncate text-sm font-semibold ${isFinal ? "text-[var(--home-ink)]" : "text-[var(--home-ink-muted)]"}`}>
        {opponent.shortName}
      </span>
      {isFinal ? (
        <span
          className="font-mono text-sm tabular-nums"
          style={{ color: win ? "var(--home-positive)" : loss ? "var(--home-negative)" : "var(--home-ink)" }}
        >
          {goalsFor ?? "–"}
          <span className="px-px text-[var(--home-ink-muted)]">–</span>
          {goalsAgainst ?? "–"}
        </span>
      ) : (
        <span className="font-mono text-2xs text-[var(--home-ink-muted)]">{formatKickoff(fixture.utcDate)}</span>
      )}
    </div>
  );
}

/**
 * Club detail drawer — the standings' drill-down, opened by selecting a
 * clickable club row. Built on the same pattern as
 * `src/components/fantasy/PlayerDetailDrawer.tsx` (Framer Motion,
 * `useReducedMotion`, manual focus trap, Escape + backdrop close,
 * `role="dialog" aria-modal="true"`), with a body-scroll lock added to match
 * the design mirror's overlay behavior. `club` is `null` when nothing is
 * selected, which also fully unmounts the drawer via `AnimatePresence`.
 */
export function ClubDrawer({
  club,
  formSequence,
  topScorers,
  recentFixtures,
  upcomingFixtures,
  isLoadingDetail = false,
  detailError = null,
  onClose,
  testId,
}: {
  club: ClubDrawerClub | null;
  formSequence: Array<"W" | "D" | "L">;
  topScorers: ClubDrawerScorer[];
  recentFixtures: GenericFixture[];
  upcomingFixtures: GenericFixture[];
  isLoadingDetail?: boolean;
  detailError?: string | null;
  onClose: () => void;
  /** Optional `data-testid` on the drawer panel, for e2e coverage. */
  testId?: string;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = Boolean(club);

  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, club?.id]);

  if (!club) return null;

  const ppg = club.played > 0 ? club.points / club.played : 0;
  const metrics: StatFasciaItem[] = [
    { eyebrow: "Played", metric: String(club.played) },
    { eyebrow: "Points", metric: String(club.points) },
    { eyebrow: "Record", metric: `${club.won}-${club.draw}-${club.lost}` },
    { eyebrow: "Rank", metric: `#${String(club.position).padStart(2, "0")}` },
    { eyebrow: "Goals for", metric: String(club.goalsFor) },
    { eyebrow: "Goals against", metric: String(club.goalsAgainst) },
    { eyebrow: "Goal diff", metric: club.goalDifference > 0 ? `+${club.goalDifference}` : String(club.goalDifference) },
    { eyebrow: "Points / game", metric: formatFixed(ppg) },
  ];
  const metaLine = [club.manager, club.venue].filter(Boolean).join(" · ");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-stretch sm:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          <button
            type="button"
            aria-label="Close club detail"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default"
            style={{ background: "color-mix(in srgb, var(--home-ink) 34%, transparent)" }}
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${club.name} detail`}
            data-testid={testId}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
            transition={{ duration: reduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-[88vh] w-full flex-col overflow-y-auto rounded-t-[var(--radius-3xl)] border outline-none sm:max-h-none sm:h-full sm:w-[27rem] sm:rounded-l-[var(--radius-3xl)] sm:rounded-tr-none"
            style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", boxShadow: "var(--shadow-xl)" }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: club.accentColor || "var(--home-rule)" }}
            />

            <div className="relative border-b border-[var(--home-rule)] px-5 pb-4.5 pt-6">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-2 top-2 inline-flex min-h-touch min-w-touch items-center justify-center rounded-full border transition-colors"
                style={{ borderColor: "var(--home-rule)", background: "var(--home-paper)", color: "var(--home-ink-muted)" }}
              >
                <X size={16} aria-hidden="true" />
              </button>
              <div className="flex items-center gap-3.5">
                <CrestAvatar crest={club.crest} name={club.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-3xs uppercase tracking-[0.1em] text-[var(--home-ink-muted)]">
                    #{String(club.position).padStart(2, "0")} · {club.points} pts
                  </p>
                  <h2 className="mt-1 truncate text-xl font-bold tracking-tight text-[var(--home-ink)]">{club.name}</h2>
                  {formSequence.length > 0 ? (
                    <div className="mt-2 flex gap-1.5">
                      {formSequence.map((result, index) => (
                        <TeamResultPill key={`${result}-${index}`} result={result} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              {metaLine ? (
                <p className="mt-3 font-mono text-3xs uppercase tracking-[0.05em] text-[var(--home-ink-muted)]">
                  {metaLine}
                </p>
              ) : null}
            </div>

            <StatFascia items={metrics} dense className="border-x-0 border-t-0" />

            {isLoadingDetail || detailError ? (
              <p
                className="px-5 py-3 text-sm text-[var(--home-ink-muted)]"
                role={detailError ? "alert" : "status"}
                aria-live="polite"
              >
                {detailError || "Loading club fixtures…"}
              </p>
            ) : null}

            {topScorers.length > 0 && (
              <div className="border-b border-[color-mix(in_srgb,var(--home-rule)_55%,transparent)] px-5 py-4">
                <h3 className="font-mono text-3xs font-normal uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                  Top scorers
                </h3>
                <div className="mt-3">
                  {topScorers.map((player, index) => (
                    <div
                      key={`${player.name}-${index}`}
                      className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--home-rule)_50%,transparent)] py-2.5 last:border-b-0"
                    >
                      <span className="w-5 flex-shrink-0 font-mono text-sm text-[var(--home-ink-muted)]">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--home-ink)]">
                        {player.name}
                      </span>
                      <span className="flex-shrink-0 font-mono text-sm text-[var(--home-ink-muted)] tabular-nums">
                        <span className="text-[var(--home-ink)]">{player.goals}</span> G · {player.assists} A
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(recentFixtures.length > 0 || upcomingFixtures.length > 0) && (
              <div className="px-5 py-4">
                <h3 className="font-mono text-3xs font-normal uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                  Fixtures
                </h3>
                <div className="mt-3">
                  {recentFixtures.map((fixture) => (
                    <DrawerFixtureRow key={fixture.id} fixture={fixture} clubId={club.id} />
                  ))}
                  {upcomingFixtures.map((fixture) => (
                    <DrawerFixtureRow key={fixture.id} fixture={fixture} clubId={club.id} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
