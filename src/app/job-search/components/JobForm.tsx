"use client";

import { useState } from "react";
import type { JobApplication, JobStatus, WorkMode } from "@/types/jobsearch";
import { JOB_STATUS_LABELS, WORK_MODE_LABELS, JOB_STATUS_PIPELINE } from "@/types/jobsearch";
import type { CreateJobInput } from "@/lib/jobTracker";

interface JobFormProps {
  initialValues?: JobApplication;
  onSubmit: (input: CreateJobInput) => void;
  onCancel: () => void;
}

const ALL_STATUSES: JobStatus[] = [...JOB_STATUS_PIPELINE, "rejected", "withdrawn"];
const ALL_WORK_MODES: (WorkMode | "")[] = ["", "remote", "hybrid", "onsite"];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid var(--home-rule)",
  background: "var(--home-paper)",
  color: "var(--home-ink)",
  fontFamily: "var(--font-home-sans)",
  fontSize: "14px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  marginBottom: "4px",
  color: "color-mix(in srgb, var(--home-ink) 65%, var(--home-paper))",
  fontFamily: "var(--font-home-sans)",
};

export function JobForm({ initialValues, onSubmit, onCancel }: JobFormProps) {
  const [company, setCompany] = useState(initialValues?.company ?? "");
  const [role, setRole] = useState(initialValues?.role ?? "");
  const [url, setUrl] = useState(initialValues?.url ?? "");
  const [status, setStatus] = useState<JobStatus>(initialValues?.status ?? "wishlist");
  const [location, setLocation] = useState(initialValues?.location ?? "");
  const [workMode, setWorkMode] = useState<WorkMode | "">(initialValues?.workMode ?? "");
  const [salaryMin, setSalaryMin] = useState(initialValues?.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(initialValues?.salaryMax?.toString() ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    onSubmit({
      company: company.trim(),
      role: role.trim(),
      url: url.trim(),
      status,
      location: location.trim(),
      workMode: workMode || null,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      notes: notes.trim(),
    });
  }

  return (
    <div
      className="home-card p-6 space-y-4"
      style={{ borderRadius: "18px" }}
    >
      <h3
        className="text-lg font-semibold mb-0"
        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
      >
        {initialValues ? "Edit Application" : "Add Application"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>
              Company <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              required
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>
              Role <span style={{ color: "var(--color-error, #D94040)" }}>*</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior Product Manager"
              required
              style={fieldStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Job URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            style={fieldStyle}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              style={fieldStyle}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {JOB_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Work Mode</label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode | "")}
              style={fieldStyle}
            >
              <option value="">—</option>
              {ALL_WORK_MODES.filter(Boolean).map((m) => (
                <option key={m} value={m}>
                  {WORK_MODE_LABELS[m as WorkMode]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Salary Min ($)</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder="80000"
              min={0}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Salary Max ($)</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder="120000"
              min={0}
              style={fieldStyle}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Referred by a friend, great culture..."
            rows={3}
            maxLength={2000}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              color: "var(--home-ink)",
              background: "transparent",
              border: "1px solid var(--home-rule)",
              cursor: "pointer",
              fontFamily: "var(--font-home-sans)",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-lg font-medium transition-colors"
            style={{
              color: "var(--home-paper)",
              background: "var(--home-haze)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-home-sans)",
            }}
          >
            {initialValues ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
