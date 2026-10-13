"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { Redo2, Undo2 } from "lucide-react";
import type { DraftPick, DraftSettings } from "@/types";
import { shortName, type LineupAssignment } from "@/lib/fantasyUtils";
import { calculateDraftOrder } from "../hooks/useDraftState";
import { formatClock, useDraftClock } from "./DraftClock";

/*
 * The parts of the room that are the same in every draft room on the site: the
 * scorebug, the last picks, the roster, and the pick grid. Each one is kit
 * markup with the room's values filled in, and none of them holds state the
 * room does not already have.
 */

const POSITION_CLASSES: Record<string, string> = {
  QB: "ffb-pos-qb",
  RB: "ffb-pos-rb",
  WR: "ffb-pos-wr",
  TE: "ffb-pos-te",
  K: "ffb-pos-k",
  DST: "ffb-pos-dst",
  FLX: "ffb-pos-flex",
};

/** The kit's position class, or nothing for a position the kit has no colour for. */
export function positionClass(position: string | undefined): string {
  return (position && POSITION_CLASSES[position]) || "";
}

const TALLY_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

/**
 * The clock cell reads the pick clock itself, so a tick renders this cell and
 * not the room around it. The clock is advisory and nothing fires at zero, so
 * it is muted while other teams pick and takes the highlighter only in the
 * last 15 seconds of the user's own pick.
 */
function ClockCell({
  secondsPerPick,
  mine,
  canBeUrgent,
}: {
  secondsPerPick: number;
  mine: boolean;
  canBeUrgent: boolean;
}) {
  const clock = useDraftClock();
  const urgent = canBeUrgent && !clock.isExpired && clock.secondsLeft <= 15;
  const tone = urgent ? "ffb-dt-is-urgent" : mine ? "" : "ffb-dt-is-quiet";

  return (
    <div
      className={`ffb-bug-seg ffb-dt-clock ${tone}`.trimEnd()}
      role="timer"
      aria-live="off"
      aria-label={
        clock.isExpired ? "Pick clock expired" : `${clock.secondsLeft} seconds left on the pick clock`
      }
    >
      <span className="ffb-bug-label">Clock</span>
      <p className="ffb-bug-value">
        {formatClock(Math.max(0, clock.secondsLeft))}
        <small>
          <span className="ffb-dt-short">{secondsPerPick}s advisory</span>
          <span className="ffb-dt-long">advisory · {secondsPerPick}s per pick</span>
        </small>
      </p>
    </div>
  );
}

export interface DraftScorebugProps {
  /** The pinned band, measured by the room so the board's bar and the rail pin under it. */
  sectionRef: Ref<HTMLElement>;
  /** The on-the-clock cell, which takes focus after a logged pick. */
  onClockRef: Ref<HTMLDivElement>;
  /** One sentence that changes only when a pick is logged or undone. */
  announcement: string;
  isComplete: boolean;
  currentPick: number;
  totalPicks: number;
  currentRound: number;
  rounds: number;
  onClockLabel: string;
  /** Null when the clock is off or the board is not ready. */
  clock: { secondsPerPick: number; mine: boolean; canBeUrgent: boolean } | null;
  nextTurn: { value: string; note: string };
  /** Players left on the board, or null while the board loads. */
  poolLeft: number | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewRoom: () => void;
}

/**
 * The scorebug: Pick, Round, On the clock, Clock, Your next turn, Pool, then
 * undo, redo, and New room. The section is not a live region, because it holds
 * the per-second clock. The hidden sentence carries the announcement instead.
 */
