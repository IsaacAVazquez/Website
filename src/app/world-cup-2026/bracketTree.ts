import type { WorldCupFixture, WorldCupKnockoutRound } from "@/types/worldCup";

/** One fixture positioned inside its bracket column. */
export interface BracketFixtureNode {
  fixture: WorldCupFixture;
  /** 0-based position within the column. */
  slot: number;
  /** Vertical centre as a fraction (0..1) of the column's height. */
  y: number;
  winnerId: string | null;
  /** The id of the fixture in the next round this one feeds, or null for the final (or when no later round anchors it). */
  feedsTo: string | null;
}

export interface BracketColumn {
  id: string;
  name: string;
  order: number;
  fixtures: BracketFixtureNode[];
}

export interface BracketTree {
  /** Round of 32 through the final, in ascending order. Never includes the third-place match. */
  columns: BracketColumn[];
  thirdPlace: WorldCupFixture | null;
  championId: string | null;
}

/**
 * The fixture's winner id, straight off `score.winner`, which already
 * reflects a penalty shootout when one decided the tie. Falls back to the
 * shootout tally itself for the unusual shape where `winner` is missing but
 * shootout scores are recorded.
 */
export function fixtureWinnerId(fixture: WorldCupFixture): string | null {
  const { winner, shootoutHome, shootoutAway } = fixture.score;
  if (winner === "HOME_TEAM") return fixture.homeTeam.id;
  if (winner === "AWAY_TEAM") return fixture.awayTeam.id;
  if (shootoutHome != null && shootoutAway != null && shootoutHome !== shootoutAway) {
    return shootoutHome > shootoutAway ? fixture.homeTeam.id : fixture.awayTeam.id;
  }
  return null;
}

function isThirdPlaceRound(round: WorldCupKnockoutRound): boolean {
  return round.name.toLowerCase().includes("third");
}

/**
 * Lays the knockout stage out as a bracket tree, from the Round of 32 to the
 * final. The rounds' own fixture order is not bracket order (ESPN lists them
 * some other way), so this walks backward from the final, matching each
 * fixture's winner id against the teams in the fixture it feeds, and carries
 * that pairing forward as both the feed link and the y-centre a renderer
 * needs to draw the connecting lines. A fixture whose winner matches nobody
 * in the next round (an early, partly-played bracket, or a data mismatch)
 * falls back to even spacing instead of throwing.
 */
export function bracketTree(rounds: WorldCupKnockoutRound[]): BracketTree {
  const thirdPlaceRound = rounds.find(isThirdPlaceRound) ?? null;
  const thirdPlace = thirdPlaceRound?.fixtures[0] ?? null;

  const bracketRounds = rounds
    .filter((round) => !isThirdPlaceRound(round))
    .slice()
    .sort((a, b) => a.order - b.order);

  if (bracketRounds.length === 0) {
    return { columns: [], thirdPlace, championId: null };
  }

  // Walk backward from the final, ordering each earlier round so its
  // fixtures sit beside the one they feed, and recording that feed link.
  type Built = { fixture: WorldCupFixture; feedsTo: string | null };
  const built: Built[][] = [];
  for (let i = bracketRounds.length - 1; i >= 0; i--) {
    const round = bracketRounds[i];
    const laterFixtures = built.length > 0 ? built[0].map((b) => b.fixture) : [];
    if (laterFixtures.length === 0) {
      // The final (no later round), or a round with nothing later to anchor
      // to (an unplayed bracket beyond this point). Keep the given order.
      built.unshift(round.fixtures.map((fixture) => ({ fixture, feedsTo: null })));
      continue;
    }
    const remaining = round.fixtures.slice();
    const ordered: Built[] = [];
    for (const laterFixture of laterFixtures) {
      for (const teamId of [laterFixture.homeTeam.id, laterFixture.awayTeam.id]) {
        const index = remaining.findIndex((f) => fixtureWinnerId(f) === teamId);
        if (index >= 0) {
          ordered.push({ fixture: remaining[index], feedsTo: laterFixture.id });
          remaining.splice(index, 1);
        }
      }
    }
    // Anything left didn't match a team in the next round; keep it, unlinked.
    for (const fixture of remaining) ordered.push({ fixture, feedsTo: null });
    built.unshift(ordered);
  }

  // Forward pass: leaf column spaces evenly, every later column's fixture
  // centres on the fixtures that feed it (falling back to even spacing when
  // nothing does).
  const ys: number[][] = [];
  built.forEach((column, columnIndex) => {
    const count = column.length;
    if (columnIndex === 0) {
      ys.push(column.map((_, i) => (i + 0.5) / count));
      return;
    }
    const prevColumn = built[columnIndex - 1];
    const prevYs = ys[columnIndex - 1];
    ys.push(
      column.map((entry, i) => {
        const feederYs = prevColumn
          .map((prevEntry, prevIndex) => (prevEntry.feedsTo === entry.fixture.id ? prevYs[prevIndex] : null))
          .filter((y): y is number => y !== null);
        if (feederYs.length > 0) {
          return feederYs.reduce((sum, y) => sum + y, 0) / feederYs.length;
        }
        return (i + 0.5) / count;
      })
    );
  });

  const columns: BracketColumn[] = bracketRounds.map((round, columnIndex) => ({
    id: round.id,
    name: round.name,
    order: round.order,
    fixtures: built[columnIndex].map((entry, slot) => ({
      fixture: entry.fixture,
      slot,
      y: ys[columnIndex][slot],
      winnerId: fixtureWinnerId(entry.fixture),
      feedsTo: entry.feedsTo,
    })),
  }));

  const finalColumn = columns[columns.length - 1];
  const championId =
    finalColumn.fixtures.length === 1 ? finalColumn.fixtures[0].winnerId : null;

  return { columns, thirdPlace, championId };
}
