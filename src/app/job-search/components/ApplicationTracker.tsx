"use client";

import { useState } from "react";
import { useJobTracker } from "@/hooks/useJobTracker";
import type { JobStatus } from "@/types/jobsearch";
import { JOB_STATUS_LABELS, JOB_STATUS_PIPELINE } from "@/types/jobsearch";
import { StatsBar } from "./StatsBar";
import { JobCard } from "./JobCard";
import { JobForm } from "./JobForm";

type FilterStatus = "all" | JobStatus;

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  ...JOB_STATUS_PIPELINE.map((s) => ({ key: s as FilterStatus, label: JOB_STATUS_LABELS[s] })),
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
];

export function ApplicationTracker() {
  const {
    applications,
    stats,
    addApplication,
    updateApplication,
    updateStatus,
    removeApplication,
    getApplication,
  } = useJobTracker();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const filtered =
    filterStatus === "all"
      ? applications
      : applications.filter((app) => app.status === filterStatus);

  function handleEdit(id: string) {
    setEditingId(id);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    removeApplication(id);
  }

  function handleStatusChange(id: string, status: JobStatus) {
    updateStatus(id, status);
  }

  return (
    <div className="space-y-6">
      <StatsBar stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterStatus(opt.key)}
              className="px-3 py-1.5 text-xs rounded-full transition-colors"
              style={{
                fontFamily: "var(--font-home-sans)",
                fontWeight: filterStatus === opt.key ? 600 : 400,
                color:
                  filterStatus === opt.key
                    ? "var(--home-paper)"
                    : "color-mix(in srgb, var(--home-ink) 60%, var(--home-paper))",
                background:
                  filterStatus === opt.key
                    ? "var(--home-haze)"
                    : "color-mix(in srgb, var(--home-ink) 6%, var(--home-paper))",
                border: "none",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
          style={{
            color: "var(--home-paper)",
            background: "var(--home-haze)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-home-sans)",
          }}
        >
          + Add Application
        </button>
      </div>

      {showForm && (
        <JobForm
          initialValues={editingId ? getApplication(editingId) : undefined}
          onSubmit={(input) => {
            if (editingId) {
              updateApplication(editingId, input);
            } else {
              addApplication(input);
            }
            setShowForm(false);
            setEditingId(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {filtered.length === 0 ? (
        <div
          className="home-card p-8 text-center"
          style={{ borderRadius: "18px" }}
        >
          <p
            className="text-sm mb-0"
            style={{
              color: "color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))",
              fontFamily: "var(--font-home-sans)",
            }}
          >
            {applications.length === 0
              ? "No applications yet. Click \"+ Add Application\" to get started."
              : "No applications match this filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((app) => (
            <JobCard
              key={app.id}
              application={app}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
