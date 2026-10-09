import type { MBAApplicationStatusEvent, MBATrackedApplication } from "@/types/mba-jobs";

/** Keep known events from both copies when a newer record wins a file or tab merge. */
export function mergeStatusHistory(...histories: MBAApplicationStatusEvent[][]): MBAApplicationStatusEvent[] {
  const events = new Map<string, MBAApplicationStatusEvent>();
  for (const history of histories) {
    for (const event of history) events.set(`${event.at}|${event.status}|${event.kind}`, event);
  }
  return [...events.values()].sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
}

export function getApplicationReachedStages(application: MBATrackedApplication) {
  const statuses = new Set((application.statusHistory ?? []).map((event) => event.status));
  statuses.add(application.status);
  const interview = statuses.has("interviewing") || statuses.has("offer") || (application.interviewRounds?.length ?? 0) > 0;
  const offer = statuses.has("offer");
  const responded = interview || statuses.has("rejected");
  const submitted = responded || statuses.has("applied") || application.appliedAt !== null;
  return { submitted, responded, interview, offer };
}
