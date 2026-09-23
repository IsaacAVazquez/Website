"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Catalog97Shell } from "./Catalog97Shell";
import type { LiveToolGroup } from "@/constants/toolCategories";

const ALL = "all";

export interface Catalog97DashboardsProps {
  groups: LiveToolGroup[];
  /**
   * One-line summary per tool slug, so a tile can carry the design's blurb
   * rather than only a title. Missing slugs simply render without one.
   */
  summaries: Record<string, string>;
  /** Tabular readout per tool href, read from its snapshot. */
  cardLines: Record<string, string>;
  /** Newest snapshot time across the sources, already formatted in PT. */
  latestPull: string | null;
  /** Source name and formatted PT time, newest first. */
  pullLog: { label: string; time: string }[];
  /** The stale-price note, built from the investments price health. */
  staleNote: string | null;
}

/*
 * The mosaic's field cycle, one of each riso ink plus a bone rest, so no ink
 * takes more than a quarter of the 33 tiles.
 *
 * The cycle restarts inside each category run rather than running continuously
 * across the whole index. When it ran continuously it cut across the group
 * boundaries, so two adjacent tiles from different categories often shared a
 * field while one category was painted three different ways, and colour ended
 * up as the loudest signal on the page while carrying no information at all.
 * Restarting per run means the rhythm resets exactly where the heading does.
 *
 * Each run also starts one step further into the cycle than the run above it,
 * so the eight runs do not all open on the same ink. The runs do not need a
 * shared opening colour, because the heading above each one is what marks the
 * seam.
 */
const TILE_SURFACES = ["ink-blue", "ink-saffron", "bone", "ink-peach"] as const;

/**
 * The dashboard index, in the Catalog 97 language. This route is new — the
 * design calls for it, and the repo previously surfaced its live tools only
 * from the homepage directory.
 *
 * The mosaic is the design's own device: full-bleed color panels with a
 * hairline of paper between them, each declaring its own surface, so the grid
 * reads as inlaid fields rather than as cards. There is no border, radius, or
 * shadow anywhere in it.
 *
 * The route's mode is Operate, so the eight `classifyToolSlug` categories are
 * the page's primary structure rather than a label printed on each tile. Each
 * category is a headed run, which is what lets a visitor skip a whole group,
 * and it is why the tiles no longer repeat their category as a kicker: the
 * heading above the run already names it, eleven times over in the case of
 * Sports. Tool titles are `h3` under that `h2` so the document outline matches
 * what the page looks like.
 *
 * The category filter is the same control `/portfolio` runs over the same
 * `classifyToolSlug` buckets, which is why it is drawn the same way. It is what
 * makes Sports being eleven deep a state you chose rather than one imposed on
 * you, and it is the only thing on the route that lets a phone reduce what is
 * on screen. It is a client component for that one piece of state; everything
 * else here is static.
 *
 * The pull log, card readouts, and "Latest pull" time come from
 * `getSnapshotReadouts`, which reads the committed snapshots at build time.
 * Tools without a snapshot reader simply render no readout line.
 */
