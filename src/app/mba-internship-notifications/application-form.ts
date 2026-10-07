import type {
  MBAApplicationPriority,
  MBAApplicationStatus,
  MBATrackedApplication,
} from "@/types/mba-jobs";

/**
 * Shared application-form types and defaults for the MBA tracker.
 *
 * Extracted from `mba-jobs-client.tsx` so the code-split `ApplicationEditDialog`
 * and the main client (which seeds saves) can both import them without
 * duplicating the definitions.
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
  /** Integer 0 to 100 as typed; blank clears the fit reading. */
  fitScore: string;
  fitRationale: string;
  appliedVia: string;
  materialsDir: string;
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
  fitScore: "",
  fitRationale: "",
  appliedVia: "",
  materialsDir: "",
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
    fitScore: application.fit ? String(application.fit.score) : "",
    fitRationale: application.fit?.rationale ?? "",
    appliedVia: application.appliedVia ?? "",
    materialsDir: application.materialsDir ?? "",
  };
}
