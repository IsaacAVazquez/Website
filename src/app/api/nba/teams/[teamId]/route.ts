import {
  createEmptyNbaTeamSnapshot,
  getNbaTeamSnapshot,
  isNbaTeamIdShape,
  isValidNbaTeamId,
} from "@/lib/nbaSnapshot";
import { createTeamRouteHandler } from "@/lib/teamRoute";

export const GET = createTeamRouteHandler({
  surface: "nba",
  label: "NBA",
  isIdShape: isNbaTeamIdShape,
  isValidId: isValidNbaTeamId,
  getTeamSnapshot: getNbaTeamSnapshot,
  createEmpty: createEmptyNbaTeamSnapshot,
});
