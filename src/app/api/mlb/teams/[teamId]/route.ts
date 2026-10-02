import {
  createEmptyMlbTeamSnapshot,
  getMlbTeamSnapshot,
  isMlbTeamIdShape,
  isValidMlbTeamId,
} from "@/lib/mlbSnapshot";
import { createTeamRouteHandler } from "@/lib/teamRoute";

export const GET = createTeamRouteHandler({
  surface: "mlb",
  label: "MLB",
  isIdShape: isMlbTeamIdShape,
  isValidId: isValidMlbTeamId,
  getTeamSnapshot: getMlbTeamSnapshot,
  createEmpty: createEmptyMlbTeamSnapshot,
});
