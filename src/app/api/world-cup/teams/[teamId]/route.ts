import {
  createEmptyWorldCupTeamSnapshot,
  getWorldCupTeamSnapshot,
  isWorldCupTeamIdShape,
  isValidWorldCupTeamId,
} from "@/lib/worldCupSnapshot";
import { createTeamRouteHandler } from "@/lib/teamRoute";

export const GET = createTeamRouteHandler({
  surface: "world-cup",
  label: "World Cup",
  isIdShape: isWorldCupTeamIdShape,
  isValidId: isValidWorldCupTeamId,
  getTeamSnapshot: getWorldCupTeamSnapshot,
  createEmpty: createEmptyWorldCupTeamSnapshot,
});
