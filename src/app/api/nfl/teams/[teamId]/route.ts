import {
  createEmptyNflTeamSnapshot,
  getNflTeamSnapshot,
  isNflTeamIdShape,
  isValidNflTeamId,
} from "@/lib/nflSnapshot";
import { createTeamRouteHandler } from "@/lib/teamRoute";

export const GET = createTeamRouteHandler({
  surface: "nfl",
  label: "NFL",
  isIdShape: isNflTeamIdShape,
  isValidId: isValidNflTeamId,
  getTeamSnapshot: getNflTeamSnapshot,
  createEmpty: createEmptyNflTeamSnapshot,
});
