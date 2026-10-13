"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { ExternalLink } from "lucide-react";
import { ResultsTape, type ResultsTapeFixture } from "./ResultsTape";
import { GoalsPulseStrip, type GoalsPulseEntry } from "./GoalsPulseStrip";
import { SegmentedTabs } from "./SegmentedTabs";
import { FixtureLedgerSection } from "./FixtureLedger";
import { groupFixturesByMatchday } from "./fixtureLedgerUtils";
import { LeaderLedger, type LeaderLedgerEntry } from "./LeaderLedger";
import { PointsLadder } from "./PointsLadderChart";
import { LEAGUE_ZONE_LABEL, leagueZone, type LeagueZone } from "./ladderGeometry";
import { useKeepPressedInView } from "./useKeepPressedInView";
import type { GenericFixture } from "./FixtureCard";
import "./league-table.css";

export type FormResult = "W" | "D" | "L";

/** One standings row, in the shape both leagues map their snapshot into. */
export interface LeagueTableRow {
  id: string;
  position: number;
  name: string;
  shortName: string;
  /** The competition's three-letter code, for the ladder's labels. */
  code: string;
  crest: string | null;
  accentColor: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** The last five league results, oldest first. Empty when the snapshot has none. */
  form: FormResult[];
}

export interface LeagueTableConfig {
  /** The page's h1. */
  title: string;
  /** The league's own name, for the table's accessible name and the ladder's title. */
  leagueName: string;
  standfirst: string;
  /** Prefix for the tab ids, so the two routes never share an id. */
  idPrefix: string;
  officialHref: string;
  /** Screen-reader text after "Official", naming where the link goes. */
  officialLabel: string;
}

export type LeagueDetailTab = "fixtures" | "scorers";

interface LeagueTableBoardProps<V extends string> {
  config: LeagueTableConfig;
  /** Every club in table order. */
  rows: LeagueTableRow[];
  /** The ids the active view shows, in table order. */
  visibleIds: ReadonlySet<string>;
  views: ReadonlyArray<{ id: V; label: string; count: number }>;
  activeView: V;
  onViewChange: (view: V) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  detail: LeagueDetailTab;
  onDetailChange: (detail: LeagueDetailTab) => void;
  matchday: number | null;
  updatedLabel: string;
  recentFixtures: Array<GenericFixture & ResultsTapeFixture>;
  upcomingFixtures: Array<GenericFixture & ResultsTapeFixture>;
  goalsPerMatchday: GoalsPulseEntry[];
  scorers: LeaderLedgerEntry[];
  assists: LeaderLedgerEntry[];
  /** The club drawer, rendered inside the root so it reads the route's palette. */
  drawer: ReactNode;
}

const RESULT_WORD: Record<FormResult, string> = { W: "won", D: "drew", L: "lost" };

const ZONES_IN_LEGEND: LeagueZone[] = ["champions", "europa", "conference", "relegation"];

function formatGoalDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * The league table page both football routes render: a title row, the
 * results ticker and goals sparkline as the table's header strip, the
 * standings with the zones printed behind the rows and each club's last five,
 * the points ladder beside it, and the fixtures and scorers tabs under it.
 * Each route owns its URL state and maps its snapshot into these props.
 */
