import {
  createEmptyLaLigaTeamSnapshot,
  getLaLigaTeamSnapshot,
  isLaLigaTeamIdShape,
  isValidLaLigaTeamId,
} from "@/lib/laLigaSnapshot";
import { createTeamRouteHandler } from "@/lib/teamRoute";

export const GET = createTeamRouteHandler({
  surface: "la-liga",
  label: "La Liga",
  isIdShape: isLaLigaTeamIdShape,
  isValidId: isValidLaLigaTeamId,
  getTeamSnapshot: getLaLigaTeamSnapshot,
  createEmpty: createEmptyLaLigaTeamSnapshot,
});
