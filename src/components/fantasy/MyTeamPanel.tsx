"use client";

import { FantasySectionHeading } from "@/components/fantasy/FantasyRouteHeader";
import { useEffect, useMemo, useState } from "react";
import "./fantasy-weekly.css";
import { useFantasyMyTeam } from "@/hooks/useFantasyMyTeam";
import { readBrowserStorageString } from "@/lib/browserStorage";
import type { FantasyRouteScoring } from "@/lib/fantasy";
import {
  buildMyTeamLineup, compareMyTeamWaiver, importMyTeamDraft, readMyTeamPlayer,
  uniqueTeamPlayers, weeklyPlayerMap, type MyTeamPlayer,
} from "@/lib/fantasyMyTeam";
import type { FantasyWeeklyBoard, FantasyWeeklySnapshot } from "@/lib/fantasyWeeklySnapshot";
import { getFantasyDraftStorageKey, getSnapshotStaleness } from "@/lib/fantasyUtils";
import { REDRAFT_LINEUP_PRESETS, sameRedraftLineup } from "@/lib/redraftLineup";

type TeamView = "lineup" | "roster" | "settings";

/** The kit's position class, which carries the sticker colour for a chip or a slot. */
const positionClass = (position: string) => `ffb-pos-${position.toLowerCase()}`;

/** A player in one of My team's lists: the position chip, the name, and the team. */
function TeamPlayer({ player }: { player: MyTeamPlayer }) {
  return (
    <span className="ffb-wk-player">
      <span className={`ffb-chip ffb-chip-sm ${positionClass(player.position)}`}>{player.position}</span>
      <span className="ffb-wk-name">{player.name}</span>
      {player.team ? <span className="ffb-c-team">{player.team}</span> : null}
    </span>
  );
}

/**
 * The saved-team workspace the weekly board and the waiver list share: a
 * weekly lineup read off the consensus, the roster editor, and the league
 * settings. It draws as one kit section with no surface of its own, so it
 * sits in a rail beside the board or at full width under it. Each view is one
 * column inside `ffb-wk-rail` and two columns outside it.
 */
