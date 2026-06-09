"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
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
  applicationInputClass,
  applicationInputStyle,
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
    <label className="block space-y-2">
      <span className="home-meta mb-0">{label}</span>
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

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Dialog form mirrors the selected application each time it opens.
    setForm(getApplicationFormState(application));
  }, [application, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSave = form.companyName.trim() && form.title.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
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
        className="home-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-7"
        style={{ background: "var(--home-paper)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="home-kicker mb-2">Application tracker</p>
            <h2
              id="application-dialog-title"
              className="mb-0 text-xl font-semibold"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
            >
              {application ? "Edit application" : "Add application"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
            aria-label="Close application dialog"
            style={{ color: "var(--home-ink-muted)" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <FormField label="Company">
            <input
              value={form.companyName}
              onChange={(event) =>
                setForm((current) => ({ ...current, companyName: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
            />
          </FormField>
          <FormField label="Role">
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
            />
          </FormField>
          <FormField label="Location">
            <input
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
            />
          </FormField>
          <FormField label="Department">
            <input
              value={form.department}
              onChange={(event) =>
                setForm((current) => ({ ...current, department: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
            />
          </FormField>
          <FormField label="Application URL">
            <input
              value={form.applyUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, applyUrl: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
              inputMode="url"
            />
          </FormField>
          <FormField label="Source URL">
            <input
              value={form.sourceUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, sourceUrl: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
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
              className={applicationInputClass}
              style={applicationInputStyle}
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
              className={applicationInputClass}
              style={applicationInputStyle}
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
              className={applicationInputClass}
              style={applicationInputStyle}
            />
          </FormField>
          <FormField label="Deadline">
            <input
              type="date"
              value={form.deadline}
              onChange={(event) =>
                setForm((current) => ({ ...current, deadline: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
            />
          </FormField>
          <FormField label="Contact">
            <input
              value={form.contact}
              onChange={(event) =>
                setForm((current) => ({ ...current, contact: event.target.value }))
              }
              className={applicationInputClass}
              style={applicationInputStyle}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
                className={`${applicationInputClass} min-h-28 resize-y`}
                style={applicationInputStyle}
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="home-button home-button-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form, application)}
            disabled={!canSave}
            className="home-button home-button-primary disabled:opacity-50"
          >
            Save application
          </button>
        </div>
      </div>
    </div>
  );
}
