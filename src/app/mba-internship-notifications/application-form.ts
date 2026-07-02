import type { CSSProperties } from "react";
import type {
  MBAApplicationPriority,
  MBAApplicationStatus,
  MBATrackedApplication,
} from "@/types/mba-jobs";

/**
 * Shared application-form types, defaults, and input styling for the MBA tracker.
 *
 * Extracted from `mba-jobs-client.tsx` so the code-split `ApplicationEditDialog`
 * and the main client (which seeds saves and reuses the input styling in the
 * pipeline/cards) can both import them without duplicating the definitions.
 */
export interface ApplicationFormState {
  companyName: string;
  title: string;
  location: string;
  department: string;
  applyUrl: string;
  sourceUrl: string;
  status: MBAApplicationStatus;
  priority: MBAApplicationPriority;
  contact: string;
  followUpDate: string;
  deadline: string;
  notes: string;
}

export const EMPTY_APPLICATION_FORM: ApplicationFormState = {
  companyName: "",
  title: "",
  location: "",
  department: "",
  applyUrl: "",
  sourceUrl: "",
  status: "saved",
  priority: "medium",
  contact: "",
  followUpDate: "",
  deadline: "",
  notes: "",
};

export function getApplicationFormState(
  application: MBATrackedApplication | null
): ApplicationFormState {
  if (!application) return EMPTY_APPLICATION_FORM;
  return {
    companyName: application.jobSnapshot.companyName,
    title: application.jobSnapshot.title,
    location: application.jobSnapshot.location,
    department: application.jobSnapshot.department,
    applyUrl: application.jobSnapshot.applyUrl,
    sourceUrl: application.sourceUrl,
    status: application.status,
    priority: application.priority,
    contact: application.contact,
    followUpDate: application.followUpDate ?? "",
    deadline: application.deadline ?? "",
    notes: application.notes,
  };
}

export const applicationInputClass =
  "w-full min-h-[44px] rounded-[var(--radius-2xl)] border px-3 py-2 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease focus-visible:border-[var(--home-signal)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--home-signal)_35%,transparent)]";

export const applicationInputStyle: CSSProperties = {
  background: "var(--home-paper-alt)",
  borderColor: "var(--home-rule)",
  color: "var(--home-ink)",
  fontFamily: "var(--font-home-sans)",
};
