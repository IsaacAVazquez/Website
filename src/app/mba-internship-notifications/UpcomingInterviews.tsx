"use client";

import { useState } from "react";
import { getUpcomingInterviews } from "@/lib/mba-application-insights";
import type { MBATrackedApplication } from "@/types/mba-jobs";

export default function UpcomingInterviews({ applications, todayKey, onEdit }: {
  applications: MBATrackedApplication[];
  todayKey: string | null;
  onEdit: (application: MBATrackedApplication) => void;
}) {
  const [message, setMessage] = useState("");
  const interviews = todayKey ? getUpcomingInterviews(applications, todayKey) : [];
  return (
    <section aria-labelledby="upcoming-interviews-heading">
      <h2 id="upcoming-interviews-heading" className="c97-serif c97-h2">Interviews in the next seven days</h2>
      {!todayKey ? (
        <p className="c97-prose">Loading interview dates…</p>
      ) : interviews.length === 0 ? (
        <p className="c97-prose">No scheduled interviews in the next seven days.</p>
      ) : (
        <ul className="c97-list" aria-label="Upcoming interviews">
          {interviews.map(({ application, round, roundIndex, daysFromToday }) => (
            <li key={`${application.id}-${roundIndex}`} className="c97-row">
              <div style={{ minWidth: 0 }}>
                <p className="c97-serif">{application.jobSnapshot.companyName} · {round.label}</p>
                <p className="c97-meta">
                  <time dateTime={round.date!}>{round.date}</time>
                  {daysFromToday === 0 ? " · Today" : ""} · {application.jobSnapshot.title}
                </p>
                {round.notes && <p className="c97-prose">{round.notes}</p>}
              </div>
              <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                <button className="c97-btn-ghost" onClick={() => onEdit(application)}>Edit application</button>
                {application.materialsDir && (
                  <button className="c97-btn-ghost" onClick={async () => {
                    const prepPath = `${application.materialsDir}/prep.md`;
                    try {
                      await navigator.clipboard.writeText(prepPath);
                      setMessage(`Copied ${prepPath}`);
                    } catch {
                      setMessage(`Copy this preparation path: ${prepPath}`);
                    }
                  }}>Copy preparation path</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="c97-meta" role="status">{message}</p>}
    </section>
  );
}