export function LeagueTableBoard<V extends string>({
  config,
  rows,
  visibleIds,
  views,
  activeView,
  onViewChange,
  selectedId,
  onSelect,
  detail,
  onDetailChange,
  matchday,
  updatedLabel,
  recentFixtures,
  upcomingFixtures,
  goalsPerMatchday,
  scorers,
  assists,
  drawer,
}: LeagueTableBoardProps<V>) {
  const clubCount = rows.length;
  const visibleRows = rows.filter((row) => visibleIds.has(row.id));
  // The locale is named so the server and the browser sort alike.
  const lookupClubs = useMemo(() => rows.toSorted((a, b) => a.name.localeCompare(b.name, "en")), [rows]);
  // Memoized on the rows, so the ladder's own layout memo holds across drawer
  // opens, tab switches, and the club snapshot loading.
  const ladderClubs = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        position: row.position,
        points: row.points,
        label: row.code || row.shortName,
        accentColor: row.accentColor,
      })),
    [rows]
  );
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableOverflows = useOverflowX(tableScrollRef);
  const viewSwitchRef = useRef<HTMLDivElement>(null);
  useKeepPressedInView(viewSwitchRef, activeView);
  const lastMatchday = goalsPerMatchday.at(-1)?.matchday;
  const statusLine = [
    matchday ? `Matchday ${matchday} of 38` : null,
    `updated ${updatedLabel}`,
    "from a checked-in football-data.org snapshot",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="lt-root">
      <div className="c97-shell c97-frame lt-column">
        <div className="lt-titlebar">
          <div className="lt-titlebar-text">
            <h1 className="lt-title">{config.title}</h1>
            <p className="lt-standfirst">{config.standfirst}</p>
            <p className="lt-status">{statusLine}</p>
          </div>
          {clubCount > 0 ? (
            // It opens on the button and not on the select, because a
            // keyboard walks a closed select one club at a time.
            <form
              className="lt-lookup"
              onSubmit={(event) => {
                event.preventDefault();
                const clubId = new FormData(event.currentTarget).get("club");
                if (typeof clubId === "string" && clubId) onSelect(clubId);
              }}
            >
              <label className="lt-lookup-label">
                <span>Find a club</span>
                <select name="club" className="lt-select" defaultValue={selectedId ?? undefined}>
                  {lookupClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="lt-button">
                Open club
              </button>
            </form>
          ) : null}
        </div>

        {clubCount === 0 ? (
          <p className="lt-empty">The table fills in once the next standings snapshot publishes.</p>
        ) : (
          <>
            <div className="lt-strip">
              <ResultsTape
                recentFixtures={recentFixtures}
                upcomingFixtures={upcomingFixtures}
                label={matchday ? `Matchday ${matchday}` : "Latest"}
                className="lt-strip-tape"
              />
              <GoalsPulseStrip
                data={goalsPerMatchday}
                capLabel={lastMatchday ? `MD 1 to ${lastMatchday}` : undefined}
                className="lt-strip-pulse"
              />
            </div>

            <section className="lt-board" aria-labelledby={`${config.idPrefix}-standings-heading`}>
              <div className="lt-toolbar">
                <h2 id={`${config.idPrefix}-standings-heading`} className="lt-h2">
                  Standings
                </h2>
                <div ref={viewSwitchRef} className="lt-switch" role="group" aria-label="Table view">
                  {views.map((view) => (
                    <button
                      key={view.id}
                      type="button"
                      aria-pressed={view.id === activeView}
                      onClick={() => onViewChange(view.id)}
                    >
                      {view.label} <span className="lt-switch-count">{view.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lt-board-grid">
                <div className="lt-table-column">
                  {/* A scroll stop only while the table is wider than its column,
                      so a keyboard on a wide screen goes straight to the rows. */}
                  <div
                    ref={tableScrollRef}
                    className="lt-table-scroll"
                    {...(tableOverflows
                      ? { role: "region", tabIndex: 0, "aria-label": `${config.leagueName} standings (scrollable)` }
                      : {})}
                  >
                    <table className="lt-table" aria-label={`${config.leagueName} standings`}>
                      <thead>
                        <tr>
                          <th scope="col" className="lt-col-pos">
                            <abbr title="Position">#</abbr>
                          </th>
                          <th scope="col" className="lt-col-club">Club</th>
                          <th scope="col" className="lt-num">
                            <abbr title="Played">P</abbr>
                          </th>
                          <th scope="col" className="lt-num lt-sm">
                            <abbr title="Won">W</abbr>
                          </th>
                          <th scope="col" className="lt-num lt-sm">
                            <abbr title="Drawn">D</abbr>
                          </th>
                          <th scope="col" className="lt-num lt-sm">
                            <abbr title="Lost">L</abbr>
                          </th>
                          <th scope="col" className="lt-num lt-md">
                            <abbr title="Goals for">GF</abbr>
                          </th>
                          <th scope="col" className="lt-num lt-md">
                            <abbr title="Goals against">GA</abbr>
                          </th>
                          <th scope="col" className="lt-num">
                            <abbr title="Goal difference">GD</abbr>
                          </th>
                          <th scope="col" className="lt-num">
                            <abbr title="Points">Pts</abbr>
                          </th>
                          <th scope="col" className="lt-col-form lt-sm">
                            Last 5
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((row) => {
                          const zone = leagueZone(row.position, clubCount);
                          const isSelected = row.id === selectedId;
                          return (
                            <tr key={row.id} data-zone={zone} data-selected={isSelected || undefined}>
                              <td className="lt-col-pos">
                                {row.position}
                                {zone !== "midtable" ? (
                                  <span className="sr-only">, {LEAGUE_ZONE_LABEL[zone]}</span>
                                ) : null}
                              </td>
                              <td className="lt-col-club">
                                <button
                                  type="button"
                                  className="lt-club"
                                  onClick={() => onSelect(row.id)}
                                  aria-pressed={isSelected}
                                  aria-label={`Show ${row.name} details`}
                                >
                                  {row.crest ? (
                                    <img src={row.crest} alt="" loading="lazy" decoding="async" className="lt-crest" />
                                  ) : (
                                    <span className="lt-crest" aria-hidden="true" />
                                  )}
                                  <span className="lt-club-name">{row.shortName}</span>
                                </button>
                              </td>
                              <td className="lt-num">{row.played}</td>
                              <td className="lt-num lt-sm">{row.won}</td>
                              <td className="lt-num lt-sm">{row.draw}</td>
                              <td className="lt-num lt-sm">{row.lost}</td>
                              <td className="lt-num lt-md">{row.goalsFor}</td>
                              <td className="lt-num lt-md">{row.goalsAgainst}</td>
                              <td className="lt-num">{formatGoalDifference(row.goalDifference)}</td>
                              <td className="lt-num lt-points">{row.points}</td>
                              <td className="lt-col-form lt-sm">
                                {row.form.length > 0 ? (
                                  <span className="lt-form">
                                    {row.form.map((result, index) => (
                                      <span
                                        key={index}
                                        className="lt-form-mark"
                                        data-result={result}
                                        data-latest={index === row.form.length - 1 || undefined}
                                        aria-hidden="true"
                                      >
                                        {result}
                                      </span>
                                    ))}
                                    <span className="sr-only">
                                      {`Last ${row.form.length}, oldest first, latest last: ${row.form.map((result) => RESULT_WORD[result]).join(", ")}`}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="lt-muted">No results yet</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <ul className="lt-legend">
                    {ZONES_IN_LEGEND.map((zone) => (
                      <li key={zone} data-zone={zone}>
                        {LEAGUE_ZONE_LABEL[zone]}
                      </li>
                    ))}
                    <li className="lt-legend-form">Last 5 reads oldest to newest</li>
                  </ul>
                </div>

                <div className="lt-ladder-column">
                  <h3 className="lt-h3">Points ladder</h3>
                  <p className="lt-caption">
                    Every club placed by points, so the gap to each line reads as distance.
                  </p>
                  <PointsLadder
                    clubs={ladderClubs}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    title={`${config.leagueName} points ladder`}
                  />
                </div>
              </div>
            </section>

            <section className="lt-detail" aria-labelledby={`${config.idPrefix}-detail-heading`}>
              <div className="lt-toolbar lt-toolbar--static">
                <h2 id={`${config.idPrefix}-detail-heading`} className="lt-h2">
                  Fixtures and scorers
                </h2>
                <SegmentedTabs
                  tabs={[
                    { id: "fixtures", label: "Fixtures" },
                    { id: "scorers", label: "Top scorers" },
                  ]}
                  activeId={detail}
                  onChange={(id) => onDetailChange(id as LeagueDetailTab)}
                  ariaLabel="Fixtures and scorers"
                  idPrefix={`${config.idPrefix}-detail-tab`}
                  panelId={`${config.idPrefix}-detail-panel`}
                  className="lt-switch"
                />
              </div>

              <div
                id={`${config.idPrefix}-detail-panel`}
                role="tabpanel"
                aria-labelledby={`${config.idPrefix}-detail-tab-${detail}`}
                className="lt-detail-panel"
              >
                {detail === "fixtures" ? (
                  <div className="lt-pair">
                    <div>
                      <h3 className="lt-h3">Latest results</h3>
                      <FixtureLedgerSection
                        groups={groupFixturesByMatchday(recentFixtures)}
                        onOpenTeam={onSelect}
                        emptyLabel="No results are in this snapshot yet."
                      />
                    </div>
                    <div>
                      <h3 className="lt-h3">Upcoming fixtures</h3>
                      <FixtureLedgerSection
                        groups={groupFixturesByMatchday(upcomingFixtures)}
                        onOpenTeam={onSelect}
                        emptyLabel="No upcoming fixtures are in this snapshot yet."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="lt-pair">
                      <LeaderLedger
                        title="Top scorers"
                        unit="G"
                        entries={scorers}
                        emptyLabel="No scorers recorded yet this season."
                      />
                      <LeaderLedger
                        title="Most assists"
                        unit="A"
                        entries={assists}
                        emptyLabel="No assists recorded yet this season."
                      />
                    </div>
                    <a href={config.officialHref} target="_blank" rel="noreferrer" className="lt-link">
                      Official
                      <span className="sr-only"> {config.officialLabel} (opens in a new tab)</span>
                      <span aria-hidden="true"> stats</span>
                      <ExternalLink className="lt-link-icon" aria-hidden="true" />
                    </a>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
      {drawer}
    </div>
  );
}

/**
 * True while the element is wider inside than out, measured on mount and on
 * every resize. It starts false on the server and the first client render, so
 * the markup hydrates the same either way.
 */
function useOverflowX(ref: RefObject<HTMLElement | null>): boolean {
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return overflows;
}