export function DraftScorebug({
  sectionRef,
  onClockRef,
  announcement,
  isComplete,
  currentPick,
  totalPicks,
  currentRound,
  rounds,
  onClockLabel,
  clock,
  nextTurn,
  poolLeft,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewRoom,
}: DraftScorebugProps) {
  return (
    <section ref={sectionRef} aria-label="Live draft status" className="ffb-sticky ffb-dt-statusbar">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className="ffb-bug ffb-dt-bug">
        {/* A finished draft has nobody on the clock and no next turn, so the bar is the pick
            counter and the pool, and the counter's cell takes the focus. */}
        <div
          ref={isComplete ? onClockRef : undefined}
          tabIndex={isComplete ? -1 : undefined}
          className="ffb-bug-seg"
        >
          <span className="ffb-bug-label">Pick</span>
          <p className="ffb-bug-value">
            {isComplete ? (
              "Done"
            ) : (
              <>
                {/* A phone cell is too narrow for the spaced form, and the counter must never truncate. */}
                <span className="ffb-only-phone">{`#${currentPick}/${totalPicks}`}</span>
                <span className="ffb-not-phone">{`#${currentPick} / ${totalPicks}`}</span>
              </>
            )}
          </p>
        </div>
        {isComplete ? null : (
          <div className="ffb-bug-seg">
            <span className="ffb-bug-label">Round</span>
            <p className="ffb-bug-value">
              {currentRound}
              <small>of {rounds}</small>
            </p>
          </div>
        )}
        {isComplete ? null : (
          <>
            <div ref={onClockRef} tabIndex={-1} className="ffb-bug-seg ffb-bug-live">
              <span className="ffb-bug-label">On the clock</span>
              <p className="ffb-bug-value ffb-dt-onclock">{onClockLabel}</p>
            </div>
            {clock ? (
              <ClockCell
                secondsPerPick={clock.secondsPerPick}
                mine={clock.mine}
                canBeUrgent={clock.canBeUrgent}
              />
            ) : null}
            <div className="ffb-bug-seg">
              <span className="ffb-bug-label">
                <span className="ffb-only-phone">Next turn</span>
                <span className="ffb-not-phone">Your next turn</span>
              </span>
              <p className="ffb-bug-value">
                {nextTurn.value}
                {nextTurn.note ? <small>{nextTurn.note}</small> : null}
              </p>
            </div>
          </>
        )}
        {/* The board's own count says the same thing, so a phone's pinned band leaves this cell out. */}
        <div className="ffb-bug-seg ffb-not-phone">
          <span className="ffb-bug-label">Pool</span>
          <p className="ffb-bug-value">
            {poolLeft === null ? (
              <>
                —<small>board loading</small>
              </>
            ) : (
              <>
                {poolLeft}
                <small>left</small>
              </>
            )}
          </p>
        </div>
        <div className="ffb-bug-actions">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label={canUndo ? "Undo last pick" : "Undo last pick (no picks yet)"}
            title="Undo last pick"
            className="ffb-bug-btn"
          >
            <Undo2 size={15} aria-hidden="true" />
            <span className="ffb-dt-long">Undo pick</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label={canRedo ? "Redo the last undone pick" : "Redo (nothing to redo)"}
            title="Redo the last undone pick"
            className="ffb-bug-btn"
          >
            <Redo2 size={15} aria-hidden="true" />
            <span className="ffb-dt-long">Redo pick</span>
          </button>
          <button type="button" onClick={onNewRoom} className="ffb-bug-btn ffb-bug-btn-quiet">
            New room
          </button>
        </div>
      </div>
    </section>
  );
}

/** "RB6 · CIN", leaving out whatever a restored pick does not carry. */
function pickMeta(pick: DraftPick): string {
  const { position, positionRank, team } = pick.player;
  return [position ? `${position}${positionRank ?? ""}` : "", team].filter(Boolean).join(" · ");
}

/**
 * The last picks as stickers, newest first. Each one is the button that undoes
 * back to that pick. The kit's list shows one row of whole stickers and clips
 * the rest, and a clipped button would still take focus where nobody can see
 * it, so the ones that fell out of the first row are hidden outright.
 */
