import type { MBAApplicationStatusEvent, MBATrackedApplication } from "@/types/mba-jobs";

/** Keep known events from both copies when a newer record wins a file or tab merge. */
export function mergeStatusHistory(...histories: MBAApplicationStatusEvent[][]): MBAApplicationStatusEvent[] {
  const events = new Map<string, MBAApplicationStatusEvent>();
  for (const history of histories) {
    for (const event of history) events.set(`${event.at}|${event.status}|${event.kind}`, event);
  }
  return [...events.values()].sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
}

const STAGE_ORDER: MBATrackedApplication["status"][] = ["saved", "applied", "interviewing", "offer"];

/**
 * The statuses that still stand. The history has no way to remove an event, so
 * a move back to an earlier stage reads as a correction and drops the later
 * stages and any rejection it walked back.
 */
function standingStatuses(application: MBATrackedApplication) {
  const standing = new Set<MBATrackedApplication["status"]>();
  for (const status of [...(application.statusHistory ?? []).map((event) => event.status), application.status]) {
    const stage = STAGE_ORDER.indexOf(status);
    if (stage >= 0) {
      for (const earlier of standing) {
        if (earlier === "rejected" || STAGE_ORDER.indexOf(earlier) > stage) standing.delete(earlier);
      }
    }
    standing.add(status);
  }
  return standing;
}

export function getApplicationReachedStages(application: MBATrackedApplication) {
  const statuses = standingStatuses(application);
  const interview = statuses.has("interviewing") || statuses.has("offer") || (application.interviewRounds?.length ?? 0) > 0;
  const offer = statuses.has("offer");
  const responded = interview || statuses.has("rejected");
  // An archived record with no recorded progress cannot say whether it heard back, so its applied date alone does not count it.
  const submitted = responded || statuses.has("applied") || (application.appliedAt !== null && application.status !== "archived");
  return { submitted, responded, interview, offer };
}
