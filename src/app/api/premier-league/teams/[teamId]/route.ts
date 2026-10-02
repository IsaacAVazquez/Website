import {
  createEmptyPremierLeagueTeamSnapshot,
  getPremierLeagueTeamSnapshot,
  isPremierLeagueTeamIdShape,
  isValidPremierLeagueTeamId,
} from "@/lib/premierLeagueSnapshot";
import { createTeamRouteHandler } from "@/lib/teamRoute";

export const GET = createTeamRouteHandler({
  surface: "premier-league",
  label: "Premier League",
  isIdShape: isPremierLeagueTeamIdShape,
  isValidId: isValidPremierLeagueTeamId,
  getTeamSnapshot: getPremierLeagueTeamSnapshot,
  createEmpty: createEmptyPremierLeagueTeamSnapshot,
});
