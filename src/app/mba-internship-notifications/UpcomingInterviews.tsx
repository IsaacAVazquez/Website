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
    <section className="mba-rail-section" aria-labelledby="upcoming-interviews-heading">
      <h3 id="upcoming-interviews-heading" className="mba-h3">Interviews in the next seven days</h3>
      {!todayKey ? (
        <p>Loading interview dates…</p>
      ) : interviews.length === 0 ? (
        <p>No scheduled interviews in the next seven days.</p>
      ) : (
        <ul className="mba-attention" aria-label="Upcoming interviews">
          {interviews.map(({ application, round, roundIndex, daysFromToday }) => (
            <li key={`${application.id}-${roundIndex}`}>
              <p className="mba-attention-what">{application.jobSnapshot.companyName} · {round.label}</p>
              <p className="mba-job-meta">
                <time dateTime={round.date!}>{round.date}</time>
                {daysFromToday === 0 ? " · Today" : ""} · {application.jobSnapshot.title}
              </p>
              {round.notes && <p className="mba-snippet">{round.notes}</p>}
              <div className="mba-wrap-row">
                <button type="button" className="c97-btn-ghost" onClick={() => onEdit(application)}>Edit application</button>
                {application.materialsDir && (
                  <button type="button" className="c97-btn-ghost" onClick={async () => {
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
      {message && <p className="mba-small" role="status">{message}</p>}
    </section>
  );
}