export function MyTeamPanel({ snapshot, board, scoring, onScoringChange, lead = "lineup" }: {
  /** Which block a saved team opens on: the lineup on weekly, the saved waiver targets on waivers. */
  lead?: "lineup" | "waivers";
  snapshot: Pick<FantasyWeeklySnapshot, "season" | "week">;
  /** The weekly board for `scoring`. A server seed may carry no other format. */
  board: FantasyWeeklyBoard;
  scoring: FantasyRouteScoring;
  onScoringChange: (scoring: FantasyRouteScoring) => void;
}) {
  const { team, update, persistenceStatus } = useFantasyMyTeam(snapshot.season);
  const [selectedView, setSelectedView] = useState<TeamView | null>(null);
  const activeView = selectedView ?? (team.players.length ? "lineup" : "roster");
  const [query, setQuery] = useState("");
  const [dropId, setDropId] = useState("");
  const [addId, setAddId] = useState("");
  const [notice, setNotice] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPosition, setManualPosition] = useState<MyTeamPlayer["position"]>("RB");
  const weekly = useMemo(() => weeklyPlayerMap(board), [board]);
  const players = useMemo(() => [...weekly.values()].flatMap(player => {
    const parsed = readMyTeamPlayer(player);
    return parsed ? [parsed] : [];
  }), [weekly]);
  const matches = query.trim() ? players.filter(player =>
    `${player.name} ${player.team} ${player.position}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12) : [];
  const available = players.filter(player => team.availableIds.includes(player.id) && !team.players.some(p => p.id === player.id));
  const add = available.find(player => player.id === addId);
  const drop = team.players.find(player => player.id === dropId);
  const comparison = add && drop ? compareMyTeamWaiver(team, board, add, drop.id) : null;
  const lineup = buildMyTeamLineup(team, board);
  const rankedStarters = lineup.filter(slot => slot.player).length;
  const stale = [board.flexSource, board.quarterbackSource].some(source => getSnapshotStaleness(source.asOf) === "stale");
  const missing = team.players.filter(player => !["K", "DST"].includes(player.position) && !weekly.has(player.id));
  const byePlayers = team.players.filter(player => player.byeWeek && player.byeWeek >= snapshot.week && player.byeWeek <= snapshot.week + 2);

  // The panel mounts after the client snapshot loads, too late for the browser's own hash scroll.
  useEffect(() => {
    if (window.location.hash === "#my-team") document.getElementById("my-team")?.scrollIntoView();
  }, []);

  function addToRoster(player: MyTeamPlayer) {
    update(current => ({ ...current, scoring, players: uniqueTeamPlayers([...current.players, player]),
      availableIds: current.availableIds.filter(id => id !== player.id) }));
    setSelectedView("roster");
    setNotice(`${player.name} added to your roster.`);
  }

  function importDraft() {
    const imported = importMyTeamDraft(readBrowserStorageString(getFantasyDraftStorageKey(snapshot.season)).value);
    if (!imported) { setNotice(`No saved ${snapshot.season} redraft picks were found for your team in this browser.`); return; }
    update(current => ({ ...current, ...imported, players: uniqueTeamPlayers([...current.players, ...imported.players]),
      availableIds: current.availableIds.filter(id => !imported.players.some(player => player.id === id)) }));
    onScoringChange(imported.scoring);
    setSelectedView("lineup");
    setNotice(`Imported ${imported.players.length} players and league settings. Existing roster players were kept. Review any moves made since the draft.`);
  }

  // The add and drop comparison works from the players marked available, which
  // are the saved targets. Waivers leads the saved team with it and the weekly
  // page leads with the lineup, so it is built once and placed by `lead`.
  const comparisonBlock = (
    <div className="ffb-wk-block">
      <div className="ffb-sechead"><h3 className="ffb-h3">Compare an add and a drop</h3></div>
      <p className="ffb-wk-copy">See where an available player fits before changing your roster.</p>
      {available.length === 0 && <div className="ffb-wk-actions">
        <p className="ffb-wk-copy">No players marked available yet.</p>
        <button type="button" className="ffb-btn" onClick={() => setSelectedView("roster")}>Find available players</button>
      </div>}
      <label className="ffb-field"><span className="ffb-field-label">Available player to add</span>
        <select className="ffb-select" value={add?.id ?? ""} onChange={event => setAddId(event.target.value)}>
          <option value="">Choose an available player</option>
          {available.map(player => <option key={player.id} value={player.id}>{player.name} ({player.position})</option>)}
        </select>
      </label>
      <label className="ffb-field"><span className="ffb-field-label">Roster player to drop</span>
        <select className="ffb-select" value={drop?.id ?? ""} onChange={event => setDropId(event.target.value)}>
          <option value="">Choose a roster player</option>
          {team.players.map(player => <option key={player.id} value={player.id}>{player.name} ({player.position})</option>)}
        </select>
      </label>
      {comparison && add && drop && !stale && <div className="ffb-wk-result" aria-live="polite">
        <p>{comparison.startingSlot ? `${add.name} enters the ranked lineup at ${comparison.startingSlot}.` : `${add.name} stays outside the ranked starting lineup.`}</p>
        <p>{comparison.rankGain === null ? "A rank difference is unavailable across separate boards or when either player is unranked." : comparison.rankGain === 0 ? "Both players have the same weekly rank." : `${add.name} ranks ${Math.abs(comparison.rankGain)} places ${comparison.rankGain > 0 ? "ahead of" : "behind"} ${drop.name} on the ${add.position === "QB" ? "QB" : "flex"} board.`}</p>
        {comparison.newGaps.length > 0 && <p>This move leaves no ranked player at {comparison.newGaps.map(slot => slot.slot).join(", ")}.</p>}
        <p className="ffb-muted">This comparison covers Week {snapshot.week}. It does not estimate season-long value, points gained, or a waiver bid.</p>
        <button className="ffb-btn ffb-btn-primary" type="button" onClick={() => {
          update(current => ({ ...current, scoring, players: uniqueTeamPlayers([...current.players.filter(player => player.id !== drop.id), add]), availableIds: current.availableIds.filter(id => id !== add.id) }));
          setAddId(""); setDropId("");
          setNotice(`Saved roster updated. Added ${add.name} and removed ${drop.name}. Make the actual transaction in your league.`);
        }}>Save this move to my roster</button>
      </div>}
      <p className="ffb-method">Availability is entered by you and stays saved until you change it.</p>
    </div>
  );

  return (
    <section id="my-team" aria-labelledby="my-team-title" className="ffb-wk-team">
      <div className="ffb-sechead ffb-sechead-lg">
        <FantasySectionHeading id="my-team-title">My team</FantasySectionHeading>
        <p className="ffb-sechead-note">{team.leagueSize} teams · {team.players.length} rostered · {available.length} marked available</p>
      </div>
      <p aria-live="polite" className={notice ? "ffb-notice ffb-wk-team-notice" : "sr-only"}>{notice}</p>
      <div className="ffb-tabs ffb-wk-tabs" role="group" aria-label="My team views">
        {([
          ["lineup", "Weekly lineup"], ["roster", "Roster"], ["settings", "League settings"],
        ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={activeView === value}
          className="ffb-tab" onClick={() => { setSelectedView(value); setNotice(""); }}>{label}</button>)}
      </div>

      {activeView === "settings" && <div className="ffb-wk-cols">
        <div className="ffb-wk-block ffb-wk-block-wide">
          <div className="ffb-sechead"><h3 className="ffb-h3">League settings</h3></div>
          <p className="ffb-wk-copy">Set the starting positions used to build your weekly lineup.</p>
          <div className="ffb-wk-fields">
            <label className="ffb-field"><span className="ffb-field-label">League size</span>
              <select className="ffb-select" value={team.leagueSize} onChange={event => update(current => ({ ...current, leagueSize: Number(event.target.value) }))}>
                {[8, 10, 12, 14, 16].map(size => <option key={size} value={size}>{size} teams</option>)}
              </select>
            </label>
            <label className="ffb-field"><span className="ffb-field-label">Lineup preset</span>
              <select className="ffb-select" value={REDRAFT_LINEUP_PRESETS.find(preset => sameRedraftLineup(preset.lineup, team.lineup))?.id ?? "custom"}
                onChange={event => { const preset = REDRAFT_LINEUP_PRESETS.find(item => item.id === event.target.value); if (preset) update(current => ({ ...current, lineup: { ...preset.lineup } })); }}>
                <option value="custom" disabled>Custom lineup</option>
                {REDRAFT_LINEUP_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              </select>
            </label>
          </div>
          <div className="ffb-wk-fields">
            {(["RB", "WR", "TE", "FLEX", "K", "DST"] as const).map(position => <label key={position} className="ffb-field"><span className="ffb-field-label">{position} starters</span>
              <select className="ffb-select" value={team.lineup[position]} onChange={event => update(current => ({ ...current, lineup: { ...current.lineup, [position]: Number(event.target.value) } }))}>
                {(position === "RB" ? [1, 2, 3] : position === "WR" ? [1, 2, 3, 4] : position === "TE" ? [1, 2] : position === "FLEX" ? [0, 1, 2, 3] : [0, 1]).map(count => <option key={count}>{count}</option>)}
              </select>
            </label>)}
          </div>
          <p className="ffb-method">One starting QB. Flex accepts RB, WR, or TE. Weekly ranks cover QB, RB, WR, and TE.</p>
        </div>
      </div>}

      {activeView === "roster" && <div className="ffb-wk-cols">
        <div className="ffb-wk-block">
          <div className="ffb-sechead"><h3 className="ffb-h3">{team.players.length ? "Manage your roster" : "Start with your roster"}</h3></div>
          <p className="ffb-wk-copy">Import picks from your draft tracker or search for players. Mark available players to compare a possible add and drop.</p>
          <div className="ffb-wk-actions">
            <button type="button" className="ffb-btn ffb-btn-primary" onClick={importDraft}>Import draft tracker roster</button>
            {team.players.length > 0 && <button type="button" className="ffb-btn ffb-btn-quiet" onClick={() => setSelectedView("lineup")}>View weekly lineup</button>}
          </div>
          <label className="ffb-field"><span className="ffb-field-label">Find a player to roster or mark available</span>
            <span className="ffb-search">
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="M12.8 12.8L17 17" /></svg>
              <input type="search" className="ffb-search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Player, team, or position" />
            </span>
          </label>
          {query.trim() && <p className="ffb-method">{matches.length ? `Showing up to 12 matches from the weekly board.` : "No weekly match. Add an unranked player below."}</p>}
          {matches.length > 0 && <ul className="ffb-wk-entries">
            {matches.map(player => <li key={player.id} className="ffb-wk-entry">
              <TeamPlayer player={player} />
              {team.players.some(p => p.id === player.id) ? <span className="ffb-wk-entry-note">On your roster</span> : <div className="ffb-wk-actions">
                <button type="button" className="ffb-btn" onClick={() => addToRoster(player)} aria-label={`Roster ${player.name}`}>Roster</button>
                <button type="button" className="ffb-toggle" aria-pressed={team.availableIds.includes(player.id)} aria-label={`Available in my league: ${player.name}`}
                  onClick={() => update(current => ({ ...current, availableIds: current.availableIds.includes(player.id) ? current.availableIds.filter(id => id !== player.id) : [...current.availableIds, player.id] }))}>
                  {team.availableIds.includes(player.id) ? "Marked available" : "Mark available"}
                </button>
              </div>}
            </li>)}
          </ul>}
          <details className="ffb-details">
            <summary>Add a player missing from the weekly board</summary>
            <div className="ffb-details-body ffb-stack ffb-stack-tight">
              <form className="ffb-wk-manual" onSubmit={event => {
                event.preventDefault();
                const name = manualName.trim();
                if (!name) return;
                const known = players.find(player => player.position === manualPosition && player.name.toLowerCase() === name.toLowerCase());
                addToRoster(known ?? { id: `manual-${manualPosition}-${name.toLowerCase()}`.slice(0, 100), name, team: "", position: manualPosition });
                setManualName("");
              }}>
                <label className="ffb-field"><span className="ffb-field-label">Player name</span><input required maxLength={80} placeholder="First and last name" className="ffb-input" value={manualName} onChange={event => setManualName(event.target.value)} /></label>
                <label className="ffb-field"><span className="ffb-field-label">Position</span><select className="ffb-select" value={manualPosition} onChange={event => setManualPosition(event.target.value as MyTeamPlayer["position"])}>
                  {["QB", "RB", "WR", "TE", "K", "DST"].map(position => <option key={position}>{position}</option>)}
                </select></label>
                <button className="ffb-btn ffb-btn-block" type="submit">Add unranked player</button>
              </form>
              <p className="ffb-method">Unranked players remain on your roster without a weekly recommendation. Replace a manual entry with its weekly search result when it appears.</p>
            </div>
          </details>
          <p className="ffb-method">Your roster stays saved as you add players.</p>
        </div>

        <div className="ffb-wk-block">
          <div className="ffb-sechead"><h3 className="ffb-h3">Saved roster</h3></div>
          {team.players.length === 0 ? <p className="ffb-wk-copy">Search or import your redraft roster to get started.</p> : <ul className="ffb-wk-entries">
            {team.players.map(player => <li key={player.id} className="ffb-wk-entry">
              <TeamPlayer player={player} />
              {!weekly.has(player.id) && <span className="ffb-wk-entry-note">No weekly rank</span>}
              <button className="ffb-btn ffb-btn-quiet" type="button" aria-label={`Remove ${player.name}`} onClick={() => {
                update(current => ({ ...current, players: current.players.filter(p => p.id !== player.id) }));
                setNotice(`${player.name} removed from your saved roster.`);
              }}>Remove</button>
            </li>)}
          </ul>}
        </div>
      </div>}

      {activeView === "lineup" && (team.players.length === 0 ? <div className="ffb-wk-cols">
        <div className="ffb-wk-block ffb-wk-block-wide">
          <div className="ffb-sechead"><h3 className="ffb-h3">Add your players to see a weekly lineup</h3></div>
          <p className="ffb-wk-copy">The lineup uses your league settings and the weekly consensus board.</p>
          <div className="ffb-wk-actions"><button type="button" className="ffb-btn ffb-btn-primary" onClick={() => setSelectedView("roster")}>Build my roster</button></div>
        </div>
      </div> : <div className="ffb-wk-cols">
        {lead === "waivers" && comparisonBlock}
        <div className="ffb-wk-block">
          <div className="ffb-sechead">
            <h3 className="ffb-h3">Weekly lineup by consensus</h3>
            {!stale && <p className="ffb-sechead-note">{rankedStarters} ranked {rankedStarters === 1 ? "starter" : "starters"}</p>}
          </div>
          {stale ? <p className="ffb-notice ffb-notice-warn">Weekly data is stale. Lineup and add/drop recommendations are paused until it refreshes.</p> : <ul className="ffb-slots ffb-wk-lineup">
            {lineup.map(slot => {
              const weeklyPlayer = slot.player ? weekly.get(slot.player.id) : undefined;
              // An open slot is keyed with the position that fits it, and a filled one is the player's own sticker.
              const tone = positionClass(slot.player?.position ?? slot.slot.split(" ")[0]);
              return <li key={slot.slot} className={`ffb-slot ${tone}${slot.player ? " ffb-is-filled" : ""}`}>
                <span className="ffb-slot-code">{slot.slot}</span>
                <span className="ffb-slot-name">{slot.player?.name ?? (/^(K|DST) /.test(slot.slot) ? "Weekly rankings unavailable" : "No ranked player")}</span>
                {slot.player && <span className="ffb-slot-meta">{slot.player.position} · {slot.player.team}{weeklyPlayer?.opponent ? ` · ${weeklyPlayer.opponent}` : ""}</span>}
                {slot.rank !== null && <span className="ffb-wk-slot-rank">#{slot.rank}<small>{slot.player?.position === "QB" ? "QB" : "Flex"}</small></span>}
              </li>;
            })}
          </ul>}
          {missing.length > 0 && <p className="ffb-method">Missing weekly ranks for {missing.map(player => player.name).join(", ")}. A missing rank does not mean a player is injured or on bye. Lineup coverage is incomplete.</p>}
          {byePlayers.length > 0 && <p className="ffb-method">Upcoming byes from your imported draft roster: {byePlayers.map(player => `${player.name} (Week ${player.byeWeek})`).join(", ")}. Bye coverage is limited to imported players with a saved bye week.</p>}
          <p className="ffb-method">Check injuries and kickoff status in your league before setting a lineup. These inputs contain no live injury feed.</p>
          <details className="ffb-details">
            <summary>How this lineup is selected</summary>
            <div className="ffb-details-body">
              <p className="ffb-method">Required positions fill first, followed by flex. QB and flex ranks use separate boards. League size is saved for context and does not change these ranks.</p>
            </div>
          </details>
        </div>
        {lead !== "waivers" && comparisonBlock}
      </div>)}
      {persistenceStatus === "memory-only"
        ? <p className="ffb-notice ffb-notice-warn">Browser storage is unavailable. Changes last only in this tab.</p>
        : <p className="ffb-method ffb-wk-foot">Saved in this browser. Your league roster changes only when you update it with your league provider.</p>}
    </section>
  );
}