export function DraftLastPicks({
  picks,
  userTeam,
  onUndoToPick,
}: {
  picks: DraftPick[];
  userTeam: number;
  onUndoToPick: (pickNumber: number) => void;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const [fit, setFit] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    // The observer reports once when it starts, so the first count comes from it too.
    const observer = new ResizeObserver(() => {
      const items = Array.from(list.children) as HTMLElement[];
      const firstRowTop = items[0]?.offsetTop ?? 0;
      setFit(items.filter((item) => item.offsetTop === firstRowTop).length);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [picks.length]);

  if (picks.length === 0) return null;

  return (
    <div className="ffb-picks ffb-dt-picks">
      <div className="ffb-dt-picks-head">
        <h3 className="ffb-h3">Last picks</h3>
        <p className="ffb-dt-picks-note">Select one to undo back to it</p>
      </div>
      <ol ref={listRef} className="ffb-picks-list">
        {picks.map((pick, index) => {
          const mine = pick.teamNumber === userTeam;
          return (
            <li
              key={pick.pickNumber}
              style={fit !== null && index >= fit ? { visibility: "hidden" } : undefined}
            >
              <button
                type="button"
                onClick={() => onUndoToPick(pick.pickNumber)}
                title="Undo back to this pick"
                aria-label={`Undo back to pick ${pick.pickNumber} (${pick.player.name})`}
                className={`ffb-sticker ffb-dt-pick ${positionClass(pick.player.position)} ${
                  mine ? "ffb-is-mine" : ""
                }`.trimEnd()}
              >
                <span className="ffb-sticker-meta">
                  <span>
                    #{pick.pickNumber} · {mine ? "You" : `Slot ${pick.teamNumber}`}
                  </span>
                  <span>{pickMeta(pick)}</span>
                </span>
                <span className="ffb-sticker-name">{shortName(pick.player)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The user's roster as kit slots: a socket per lineup slot, the sticker itself once it is filled, then the bench. */
export function DraftRoster({
  assignment,
  picked,
  rounds,
}: {
  assignment: LineupAssignment;
  picked: number;
  rounds: number;
}) {
  const benchSize = Math.max(0, rounds - assignment.slots.length);
  return (
    <section className="ffb-rail-lead" aria-labelledby="draft-roster-heading">
      <div className="ffb-sechead">
        <h3 id="draft-roster-heading" className="ffb-h3">
          Your roster
        </h3>
        <p className="ffb-sechead-note">
          {picked} of {rounds} picked
        </p>
      </div>
      <ul
        className="ffb-slots ffb-dt-slots"
        style={{ "--ffb-slot-rows": Math.ceil((assignment.slots.length + 1) / 2) } as CSSProperties}
      >
        {assignment.slots.map((slot, index) => {
          const player = slot.player;
          const bye =
            player && typeof player.byeWeek === "number" && Number.isFinite(player.byeWeek)
              ? `Bye ${player.byeWeek}`
              : "";
          return (
            <li
              key={`${slot.slot}-${index}`}
              className={
                player
                  ? `ffb-slot ffb-is-filled ${positionClass(player.position)}`.trimEnd()
                  : `ffb-slot ${positionClass(slot.slot)}`.trimEnd()
              }
            >
              <span className="ffb-slot-code">{slot.slot}</span>
              <span className="ffb-slot-name">{player ? shortName(player) : "Open"}</span>
              {player ? (
                <span className="ffb-slot-meta">{[player.team, bye].filter(Boolean).join(" · ")}</span>
              ) : null}
            </li>
          );
        })}
        <li className="ffb-slot ffb-slot-bench">
          <span className="ffb-slot-code">BN</span>
          <span className="ffb-slot-name">Bench</span>
          <span className="ffb-slot-meta">
            {assignment.bench} of {benchSize}
          </span>
        </li>
      </ul>
    </section>
  );
}

/**
 * The pick grid: rounds down, slots across. It is a view of the pick log the
 * room already holds. It grows with the draft and stops at the current round,
 * and a finished draft shows every round. My column sits on the highlighter
 * band, the cell on the clock is marked, and each round's label carries a mark
 * for the way that round runs.
 */
export function DraftPickGrid({
  picks,
  settings,
  currentPick,
  currentRound,
  isComplete,
}: {
  picks: DraftPick[];
  settings: Pick<DraftSettings, "totalTeams" | "userTeam" | "draftType" | "rounds">;
  currentPick: number;
  currentRound: number;
  isComplete: boolean;
}) {
  const { totalTeams, userTeam, draftType, rounds } = settings;
  const pickByNumber = new Map(picks.map((pick) => [pick.pickNumber, pick]));
  const shownRounds = isComplete ? rounds : Math.min(rounds, Math.max(1, currentRound));
  const slots = Array.from({ length: totalTeams }, (_, index) => index + 1);
  const taken = new Map<string, number>();
  for (const pick of picks) {
    const position = pick.player.position;
    if (position) taken.set(position, (taken.get(position) ?? 0) + 1);
  }

  return (
    <section aria-labelledby="draft-pick-grid-heading">
      <div className="ffb-sechead">
        <h3 id="draft-pick-grid-heading" className="ffb-h3">
          Pick grid
        </h3>
        <p className="ffb-sechead-note">Slot {userTeam} is yours</p>
      </div>
      {/* The direction marks are drawn by the stylesheet, so the directions are said here. */}
      <p className="ffb-vh">
        Rounds run down and slots run across.{" "}
        {draftType === "snake"
          ? "Odd rounds run left to right and even rounds run right to left."
          : "Every round runs left to right."}
      </p>
      <div className="ffb-dt-gridwrap">
        <div
          className="ffb-grid"
          style={{ "--ffb-teams": totalTeams, "--ffb-my-slot": userTeam } as CSSProperties}
        >
          <span />
          {slots.map((slot) => (
            <span
              key={`slot-${slot}`}
              className={slot === userTeam ? "ffb-grid-slot ffb-is-mine" : "ffb-grid-slot"}
            >
              {slot}
              {slot === userTeam ? <span className="ffb-vh"> (you)</span> : null}
            </span>
          ))}
          {Array.from({ length: shownRounds }, (_, index) => index + 1).map((round) => {
            const firstPick = (round - 1) * totalTeams + 1;
            // Where each pick of the round lands, by slot.
            const pickBySlot = new Map<number, number>();
            for (let offset = 0; offset < totalTeams; offset++) {
              pickBySlot.set(calculateDraftOrder(firstPick + offset, totalTeams, draftType), firstPick + offset);
            }
            const reversed = calculateDraftOrder(firstPick, totalTeams, draftType) !== 1;
            return (
              <Fragment key={`round-${round}`}>
                <span className="ffb-grid-round">
                  R{round}
                  <i className={reversed ? "ffb-grid-dir ffb-is-rev" : "ffb-grid-dir"} aria-hidden="true" />
                </span>
                {slots.map((slot) => {
                  const pickNumber = pickBySlot.get(slot) ?? 0;
                  const pick = pickByNumber.get(pickNumber);
                  if (pick) {
                    const { name, position, positionRank } = pick.player;
                    return (
                      <span
                        key={pickNumber}
                        className={`ffb-cell ffb-is-made ${positionClass(position)}`.trimEnd()}
                        role="img"
                        aria-label={[`Pick ${pickNumber}`, name, position].filter(Boolean).join(", ")}
                        title={name}
                      >
                        {position}
                        {positionRank ?? ""}
                      </span>
                    );
                  }
                  const live = !isComplete && pickNumber === currentPick;
                  return (
                    <span
                      key={pickNumber}
                      className={
                        live ? "ffb-cell ffb-is-live" : slot === userTeam ? "ffb-cell ffb-is-mine" : "ffb-cell"
                      }
                      role="img"
                      aria-label={`Pick ${pickNumber}, ${live ? "on the clock" : "open"}`}
                    >
                      {pickNumber}
                    </span>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>
      <p className="ffb-tally">
        <span className="ffb-tally-label">Taken</span>
        {TALLY_POSITIONS.filter(
          (position) => (taken.get(position) ?? 0) > 0 || !["K", "DST"].includes(position)
        ).map((position) => (
          <span key={position} className="ffb-tally-item">
            <span className={`ffb-chip ffb-chip-sm ${positionClass(position)}`}>{position}</span>
            {taken.get(position) ?? 0}
          </span>
        ))}
      </p>
    </section>
  );
}
