"use client";

import {
  Fragment,
  useId,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import type { DraftPick } from "@/types";
import { shortName, type LineupAssignment } from "@/lib/fantasyUtils";
import { positionClass } from "./positionClass";
import { useFirstRowCount } from "./useFirstRowCount";
import "./fantasy-room.css";

/*
 * The parts every draft room on the site shares: the scorebug's frame and its
 * cells, the last picks, the roster, and the pick grid. Each one is kit markup
 * with the room's values filled in. None of them holds room state, and none of
 * them imports from a route folder, so the redraft room, the mock room, and
 * the best ball room all draw from this one file.
 *
 * What a part needs past the kit is in fantasy-room.css (prefix `ffb-rm-`),
 * which this file imports itself, so a room gets it with the parts.
 */

/** What the parts read from a pick. A redraft pick and a best ball pick both fit. */
export type RoomPick = Pick<DraftPick, "pickNumber" | "teamNumber" | "player">;

const TALLY_POSITIONS = ["QB", "RB", "WR", "TE", "K", "DST"] as const;

/**
 * The scorebug's frame: the pinned section a room names with `label`, one
 * visually hidden sentence that announces the room's state, and the bar
 * itself. The cells are the children (`DraftScorebugCell`), and `actions` are
 * the buttons at the bar's far end, each an `ffb-bug-btn`.
 *
 * The section is not a live region, because a cell may hold a per-second
 * clock. `announcement` carries the news instead, so it should change only
 * when the room does (a pick logged or undone). `sectionRef` is the element a
 * room measures to pin its board bar and its rail under the bar. `className`
 * goes on the bar, for a room's own rules.
 */
export function DraftScorebug({
  label,
  sectionRef,
  announcement,
  actions,
  className,
  children,
}: {
  label: string;
  sectionRef?: Ref<HTMLElement>;
  announcement: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section ref={sectionRef} aria-label={label} className="ffb-sticky">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <div className={className ? `ffb-bug ${className}` : "ffb-bug"}>
        {children}
        {actions ? <div className="ffb-bug-actions">{actions}</div> : null}
      </div>
    </section>
  );
}

/**
 * One cell of the scorebug: a label over a value. `label` is a node, so a room
 * can pass a phone form and a desktop form. The value is the children.
 *
 * `live` paints the on-the-clock cell in the highlighter and holds its width,
 * so a long team name ends in an ellipsis and the bar keeps one height. Put
 * the full name in `title`. `note` is a small second line under the value (the
 * pick just logged). Everything else lands on the cell's own element, so a
 * room can give it a `ref` and `tabIndex` to focus it, a `role`, or a class of
 * its own.
 */
export function DraftScorebugCell({
  label,
  live = false,
  note,
  className,
  ref,
  children,
  ...rest
}: Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  label: ReactNode;
  live?: boolean;
  note?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const classes = ["ffb-bug-seg", live ? "ffb-bug-live ffb-rm-live" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} {...rest} className={classes}>
      <span className="ffb-bug-label">{label}</span>
      <p className="ffb-bug-value">{children}</p>
      {note ? <p className="ffb-rm-bug-note">{note}</p> : null}
    </div>
  );
}

/** "RB6 · CIN", leaving out whatever a restored pick does not carry. */
function pickMeta(pick: RoomPick): string {
  const { position, positionRank, team } = pick.player;
  return [position ? `${position}${positionRank ?? ""}` : "", team].filter(Boolean).join(" · ");
}

/**
 * Picks as stickers, newest first. With `onUndoToPick` each sticker is the
 * button that undoes back to that pick, and a note beside the heading says so.
 * Without it the stickers are plain list items.
 *
 * The kit's list shows one row of whole stickers and clips the rest, and a
 * clipped button would still take focus where nobody can see it, so the ones
 * that fell out of the first row are hidden outright.
 */
