import type { MissionControlInitialData, MissionControlSearchState } from "@/types/spacex";
import {
  getMissionControlSummary,
  getMissionLaunchCards,
  getMissionLaunchDetail,
} from "@/lib/spacexData";

function getSpaceXLoadErrorMessage(error: unknown, fallback: string): string {
  const err = error as Error & { status?: number };

  if (err?.status === 429) {
    return "Live SpaceX data is temporarily rate limited. Retry shortly.";
  }

  return err?.message || fallback;
}

export async function loadMissionControlInitialData(
  routeState: MissionControlSearchState
): Promise<MissionControlInitialData> {
  const [summaryResult, launchesResult, detailResult] = await Promise.all([
    getMissionControlSummary()
      .then((summary) => ({ summary, summaryError: null }))
      .catch((error) => ({
        summary: null,
        summaryError: getSpaceXLoadErrorMessage(error, "Unable to load SpaceX summary"),
      })),
    getMissionLaunchCards(routeState.status, 10)
      .then((launches) => ({ launches, launchesError: null }))
      .catch((error) => ({
        launches: [],
        launchesError: getSpaceXLoadErrorMessage(error, "Unable to load SpaceX launches"),
      })),
    routeState.launch
      ? getMissionLaunchDetail(routeState.launch)
          .then((detail) => ({ detail, detailError: null }))
          .catch((error) => ({
            detail: null,
            detailError: getSpaceXLoadErrorMessage(error, "Unable to load launch detail"),
          }))
      : Promise.resolve({
          detail: null,
          detailError: null,
        }),
  ]);

  return {
    summary: summaryResult.summary,
    summaryError: summaryResult.summaryError,
    launches: launchesResult.launches,
    launchesError: launchesResult.launchesError,
    detail: detailResult.detail,
    detailError: detailResult.detailError,
  };
}
