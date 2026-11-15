"use client";

import {
  FollowPicker,
  ProjectWorkspace,
  StorageNotice,
} from "@/components/ProjectWorkspace";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import { parseFollowedIds, toggleFollowedId } from "@/lib/personalFollowing";
import type { GolfSummary } from "@/types/golf";
import { formatScoreToPar } from "./leaderboard";

export const FOLLOWED_GOLF_PLAYERS_KEY = "golf-followed-players-v1";

export function FollowedPlayers({
  summary,
  onSelect,
}: {
  summary: GolfSummary;
  onSelect: (id: string) => void;
}) {
  const store = useBrowserRecord(FOLLOWED_GOLF_PLAYERS_KEY, parseFollowedIds);
  const players = store.value.flatMap((id) => {
    const row = summary.leaderboard.find((entry) => entry.playerId === id);
    return row ? [row] : [];
  });
  return (
    <ProjectWorkspace
      id="followed-golf"
      title="Your players"
      description="Keep a personal board of up to 20 players in this browser. It compares the published strokes for each round of this tournament."
    >
      <FollowPicker
        label="Follow a player"
        options={summary.players}
        ids={store.value}
        onToggle={(id) =>
          store.update((latest) => toggleFollowedId(latest, id))
        }
      />
      {players.length ? (
        <div
          className="pw-scroll"
          role="region"
          tabIndex={0}
          aria-label="Followed players round comparison (scrolls sideways)"
        >
          <table className="pw-table">
            <caption>
              {summary.tournament?.name ?? "Published tournament"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col">Position</th>
                <th scope="col">To par</th>
                {[1, 2, 3, 4].map((round) => (
                  <th key={round} scope="col">
                    R{round} strokes
                  </th>
                ))}
                <th scope="col">Through</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.playerId}>
                  <th scope="row">
                    <button
                      type="button"
                      onClick={() => onSelect(player.playerId)}
                    >
                      {player.playerName}
                    </button>
                  </th>
                  <td>{player.position}</td>
                  <td>{formatScoreToPar(player.totalToPar)}</td>
                  {[0, 1, 2, 3].map((round) => (
                    <td key={round}>
                      {typeof player.roundScores[round] === "number" &&
                      player.roundScores[round] > 0
                        ? player.roundScores[round]
                        : "Not reported"}
                    </td>
                  ))}
                  <td>
                    {player.thru} · {player.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="pw-note">
        A round in progress can contain partial strokes. Use Through and the
        player status alongside each score. Players missing from this tournament
        stay followed.
      </p>
      <StorageNotice status={store.status} />
    </ProjectWorkspace>
  );
}
