"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Formula1ConstructorStanding, Formula1DriverStanding } from "@/types/formula1";
import { timingTower, formatDeficit } from "./timingTower";
import styles from "./formula-1.module.css";

type Standing = Formula1DriverStanding | Formula1ConstructorStanding;

interface TimingTowerSignatureProps {
  standings: Standing[];
  kind: "drivers" | "constructors";
  /** The full table for this tower, which a phone's shortened tower links to. */
  fullTableHref: string;
}

/**
 * How many rows a phone prints. A tower only a row or two longer prints whole,
 * so the eleven constructors are never cut to ten.
 */
const PHONE_ROWS = 10;

function rowLabel(row: Standing): { name: string; code: string | null } {
  if ("driverName" in row) {
    return { name: row.driverName, code: row.acronym ?? String(row.driverNumber) };
  }
  return { name: row.teamName, code: null };
}

function movementGlyph(movement: number | null): string {
  if (movement === null) return "•";
  if (movement > 0) return "▲";
  if (movement < 0) return "▼";
  return "•";
}

/**
 * The page's signature. A broadcast-style timing tower: position, a livery
 * stripe, the gap to the leader, the interval to the car ahead, and this
 * round's movement. It follows whichever of the Drivers or Constructors
 * views is active, and drivers otherwise. It is a read-only picture of the
 * standings, pointer- and glance-only; the full driver or constructor list
 * below, in real markup, is the keyboard and screen-reader path to the same
 * numbers. A phone prints the top ten and links to that list, so the tower
 * stays about one screen tall there.
 */
export function TimingTowerSignature({ standings, kind, fullTableHref }: TimingTowerSignatureProps) {
  const rows = useMemo(() => timingTower(standings), [standings]);
  const shortOnPhone = rows.length > PHONE_ROWS + 2;

  if (rows.length === 0) {
    return <p className="c97-meta">Standings have not published for this season yet.</p>;
  }

  const summaryLabel =
    kind === "drivers"
      ? `Driver championship timing tower, ${rows.length} drivers, leader ${rowLabel(rows[0]).name}`
      : `Constructor championship timing tower, ${rows.length} teams, leader ${rowLabel(rows[0]).name}`;

  return (
    <div
      data-c97-surface="paper"
      className="c97-offset"
      style={{ padding: "var(--c97-sp-3)" }}
    >
      <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
        {kind === "drivers" ? "Driver timing tower" : "Constructor timing tower"}
      </p>
      <ol className={styles.towerList} aria-label={summaryLabel}>
        <li className={`${styles.towerRow} ${styles.towerHead}`} aria-hidden="true">
          <span>P</span>
          <span>{kind === "drivers" ? "Driver" : "Team"}</span>
          <span className={styles.towerGap}>Gap</span>
          <span className={styles.towerInterval}>Int</span>
          <span />
        </li>
        {rows.map((row, index) => {
          const { name, code } = rowLabel(row);
          return (
            <li
              key={`${row.position}-${name}`}
              className={
                shortOnPhone && index >= PHONE_ROWS
                  ? `${styles.towerRow} ${styles.towerRowPastPhone}`
                  : styles.towerRow
              }
              style={{ borderLeftColor: row.livery ?? "var(--c97-ink-2)" }}
            >
              <span className={`c97-mono ${styles.towerPosition}`}>{row.position}</span>
              {/* On a phone the tower prints the three-letter code, as the broadcast graphic does. */}
              <span className={`c97-serif ${styles.towerName}`}>
                <span className={code ? styles.towerNameFull : undefined}>{name}</span>
                {code ? <span className={styles.towerCode}> {code}</span> : null}
              </span>
              <span className={styles.towerGap}>
                {row.position === 1 ? "Leader" : formatDeficit(row.gapToLeader)}
              </span>
              <span className={styles.towerInterval}>
                {row.intervalToAhead === null ? "—" : formatDeficit(row.intervalToAhead)}
              </span>
              <span className={styles.towerMovement} aria-hidden="true">
                {movementGlyph(row.movement)}
              </span>
            </li>
          );
        })}
      </ol>
      {shortOnPhone ? (
        <p className={styles.towerMore}>
          <span>
            Top {PHONE_ROWS} of {rows.length}
          </span>
          <Link href={fullTableHref} className="c97-btn-ghost">
            See all {rows.length} {kind === "drivers" ? "drivers" : "teams"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