export function Catalog97Dashboards({
  groups,
  summaries,
  cardLines,
  latestPull,
  pullLog,
  staleNote,
}: Catalog97DashboardsProps) {
  const dataNotes = [
    {
      title: "One committed snapshot",
      body: "Most of the data is checked into the repo, so those pages never depend on a third party being awake when you visit them.",
    },
    {
      title: "Named sources",
      body: "football-data.org for both football leagues, Launch Library 2 for launches, and the BART public API for transit.",
    },
    {
      title: "Stale data is labeled",
      body:
        staleNote ??
        "A panel that could not refresh keeps its last snapshot and prints that snapshot's date.",
    },
  ];
  const toolCount = groups.reduce((sum, group) => sum + group.tools.length, 0);
  const [active, setActive] = useState<string>(ALL);

  const tabs = useMemo(
    () => [
      { id: ALL, label: "All", count: toolCount },
      ...groups.map((group) => ({
        id: group.id as string,
        label: group.label,
        count: group.tools.length,
      })),
    ],
    [groups, toolCount],
  );

  /*
   * The cycle offset is pinned to each group's position in the full list, not
   * to its position in the filtered list, so a run keeps the same colours
   * whether you are looking at all eight or at that one on its own. Filtering
   * should change what is on screen and nothing else.
   */
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group, index) => ({ group, cycleOffset: index }))
        .filter((entry) => active === ALL || entry.group.id === active),
    [groups, active],
  );

  return (
    <Catalog97Shell>
      {/* Hero */}
      <section
        className="c97-band"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-4)" }}
      >
        <div
          className="c97-shell"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "var(--c97-sp-5)",
            alignItems: "end",
          }}
        >
          <div>
            <p className="c97-kicker">Dashboards</p>
            <h1
              className="c97-display"
              style={{ marginTop: "var(--c97-sp-3)" }}
            >
              {toolCount} instruments I built, and I keep them running.
            </h1>
          </div>
          {latestPull ? (
            <div style={{ textAlign: "right" }}>
              <p className="c97-kicker">Latest pull</p>
              <p
                className="c97-serif c97-h3 c97-tabular"
                style={{ marginTop: "var(--c97-sp-1)" }}
              >
                {latestPull}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Filter row, the same control /portfolio runs over the same buckets. */}
      <section
        className="c97-band c97-band-continues"
        data-c97-surface="paper"
        style={{ paddingBottom: "var(--c97-sp-3)" }}
      >
        <div
          className="c97-shell"
          role="group"
          aria-label="Filter instruments by category"
          /*
           * Column gap sp-3, row gap sp-5, and the row wraps. All three are
           * load-bearing and each was measured.
           *
           * Single row is not reachable. Nine tabs measure 970px of buttons in
           * the 1080px shell, so the widest gap that fits them on one line is
           * 13px, and the spacing scale is frozen with nothing between sp-1 at
           * 10px and sp-2 at 17px.
           *
           * The row gap is a tap-target constraint rather than spacing.
           * `.c97-microlink` buys its 44px target with padding plus a negative
           * margin, so each tab's hit box is 50px tall while the text is about
           * 17px, and the rows have to clear 50px. This was sp-3 on both axes
           * and verified at 1440, where sp-3 is 32px and the rows sit 67px
           * apart. That verification never covered a phone. sp-3 clamps to 22px
           * at 320, which put the rows 39px apart and produced eight
           * overlapping pairs on this control. sp-5 is 40px there and holds
           * them 57px apart.
           *
           * Tightening the row gap is the other direction and is also wrong.
           * sp-2 was tried at desktop and put "Lifestyle" over both "All" and
           * "Fintech" by 15px vertically and 62px horizontally. Do not tighten
           * this to even up the wrap, and do not collapse the two axes back
           * into one `gap`.
           */
          style={{
            display: "flex",
            columnGap: "var(--c97-sp-3)",
            rowGap: "var(--c97-sp-5)",
            flexWrap: "wrap",
          }}
        >
          {tabs.map((tab) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(tab.id)}
                className="c97-microlink"
                style={{
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: "var(--c97-sp-1)",
                  color: selected ? "var(--c97-ink)" : "var(--c97-label)",
                }}
              >
                <span>{tab.label}</span>
                <span className="c97-tabular">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mosaic, as headed category runs */}
      <section
        className="c97-band c97-band-continues"
        data-c97-surface="paper"
        aria-label="Instruments by category"
      >
        <div
          className="c97-shell"
          style={{ display: "grid", gap: "var(--c97-sp-6)" }}
        >
          {visibleGroups.map(({ group, cycleOffset }) => (
            <div key={group.id}>
              <h2 className="c97-serif c97-h2">{group.label}</h2>
              <div
                className="c97-mosaic"
                style={{ marginTop: "var(--c97-sp-3)" }}
              >
                {group.tools.map((tool, index) => {
                  const surface =
                    TILE_SURFACES[(index + cycleOffset) % TILE_SURFACES.length];
                  const summary = summaries[tool.slug];
                  const readout = cardLines[tool.href];
                  const body = (
                    <div>
                      <h3 className="c97-serif c97-h3">{tool.title}</h3>
                      {summary ? (
                        <p
                          className="c97-prose"
                          style={{
                            marginTop: "var(--c97-sp-1)",
                            color: "var(--c97-ink-2)",
                            maxWidth: "var(--c97-measure-body)",
                          }}
                        >
                          {summary}
                        </p>
                      ) : null}
                      {readout ? (
                        <p
                          className="c97-meta c97-tabular"
                          style={{ marginTop: "var(--c97-sp-2)" }}
                        >
                          {readout}
                        </p>
                      ) : null}
                    </div>
                  );

                  return tool.isExternal ? (
                    <a
                      key={tool.slug}
                      href={tool.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-c97-surface={surface}
                      className="c97-tile"
                    >
                      {body}
                    </a>
                  ) : (
                    <Link
                      key={tool.slug}
                      href={tool.href}
                      data-c97-surface={surface}
                      className="c97-tile"
                    >
                      {body}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pull log. Its own band, because in the grid it read as an openable tile. */}
      {pullLog.length > 0 ? (
        <section className="c97-band" data-c97-surface="bone">
          <div className="c97-shell">
            <h2 className="c97-kicker">Pull log · times PT</h2>
            <dl
              style={{
                marginTop: "var(--c97-sp-2)",
                maxWidth: "var(--c97-measure-wide)",
              }}
            >
              {pullLog.map((entry) => (
                <div key={entry.label} className="c97-row">
                  <dt>{entry.label}</dt>
                  <dd className="c97-tabular" style={{ margin: 0 }}>
                    {entry.time}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {/* Vermilion line. Nothing on this band is smaller than --c97-fs-h2. */}
      <section
        className="c97-band c97-band-tall"
        data-c97-surface="ink-vermilion"
      >
        <div className="c97-shell">
          <p
            className="c97-serif c97-h2"
            style={{ maxWidth: "var(--c97-measure-tight)" }}
          >
            If a pull fails, the panel keeps the previous snapshot and shows its
            date.
          </p>
        </div>
      </section>

      {/* How the data works */}
      <section className="c97-band c97-band-taller" data-c97-surface="ink-blue">
        <div className="c97-shell">
          <h2 className="c97-serif c97-h2">How the data works</h2>
          <div className="c97-columns" style={{ marginTop: "var(--c97-sp-4)" }}>
            {dataNotes.map((note) => (
              <div key={note.title}>
                <h3 className="c97-serif c97-lead">{note.title}</h3>
                <p
                  className="c97-prose"
                  style={{
                    marginTop: "var(--c97-sp-1)",
                    color: "var(--c97-ink-2)",
                    maxWidth: "var(--c97-measure-body)",
                  }}
                >
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="c97-band" data-c97-surface="ink-saffron">
        <div
          className="c97-shell"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--c97-sp-3)",
            alignItems: "end",
            justifyContent: "space-between",
          }}
        >
          <p
            className="c97-serif c97-h2"
            style={{ maxWidth: "var(--c97-measure-body)" }}
          >
            The build notes behind most of these are in the writing archive.
          </p>
          <Link className="c97-btn c97-btn-invert" href="/writing">
            Read the writing
          </Link>
        </div>
      </section>
    </Catalog97Shell>
  );
}