export function DraftLastPicks({
  picks,
  userTeam,
  heading = "Last picks",
  headingLevel = 3,
  onUndoToPick,
}: {
  picks: RoomPick[];
  userTeam: number;
  heading?: string;
  /** The heading's level in the room's outline. The look does not change. */
  headingLevel?: 2 | 3;
  onUndoToPick?: (pickNumber: number) => void;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const fit = useFirstRowCount(listRef, picks.length);
  const Heading = headingLevel === 2 ? "h2" : "h3";

  if (picks.length === 0) return null;

  return (
    <div className="ffb-picks">
      <div className="ffb-rm-picks-head">
        <Heading className="ffb-h3">{heading}</Heading>
        {onUndoToPick ? (
          <p className="ffb-rm-picks-note ffb-rm-noprint">Select one to undo back to it</p>
        ) : null}
      </div>
      <ol ref={listRef} className="ffb-picks-list">
        {picks.map((pick, index) => {
          const mine = pick.teamNumber === userTeam;
          const stickerClass = `ffb-sticker ${positionClass(pick.player.position)} ${
            mine ? "ffb-is-mine" : ""
          }`.trimEnd();
          const face = (
            <>
              <span className="ffb-sticker-meta">
                <span>
                  #{pick.pickNumber} · {mine ? "You" : `Slot ${pick.teamNumber}`}
                </span>{" "}
                <span>{pickMeta(pick)}</span>
              </span>{" "}
              <span className="ffb-sticker-name">{shortName(pick.player)}</span>
            </>
          );
          if (!onUndoToPick) {
            return (
              <li key={pick.pickNumber} className={stickerClass}>
                {face}
              </li>
            );
          }
          return (
            <li
              key={pick.pickNumber}
              className="ffb-rm-pick-item"
              style={fit !== null && index >= fit ? { visibility: "hidden" } : undefined}
            >
              <button
                type="button"
                onClick={() => onUndoToPick(pick.pickNumber)}
                title="Undo back to this pick"
                aria-label={`Undo back to pick ${pick.pickNumber} (${pick.player.name})`}
                className={`${stickerClass} ffb-rm-pick`}
              >
                {face}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The user's roster as kit slots: a socket per lineup slot, the sticker itself
 * once it is filled, then the bench. It is the rail's lead block, which the kit
 * moves above the list where the rail drops under it.
 */
export function DraftRoster({
  assignment,
  picked,
  rounds,
}: {
  assignment: Pick<LineupAssignment, "slots" | "bench">;
  /** How many picks the user has made, of `rounds`. */
  picked: number;
  rounds: number;
}) {
  const headingId = useId();
  // A starting slot left open sends its pick to the bench, so the bench can outgrow the
  // spots the lineup leaves for it. The count never prints past its own total.
  const benchSize = Math.max(assignment.bench, rounds - assignment.slots.length);
  return (
    <section className="ffb-rail-lead" aria-labelledby={headingId}>
      <div className="ffb-sechead">
        <h3 id={headingId} className="ffb-h3">
          Your roster
        </h3>
        <p className="ffb-sechead-note">
          {picked} of {rounds} picked
        </p>
      </div>
      <ul
        className="ffb-slots"
        style={{ "--ffb-slot-rows": Math.ceil((assignment.slots.length + 1) / 2) } as CSSProperties}
      >
        {assignment.slots.map((slot, index) => {
          const player = slot.player;
          const bye =
            player && typeof player.byeWeek === "number" && Number.isFinite(player.byeWeek)
              ? `Bye ${player.byeWeek}`
              : "";
          // A slot more than one position fits is the flex slot, which no single position class covers.
          const openClass = positionClass(slot.slot) || (slot.eligible.length > 1 ? "ffb-pos-flex" : "");
          return (
            <li
              key={`${slot.slot}-${index}`}
              className={
                player
                  ? `ffb-slot ffb-is-filled ${positionClass(player.position)}`.trimEnd()
                  : `ffb-slot ${openClass}`.trimEnd()
              }
            >
              <span className="ffb-slot-code">{slot.slot}</span>{" "}
              <span className="ffb-slot-name">{player ? shortName(player) : "Open"}</span>
              {player ? (
                <>
                  {" "}
                  {/* A span each, so the kit's wrapping line drops the bye first and keeps the team while it fits. */}
                  <span className="ffb-slot-meta">
                    {player.team ? <span>{player.team}</span> : null}
                    {bye ? (
                      <span>
                        {player.team ? <>&nbsp;· </> : null}
                        {bye}
                      </span>
                    ) : null}
                  </span>
                </>
              ) : null}
            </li>
          );
        })}
        <li className="ffb-slot ffb-slot-bench">
          <span className="ffb-slot-code">BN</span>{" "}
          <span className="ffb-slot-name">Bench</span>{" "}
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
 * and a finished draft shows every round. The user's column sits on the
 * highlighter band, the cell on the clock is marked, and each round's label
 * carries a mark for the way that round runs.
 *
 * `slotForPick` is the room's draft order: the slot (1 to `totalTeams`) that
 * makes a given overall pick. The grid reads each round's direction from it.
 *
 * The cells are images, so a name shows only on hover. "All picks" under the
 * grid lists every pick by round for a touch screen, a keyboard, and paper.
 */
export function DraftPickGrid({
  picks,
  totalTeams,
  userTeam,
  rounds,
  slotForPick,
  currentPick,
  currentRound,
  isComplete,
}: {
  picks: RoomPick[];
  totalTeams: number;
  userTeam: number;
  rounds: number;
  slotForPick: (pickNumber: number) => number;
  currentPick: number;
  currentRound: number;
  isComplete: boolean;
}) {
  const headingId = useId();
  const pickByNumber = new Map(picks.map((pick) => [pick.pickNumber, pick]));
  const shownRounds = isComplete ? rounds : Math.min(rounds, Math.max(1, currentRound));
  const slots = Array.from({ length: totalTeams }, (_, index) => index + 1);
  const firstPickOf = (round: number) => (round - 1) * totalTeams + 1;
  const isReversed = (round: number) => slotForPick(firstPickOf(round)) !== 1;
  const roundOf = (pick: RoomPick) => Math.ceil(pick.pickNumber / totalTeams);
  const taken = new Map<string, number>();
  for (const pick of picks) {
    const position = pick.player.position;
    if (position) taken.set(position, (taken.get(position) ?? 0) + 1);
  }
  const roundsWithPicks = Array.from(new Set(picks.map(roundOf))).sort((left, right) => left - right);
  const slotWords = (slot: number) => (slot === userTeam ? `slot ${slot}, yours` : `slot ${slot}`);

  return (
    <section aria-labelledby={headingId}>
      <div className="ffb-sechead">
        <h3 id={headingId} className="ffb-h3">
          Pick grid
        </h3>
        <p className="ffb-sechead-note">Slot {userTeam} is yours</p>
      </div>
      {/* The direction marks are drawn by the stylesheet, so the directions are said here. */}
      <p className="ffb-vh">
        Rounds run down and slots run across.{" "}
        {rounds > 1 && isReversed(2)
          ? "Odd rounds run left to right and even rounds run right to left."
          : "Every round runs left to right."}
      </p>
      <div className="ffb-gridwrap">
        <div
          // Fourteen and sixteen columns leave a cell about 22px, so those rooms set the cell's type smaller.
          className={totalTeams >= 14 ? "ffb-grid ffb-grid-tight" : "ffb-grid"}
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
            const firstPick = firstPickOf(round);
            // Where each pick of the round lands, by slot.
            const pickBySlot = new Map<number, number>();
            for (let offset = 0; offset < totalTeams; offset++) {
              pickBySlot.set(slotForPick(firstPick + offset), firstPick + offset);
            }
            return (
              <Fragment key={`round-${round}`}>
                <span className="ffb-grid-round">
                  R{round}
                  <i className={isReversed(round) ? "ffb-grid-dir ffb-is-rev" : "ffb-grid-dir"} aria-hidden="true" />
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
                        aria-label={[`Pick ${pickNumber}`, slotWords(slot), name, position]
                          .filter(Boolean)
                          .join(", ")}
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
                      aria-label={`Pick ${pickNumber}, ${slotWords(slot)}, ${live ? "on the clock" : "open"}`}
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
        <span className="ffb-tally-label">Taken</span>{" "}
        {TALLY_POSITIONS.filter(
          (position) => (taken.get(position) ?? 0) > 0 || !["K", "DST"].includes(position)
        ).map((position) => (
          <span key={position} className="ffb-tally-item">
            <span className={`ffb-chip ffb-chip-sm ${positionClass(position)}`}>{position}</span>{" "}
            {taken.get(position) ?? 0}
          </span>
        ))}
      </p>
      {picks.length > 0 ? (
        <details className="ffb-details ffb-details-print">
          <summary>All picks</summary>
          <div className="ffb-details-body">
            {roundsWithPicks.map((round) => (
              <Fragment key={`all-${round}`}>
                <h4 className="ffb-label ffb-rm-allpicks-round">Round {round}</h4>
                <ol>
                  {picks
                    .filter((pick) => roundOf(pick) === round)
                    .map((pick) => {
                      const mine = pick.teamNumber === userTeam;
                      return (
                        <li
                          key={pick.pickNumber}
                          className={mine ? "ffb-rm-allpick ffb-rm-is-mine" : "ffb-rm-allpick"}
                        >
                          <span className="ffb-rm-allpick-num">#{pick.pickNumber}</span>
                          {[
                            mine ? `Slot ${pick.teamNumber} (you)` : `Slot ${pick.teamNumber}`,
                            pick.player.name,
                            pickMeta(pick),
                          ]
                            .filter(Boolean)
                            .map((part) => ` · ${part}`)
                            .join("")}
                        </li>
                      );
                    })}
                </ol>
              </Fragment>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
