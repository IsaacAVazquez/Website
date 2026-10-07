"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { StatusPanel } from "@/components/editorial/StatusPanel";
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
    <section
      className="c97-band c97-sheet"
      data-c97-surface="paper"
      data-seam="torn"
      aria-labelledby="mba-candidates-heading"
    >
      <div className="c97-shell" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
        <div className="c97-panel" style={{ display: "flex", flexDirection: "column", gap: "var(--c97-sp-2)" }}>
          <p className="c97-kicker">Candidates</p>
          <h2 id="mba-candidates-heading" className="c97-serif c97-h2">
            Sourced roles waiting on a decision.
          </h2>
          <p className="c97-prose">
            The sourcing skill writes new roles here with a fit score, and I decide from this
            list whether each one is worth a tailored application before it reaches the pipeline.
          </p>
        </div>

        <div
          role="group"
          aria-label="Candidate triage"
          className="c97-segmented"
          style={{ minHeight: 44 }}
        >
          {MBA_CANDIDATE_TRIAGE.map((option) => (
            <button
              type="button"
              key={option}
              aria-pressed={triage === option}
              onClick={() => setTriage(option)}
              style={{ minHeight: 44 }}
            >
              {TRIAGE_LABELS[option]}
              <span className="c97-chip">{counts[option]}</span>
            </button>
          ))}
        </div>

        {candidates.length === 0 ? (
          <StatusPanel
            title="Nothing sourced yet."
            message="I run the sourcing skill against my targets file and new roles land here with a fit score before I decide whether they belong in the pipeline."
            icon={<Search className="h-5 w-5" aria-hidden="true" />}
          />
        ) : visible.length === 0 ? (
          <StatusPanel
            title={`Nothing ${TRIAGE_LABELS[triage].toLowerCase()} right now.`}
            message="I can switch the triage filter above to see the rest of the list."
            icon={<Search className="h-5 w-5" aria-hidden="true" />}
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3" style={{ gap: "var(--c97-sp-2)" }} data-testid="candidates-grid">
            {visible.map((candidate) => (
              <article key={candidate.id} className="c97-panel flex h-full flex-col" style={{ gap: "var(--c97-sp-2)" }}>
                <div className="flex flex-wrap items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
                  <div className="min-w-0">
                    <p className="c97-serif" style={{ fontSize: "var(--c97-fs-body)" }}>
                      {candidate.job.companyName}
                    </p>
                    <h3 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
                      {candidate.job.title}
                    </h3>
                  </div>
                  {candidate.fit && (
                    <span
                      className="c97-chip"
                      style={{ color: "var(--c97-ink)" }}
                      title={`Scored ${candidate.fit.scoredAt}`}
                    >
                      <span
                        aria-hidden="true"
                        style={{ width: "8px", height: "8px", flexShrink: 0, background: "var(--c97-accent)" }}
                      />
                      Fit {candidate.fit.score}
                    </span>
                  )}
                </div>
                <p className="c97-meta" style={{ margin: 0 }}>
                  {candidate.job.location}
                  {candidate.job.sourceName ? ` · via ${candidate.job.sourceName}` : ""}
                </p>
                {candidate.fit?.rationale && (
                  <p className="c97-prose line-clamp-3 text-sm">{candidate.fit.rationale}</p>
                )}
                <div
                  className="mt-auto flex flex-wrap items-center border-t border-[var(--c97-rule)]"
                  style={{ gap: "var(--c97-sp-1)", paddingTop: "var(--c97-sp-2)" }}
                >
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
                      className="c97-btn-ghost mba-ghost"
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
        )}
      </div>
    </section>
  );
}
