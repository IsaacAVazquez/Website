"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { MBA_CANDIDATE_TRIAGE } from "@/lib/mba-applications";
import type { MBACandidateTriage, MBAJobCandidate } from "@/types/mba-jobs";

/**
 * Development-only triage board for sourced roles that have not been promoted
 * into the pipeline. Fed by `useMBAJobCandidates`, which reads
 * private/job-search/candidates.json, so the view never renders in production.
 */
const TRIAGE_LABELS: Record<MBACandidateTriage, string> = {
  sourced: "Sourced",
  reviewed: "Reviewed",
  dismissed: "Dismissed",
};

// Cards per "Show more" step. A sourcing run leaves hundreds in the sourced
// list, and all of them at once printed a 144,000px page on a phone.
const CANDIDATE_PAGE_SIZE = 12;

export default function CandidatesView({
  candidates,
  onPromote,
  onDismiss,
  onRestore,
}: {
  candidates: MBAJobCandidate[];
  onPromote: (candidate: MBAJobCandidate) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const [triage, setTriage] = useState<MBACandidateTriage>("sourced");
  const [limit, setLimit] = useState(CANDIDATE_PAGE_SIZE);

  const counts = useMemo(() => {
    const next: Record<MBACandidateTriage, number> = { sourced: 0, reviewed: 0, dismissed: 0 };
    for (const candidate of candidates) next[candidate.triage] += 1;
    return next;
  }, [candidates]);

  const visible = useMemo(
    // Already sorted by fit then sourcedAt by parseMBAJobCandidates; filter keeps that order.
    () => candidates.filter((candidate) => candidate.triage === triage),
    [candidates, triage]
  );

  return (
    <section className="mba-pipeline" aria-labelledby="mba-candidates-heading">
      <h2 id="mba-candidates-heading" className="sr-only">
        Candidates
      </h2>
      <div className="mba-toolbar">
        <div role="group" aria-label="Candidate triage" className="mba-pills">
          {MBA_CANDIDATE_TRIAGE.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={triage === option}
              onClick={() => {
                setTriage(option);
                setLimit(CANDIDATE_PAGE_SIZE);
              }}
            >
              {TRIAGE_LABELS[option]}
              <span className="mba-column-count">{counts[option]}</span>
            </button>
          ))}
        </div>
        <p className="mba-count-line">
          Sourced roles waiting on a decision, sorted by fit, before any of them reaches the
          pipeline.
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="mba-empty">
          <strong>Nothing sourced yet.</strong>
          I run the sourcing skill against my targets file and new roles land here with a fit
          score before I decide whether they belong in the pipeline.
        </p>
      ) : visible.length === 0 ? (
        <p className="mba-empty">
          <strong>{`Nothing ${TRIAGE_LABELS[triage].toLowerCase()} right now.`}</strong>
          I can switch the triage filter above to see the rest of the list.
        </p>
      ) : (
        <>
          <div className="mba-jobs" data-testid="candidates-grid">
            {visible.slice(0, limit).map((candidate) => (
              <article key={candidate.id} className="mba-card">
                <p className="mba-job-company">
                  <strong>{candidate.job.companyName}</strong>
                  {candidate.job.sourceName ? ` · via ${candidate.job.sourceName}` : ""}
                </p>
                <h3 className="mba-job-title">{candidate.job.title}</h3>
                <p className="mba-job-meta">{candidate.job.location}</p>
                {candidate.fit && (
                  <div className="mba-tags flex-wrap">
                    <span className="c97-chip" title={`Scored ${candidate.fit.scoredAt}`}>
                      <span
                        className="mba-swatch"
                        aria-hidden="true"
                        style={{ background: "var(--c97-accent)" }}
                      />
                      Fit {candidate.fit.score}
                    </span>
                  </div>
                )}
                {candidate.fit?.rationale && (
                  <p className="mba-snippet line-clamp-3">{candidate.fit.rationale}</p>
                )}
                <div className="mba-actions">
                  <button type="button" onClick={() => onPromote(candidate)} className="c97-btn">
                    Save to pipeline
                  </button>
                  {candidate.triage === "dismissed" ? (
                    <button type="button" onClick={() => onRestore(candidate.id)} className="c97-btn-ghost">
                      Restore
                    </button>
                  ) : (
                    <button type="button" onClick={() => onDismiss(candidate.id)} className="c97-btn-ghost">
                      Dismiss
                    </button>
                  )}
                  {candidate.job.applyUrl && (
                    <a
                      href={candidate.job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c97-btn-ghost"
                      aria-label={`Open ${candidate.job.title} at ${candidate.job.companyName}`}
                    >
                      Open
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          {visible.length > limit && (
            <div className="mba-more">
              <button
                type="button"
                className="c97-btn"
                onClick={() => setLimit((current) => current + CANDIDATE_PAGE_SIZE)}
              >
                Show more ({limit} of {visible.length} shown)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
