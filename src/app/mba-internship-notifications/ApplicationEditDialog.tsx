"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useModal } from "@/hooks/useModal";
import {
  MBA_APPLICATION_PRIORITIES,
  MBA_APPLICATION_PRIORITY_LABELS,
  MBA_APPLICATION_STATUSES,
  MBA_APPLICATION_STATUS_LABELS,
} from "@/lib/mba-applications";
import type {
  MBAApplicationPriority,
  MBAApplicationStatus,
  MBATrackedApplication,
} from "@/types/mba-jobs";
import {
  getApplicationFormState,
  type ApplicationFormState,
} from "./application-form";

/**
 * Add/edit modal for a tracked MBA application. Code-split via `next/dynamic`
 * and mounted only while open, so its form markup loads on first use.
 */
function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid" style={{ gap: "var(--c97-sp-1)" }}>
      <span className="c97-kicker">{label}</span>
      {children}
    </label>
  );
}

export default function ApplicationEditDialog({
  isOpen,
  application,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  application: MBATrackedApplication | null;
  onClose: () => void;
  onSave: (form: ApplicationFormState, application: MBATrackedApplication | null) => void;
}) {
  const [form, setForm] = useState<ApplicationFormState>(() =>
    getApplicationFormState(application)
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Dialog form mirrors the selected application each time it opens.
    setForm(getApplicationFormState(application));
  }, [application, isOpen]);

  useModal(dialogRef, isOpen, onClose, { initialFocusRef: closeRef, lockScroll: false });

  if (!isOpen) return null;

  const canSave = form.companyName.trim() && form.title.trim();

  return (
    <div
      className="fixed inset-0 z-[var(--c97-z-modal)] flex items-center justify-center overflow-y-auto"
      style={{ padding: "var(--c97-sp-2)", background: "color-mix(in srgb, var(--c97-print-black) 45%, transparent)" }}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-dialog-title"
        className="c97-panel c97-offset w-full max-w-2xl overflow-y-auto"
        style={{ background: "var(--c97-surface)", maxHeight: "90dvh" }}
      >
        <div className="flex items-start justify-between" style={{ gap: "var(--c97-sp-2)" }}>
          <div>
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
              Application tracker
            </p>
            <h2 id="application-dialog-title" className="c97-serif c97-h3">
              {application ? "Edit application" : "Add application"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center"
            aria-label="Close application dialog"
            style={{ color: "var(--c97-ink-2)" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2" style={{ marginTop: "var(--c97-sp-3)", gap: "var(--c97-sp-2)" }}>
          <FormField label="Company">
            <input
              value={form.companyName}
              onChange={(event) =>
                setForm((current) => ({ ...current, companyName: event.target.value }))
              }
              required
              className="c97-field"
            />
          </FormField>
          <FormField label="Role">
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              required
              className="c97-field"
            />
          </FormField>
          <FormField label="Location">
            <input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              className="c97-field"
            />
          </FormField>
          <FormField label="Department">
            <input
              value={form.department}
              onChange={(event) =>
                setForm((current) => ({ ...current, department: event.target.value }))
              }
              className="c97-field"
            />
          </FormField>
          <FormField label="Application URL">
            <input
              value={form.applyUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, applyUrl: event.target.value }))
              }
              className="c97-field"
              inputMode="url"
            />
          </FormField>
          <FormField label="Source URL">
            <input
              value={form.sourceUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, sourceUrl: event.target.value }))
              }
              className="c97-field"
              inputMode="url"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as MBAApplicationStatus,
                }))
              }
              className="c97-field"
            >
              {MBA_APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {MBA_APPLICATION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Priority">
            <select
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as MBAApplicationPriority,
                }))
              }
              className="c97-field"
            >
              {MBA_APPLICATION_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {MBA_APPLICATION_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Follow-up date">
            <input
              type="date"
              value={form.followUpDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, followUpDate: event.target.value }))
              }
              className="c97-field"
            />
          </FormField>
          <FormField label="Deadline">
            <input
              type="date"
              value={form.deadline}
              onChange={(event) =>
                setForm((current) => ({ ...current, deadline: event.target.value }))
              }
              className="c97-field"
            />
          </FormField>
          <FormField label="Contact">
            <input
              value={form.contact}
              onChange={(event) =>
                setForm((current) => ({ ...current, contact: event.target.value }))
              }
              className="c97-field"
            />
          </FormField>
          <FormField label="Applied via">
            <input
              value={form.appliedVia}
              onChange={(event) =>
                setForm((current) => ({ ...current, appliedVia: event.target.value }))
              }
              className="c97-field"
              placeholder="Referral, portal, recruiter…"
            />
          </FormField>
          <FormField label="Fit score (0 to 100)">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={form.fitScore}
              onChange={(event) =>
                setForm((current) => ({ ...current, fitScore: event.target.value }))
              }
              className="c97-field"
              inputMode="numeric"
            />
          </FormField>
          <FormField label="Materials folder">
            <input
              value={form.materialsDir}
              onChange={(event) =>
                setForm((current) => ({ ...current, materialsDir: event.target.value }))
              }
              className="c97-field"
              placeholder="private/job-search/roles/…"
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Fit rationale">
              <textarea
                value={form.fitRationale}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fitRationale: event.target.value }))
                }
                rows={4}
                className="c97-field resize-y"
              />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                className="c97-field min-h-28 resize-y"
              />
            </FormField>
          </div>
        </div>

        <div className="flex flex-wrap justify-end" style={{ marginTop: "var(--c97-sp-3)", gap: "var(--c97-sp-2)" }}>
          <button type="button" onClick={onClose} className="c97-btn-ghost">
            Cancel
          </button>
          {!canSave && (
            <p id="application-dialog-hint" className="c97-meta" style={{ alignSelf: "center" }}>
              Add a company and a role to save
            </p>
          )}
          <button
            type="button"
            onClick={() => onSave(form, application)}
            disabled={!canSave}
            aria-describedby={canSave ? undefined : "application-dialog-hint"}
            className="c97-btn"
          >
            Save application
          </button>
        </div>
      </div>
    </div>
  );
}
