"use client";

import { useClientNow } from "@/hooks/useClientNow";
import { MBA_APPLICATION_STATUS_LABELS } from "@/lib/mba-applications";
import { DISPLAY_TIME_ZONE } from "@/lib/date-formatters";
import type { MBAApplicationStatusEvent } from "@/types/mba-jobs";

const HISTORY_DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: DISPLAY_TIME_ZONE });

export default function ApplicationHistory({ events }: { events: MBAApplicationStatusEvent[] }) {
  const now = useClientNow();
  if (events.length === 0) return null;
  return (
    <details className="c97-disclosure" style={{ marginTop: "var(--c97-sp-2)" }}>
      <summary className="c97-btn-ghost">Status history</summary>
      <ol className="c97-list" aria-label="Application status history">
        {events.map((event, index) => {
          const next = events[index + 1];
          const duration = next ? (next.kind === "changed" ? Date.parse(next.at) : null) : now;
          const days = duration === null ? null : Math.max(0, Math.floor((duration - Date.parse(event.at)) / 86_400_000));
          return (
            <li className="c97-meta" key={`${event.at}-${event.status}-${event.kind}`}>
              {event.kind === "observed" ? "Observed " : ""}{MBA_APPLICATION_STATUS_LABELS[event.status]}
              {" · "}<time dateTime={event.at}>{HISTORY_DATE_FORMAT.format(new Date(event.at))}</time>
              {event.kind === "changed" && days !== null ? ` · ${days === 0 ? "Less than a day" : `${days} ${days === 1 ? "day" : "days"}`}` : ""}
            </li>
          );
        })}
      </ol>
      {events.some((event) => event.kind === "observed") && (
        <p className="c97-meta">Observed statuses came from an older or imported record. Their transition dates are unknown.</p>
      )}
    </details>
  );
}
