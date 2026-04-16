"use client";

import type { JobApplication, JobStatus } from "@/types/jobsearch";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  JOB_STATUS_PIPELINE,
  WORK_MODE_LABELS,
} from "@/types/jobsearch";

interface JobCardProps {
  application: JobApplication;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: JobStatus) => void;
}

export function JobCard({ application, onEdit, onDelete, onStatusChange }: JobCardProps) {
  const statusColor = JOB_STATUS_COLORS[application.status];
  const salaryRange =
    application.salaryMin || application.salaryMax
      ? [
          application.salaryMin ? `$${(application.salaryMin / 1000).toFixed(0)}k` : "?",
          application.salaryMax ? `$${(application.salaryMax / 1000).toFixed(0)}k` : "?",
        ].join(" – ")
      : null;

  return (
    <div
      className="home-card p-4 space-y-3"
      style={{ borderRadius: "16px", borderLeft: `3px solid ${statusColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="text-base font-semibold mb-0 truncate"
            style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
          >
            {application.role}
          </h3>
          <p
            className="text-sm mb-0"
            style={{ color: "color-mix(in srgb, var(--home-ink) 65%, var(--home-paper))" }}
          >
            {application.company}
            {application.url && (
              <>
                {" "}
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block align-middle"
                  style={{ color: "var(--home-haze)" }}
                  aria-label={`Job posting for ${application.role} at ${application.company}`}
                >
                  ↗
                </a>
              </>
            )}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(application.id)}
            className="px-2 py-1 text-xs rounded-md transition-colors"
            style={{
              color: "var(--home-haze)",
              background: "color-mix(in srgb, var(--home-haze) 10%, transparent)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(application.id)}
            className="px-2 py-1 text-xs rounded-md transition-colors"
            style={{
              color: "var(--color-error, #D94040)",
              background: "color-mix(in srgb, var(--color-error, #D94040) 10%, transparent)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-xs" style={{ color: "color-mix(in srgb, var(--home-ink) 50%, var(--home-paper))" }}>
        <span
          className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
            color: statusColor,
          }}
        >
          {JOB_STATUS_LABELS[application.status]}
        </span>
        {application.location && <span>{application.location}</span>}
        {application.workMode && <span>{WORK_MODE_LABELS[application.workMode]}</span>}
        {salaryRange && <span>{salaryRange}</span>}
        {application.dateApplied && <span>Applied {application.dateApplied}</span>}
      </div>

      {application.notes && (
        <p
          className="text-xs mb-0 line-clamp-2"
          style={{ color: "color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))" }}
        >
          {application.notes}
        </p>
      )}

      <div className="flex gap-1 flex-wrap">
        {[...JOB_STATUS_PIPELINE, "rejected" as JobStatus, "withdrawn" as JobStatus].map((status) => {
          if (status === application.status) return null;
          return (
            <button
              key={status}
              onClick={() => onStatusChange(application.id, status)}
              className="px-2 py-0.5 text-[11px] rounded transition-colors"
              style={{
                color: "color-mix(in srgb, var(--home-ink) 50%, var(--home-paper))",
                background: "color-mix(in srgb, var(--home-ink) 5%, var(--home-paper))",
                border: "1px solid var(--home-rule)",
                cursor: "pointer",
                fontFamily: "var(--font-home-sans)",
              }}
            >
              → {JOB_STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
