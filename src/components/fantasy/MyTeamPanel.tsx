"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "@/components/ui/ServerIcons";
import styles from "./MyTeamPanel.module.css";
import { getFantasyDraftStorageKey } from "@/app/fantasy-football/draft-tracker/hooks/useDraftState";
import { useFantasyMyTeam } from "@/hooks/useFantasyMyTeam";
import { readBrowserStorageString } from "@/lib/browserStorage";
import { FANTASY_SCORING_LABELS, type FantasyRouteScoring } from "@/lib/fantasy";
import {
  buildMyTeamLineup, compareMyTeamWaiver, importMyTeamDraft, readMyTeamPlayer,
  uniqueTeamPlayers, weeklyPlayerMap, type MyTeamPlayer,
} from "@/lib/fantasyMyTeam";
import type { FantasyWeeklyBoard, FantasyWeeklySnapshot } from "@/lib/fantasyWeeklySnapshot";
import { getSnapshotStaleness } from "@/lib/fantasyUtils";
import { REDRAFT_LINEUP_PRESETS } from "@/lib/redraftLineup";

const control = styles.control;
const button = styles.button;
type TeamView = "lineup" | "roster" | "settings";

export function MyTeamPanel({ snapshot, board, scoring, onScoringChange }: {
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

  return (
    <section id="my-team" aria-labelledby="my-team-title" className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <h2 id="my-team-title" className={styles.title}>My team</h2>
          <p className={styles.description}>Your saved roster, weekly lineup, and waiver decisions.</p>
        </div>
        <div className={styles.week}><span>Week</span><span>{snapshot.week}</span><span>{snapshot.season}</span></div>
      </header>
      <div className={styles.context}>
        <span>{team.leagueSize} teams</span><span>{FANTASY_SCORING_LABELS[scoring]}</span><span>{team.players.length} rostered</span>
        <span>{available.length} marked available</span>
      </div>
      <div className={styles.viewNav} role="group" aria-label="My team views">
        {([
          ["lineup", "Weekly lineup"], ["roster", "Roster"], ["settings", "League settings"],
        ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={activeView === value}
          className={styles.viewButton} onClick={() => { setSelectedView(value); setNotice(""); }}>{label}</button>)}
      </div>
      <p aria-live="polite" className={notice ? styles.notice : "sr-only"}>{notice}</p>

      {activeView === "settings" && <div className={styles.settings}>
        <div>
          <h3 className={styles.subheading}>League settings</h3>
          <p className={styles.supporting}>Set the starting positions used to build your weekly lineup.</p>
        </div>
        <div>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="grid gap-1 text-sm">League size
            <select className={control} value={team.leagueSize} onChange={event => update(current => ({ ...current, leagueSize: Number(event.target.value) }))}>
              {[8, 10, 12, 14, 16].map(size => <option key={size} value={size}>{size} teams</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Lineup preset
            <select className={control} value={REDRAFT_LINEUP_PRESETS.find(preset => JSON.stringify(preset.lineup) === JSON.stringify(team.lineup))?.id ?? "custom"}
              onChange={event => { const preset = REDRAFT_LINEUP_PRESETS.find(item => item.id === event.target.value); if (preset) update(current => ({ ...current, lineup: { ...preset.lineup } })); }}>
              <option value="custom" disabled>Custom lineup</option>
              {REDRAFT_LINEUP_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {(["RB", "WR", "TE", "FLEX", "K", "DST"] as const).map(position => <label key={position} className="grid gap-1 text-sm">{position} starters
            <select className={control} value={team.lineup[position]} onChange={event => update(current => ({ ...current, lineup: { ...current.lineup, [position]: Number(event.target.value) } }))}>
              {(position === "RB" ? [1, 2, 3] : position === "WR" ? [1, 2, 3, 4] : position === "TE" ? [1, 2] : position === "FLEX" ? [0, 1, 2, 3] : [0, 1]).map(count => <option key={count}>{count}</option>)}
            </select>
          </label>)}
        </div>
        <p className="mt-2 text-xs text-[var(--home-ink-muted)]">One starting QB. Flex accepts RB, WR, or TE. Weekly ranks cover QB, RB, WR, and TE.</p>

        </div>
      </div>}

      {activeView === "roster" && <div className={styles.editor}>
        <div className={styles.editorIntro}>
          <h3 className={styles.subheading}>{team.players.length ? "Manage your roster" : "Start with your roster"}</h3>
          <p className={styles.supporting}>Import picks from your draft tracker or search for players. Mark available players to compare a possible add and drop.</p>
          <button type="button" className={styles.primaryButton} onClick={importDraft}>Import draft tracker roster <ArrowRight size={18} aria-hidden="true" /></button>
          {team.players.length > 0 && <button type="button" className={styles.textButton} onClick={() => setSelectedView("lineup")}>View weekly lineup <ArrowRight size={18} aria-hidden="true" /></button>}
          <p className={styles.localNote}>Your roster stays saved as you add players.</p>
        </div>
        <div className={styles.playerEditor}>
        <label className={styles.searchLabel}>Find a player to roster or mark available
          <span className={styles.searchField}><Search size={20} aria-hidden="true" /><input type="search" className={`${control} w-full`} value={query} onChange={event => setQuery(event.target.value)} placeholder="Player, team, or position" /></span>
        </label>
        {query.trim() && <p className="mt-2 text-xs text-[var(--home-ink-muted)]">{matches.length ? `Showing up to 12 matches from the weekly board.` : "No weekly match. Add an unranked player below."}</p>}
        <ul className="mt-2 divide-y divide-[var(--home-rule)]">
          {matches.map(player => <li key={player.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span className="text-sm">{player.name} · {player.position} {player.team}</span>
            {team.players.some(p => p.id === player.id) ? <span className="text-xs">On your roster</span> : <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => addToRoster(player)} aria-label={`Roster ${player.name}`}>Roster</button>
              <button type="button" className={team.availableIds.includes(player.id) ? styles.selectedButton : button} aria-pressed={team.availableIds.includes(player.id)} aria-label={`Available in my league: ${player.name}`}
                onClick={() => update(current => ({ ...current, availableIds: current.availableIds.includes(player.id) ? current.availableIds.filter(id => id !== player.id) : [...current.availableIds, player.id] }))}>
                {team.availableIds.includes(player.id) ? "Marked available" : "Mark available"}
              </button>
            </div>}
          </li>)}
        </ul>
        <details className="mt-3">
          <summary className="min-h-touch cursor-pointer py-3 text-sm">Add a player missing from the weekly board</summary>
          <form className="mt-2 flex flex-wrap items-end gap-3" onSubmit={event => {
            event.preventDefault();
            const name = manualName.trim();
            if (!name) return;
            const known = players.find(player => player.position === manualPosition && player.name.toLowerCase() === name.toLowerCase());
            addToRoster(known ?? { id: `manual-${manualPosition}-${name.toLowerCase()}`.slice(0, 100), name, team: "", position: manualPosition });
            setManualName("");
          }}>
            <label className="grid gap-1 text-sm">Player name<input required maxLength={80} className={`${control} w-full`} value={manualName} onChange={event => setManualName(event.target.value)} /></label>
            <label className="grid gap-1 text-sm">Position<select className={control} value={manualPosition} onChange={event => setManualPosition(event.target.value as MyTeamPlayer["position"])}>
              {["QB", "RB", "WR", "TE", "K", "DST"].map(position => <option key={position}>{position}</option>)}
            </select></label>
            <button className={button} type="submit">Add unranked player</button>
          </form>
          <p className="mt-2 text-xs text-[var(--home-ink-muted)]">Unranked players remain on your roster without a weekly recommendation. Replace a manual entry with its weekly search result when it appears.</p>
        </details>

        <h3 className={styles.subheading}>Saved roster</h3>
        {team.players.length === 0 && <p className="mt-2 text-sm">Search above or import your redraft roster to get started.</p>}
        <ul className="mt-2 divide-y divide-[var(--home-rule)]">
          {team.players.map(player => <li key={player.id} className={styles.rosterRow}>
            <span><span className={styles.playerName}>{player.name}</span><span className={styles.playerMeta}>{player.position} {player.team}{!weekly.has(player.id) ? " · No weekly rank" : ""}</span></span>
            <button className={styles.textButton} type="button" aria-label={`Remove ${player.name}`} onClick={() => {
              update(current => ({ ...current, players: current.players.filter(p => p.id !== player.id) }));
              setNotice(`${player.name} removed from your saved roster.`);
            }}>Remove</button>
          </li>)}
        </ul>

        </div>
      </div>}

      {activeView === "lineup" && (team.players.length === 0 ? <div className={styles.emptyLineup}>
        <h3 className={styles.subheading}>Add your players to see a weekly lineup</h3>
        <p className={styles.supporting}>The lineup uses your league settings and the weekly consensus board.</p>
        <button type="button" className={styles.primaryButton} onClick={() => setSelectedView("roster")}>Build my roster <ArrowRight size={18} aria-hidden="true" /></button>
      </div> : <div className={styles.decisions}>
        <div className={styles.lineup}>
          <div className={styles.lineupHeading}>
            <h3 className={styles.subheading}>Weekly lineup by consensus</h3>
            {!stale && <span className={styles.coverage}>{lineup.filter(slot => slot.player).length} ranked {lineup.filter(slot => slot.player).length === 1 ? "starter" : "starters"}</span>}
          </div>
          {stale ? <p className={styles.notice}>Weekly data is stale. Lineup and add/drop recommendations are paused until it refreshes.</p> : <>
            <div className={styles.lineupLabels} aria-hidden="true"><span>Slot</span><span>Player</span><span>Rank</span></div>
            <ul className={styles.lineupList}>
              {lineup.map(slot => <li key={slot.slot} className={styles.lineupRow}>
                <span className={styles.slot}>{slot.slot}</span>
                <span className={styles.playerCell}>
                  <span className={slot.player ? styles.playerName : styles.vacant}>{slot.player?.name ?? (/^(K|DST) /.test(slot.slot) ? "Weekly rankings unavailable" : "No ranked player")}</span>
                  {slot.player && <span className={styles.playerMeta}>{slot.player.position} · {slot.player.team}{weekly.get(slot.player.id)?.opponent ? ` · ${weekly.get(slot.player.id)?.opponent}` : ""}</span>}
                </span>
                <span className={styles.rank}>{slot.rank !== null ? <><span>#{slot.rank}</span><small>{slot.player?.position === "QB" ? "QB" : "Flex"}</small></> : <span className={styles.vacant}>N/A</span>}</span>
              </li>)}
            </ul>
          </>}
          {missing.length > 0 && <p className={styles.supporting}>Missing weekly ranks for {missing.map(player => player.name).join(", ")}. A missing rank does not mean a player is injured or on bye. Lineup coverage is incomplete.</p>}
          {byePlayers.length > 0 && <p className={styles.supporting}>Upcoming byes from your imported draft roster: {byePlayers.map(player => `${player.name} (Week ${player.byeWeek})`).join(", ")}. Bye coverage is limited to imported players with a saved bye week.</p>}
          <p className={styles.localNote}>Check injuries and kickoff status in your league before setting a lineup. These inputs contain no live injury feed.</p>
          <details className={styles.method}>
            <summary>How this lineup is selected</summary>
            <p className={styles.supporting}>Required positions fill first, followed by flex. QB and flex ranks use separate boards. League size is saved for context and does not change these ranks.</p>
          </details>
        </div>
        <div className={styles.comparison}>
          <h3 className={styles.subheading}>Compare an add and a drop</h3>
          <p className={styles.supporting}>See where an available player fits before changing your roster.</p>
          {available.length === 0 && <div className={styles.availabilityPrompt}>
            <p>No players marked available yet.</p>
            <button type="button" className={styles.textButton} onClick={() => setSelectedView("roster")}>Find available players <ArrowRight size={18} aria-hidden="true" /></button>
          </div>}
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">Available player to add<select className={`${control} w-full min-w-0`} value={add?.id ?? ""} onChange={event => setAddId(event.target.value)}>
              <option value="">Choose an available player</option>
              {available.map(player => <option key={player.id} value={player.id}>{player.name} ({player.position})</option>)}
            </select></label>
            <label className="grid gap-1 text-sm">Roster player to drop<select className={`${control} w-full min-w-0`} value={drop?.id ?? ""} onChange={event => setDropId(event.target.value)}>
              <option value="">Choose a roster player</option>
              {team.players.map(player => <option key={player.id} value={player.id}>{player.name} ({player.position})</option>)}
            </select></label>
          </div>
          {comparison && add && drop && !stale && <div className={styles.comparisonResult} aria-live="polite">
            <p>{comparison.startingSlot ? `${add.name} enters the ranked lineup at ${comparison.startingSlot}.` : `${add.name} stays outside the ranked starting lineup.`}</p>
            <p className="mt-2">{comparison.rankGain === null ? "A rank difference is unavailable across separate boards or when either player is unranked." : comparison.rankGain === 0 ? "Both players have the same weekly rank." : `${add.name} ranks ${Math.abs(comparison.rankGain)} places ${comparison.rankGain > 0 ? "ahead of" : "behind"} ${drop.name} on the ${add.position === "QB" ? "QB" : "flex"} board.`}</p>
            {comparison.newGaps.length > 0 && <p className="mt-2">This move leaves no ranked player at {comparison.newGaps.map(slot => slot.slot).join(", ")}.</p>}
            <p className="mt-2 text-[var(--home-ink-muted)]">This comparison covers Week {snapshot.week}. It does not estimate season-long value, points gained, or a waiver bid.</p>
            <button className={`${styles.primaryButton} mt-3`} type="button" onClick={() => {
              update(current => ({ ...current, scoring, players: uniqueTeamPlayers([...current.players.filter(player => player.id !== drop.id), add]), availableIds: current.availableIds.filter(id => id !== add.id) }));
              setAddId(""); setDropId("");
              setNotice(`Saved roster updated. Added ${add.name} and removed ${drop.name}. Make the actual transaction in your league.`);
            }}>Save this move to my roster</button>
          </div>}
          <p className={styles.localNote}>Availability is entered by you and stays saved until you change it.</p>
        </div>
      </div>)}
      <footer className={styles.footer}>{persistenceStatus === "memory-only" ? "Browser storage is unavailable. Changes last only in this tab." : "Saved in this browser. Your league roster changes only when you update it with your league provider."}</footer>
    </section>
  );
}
