export type JobStatus =
  | "wishlist"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type WorkMode = "remote" | "hybrid" | "onsite";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  url: string;
  status: JobStatus;
  dateAdded: string;
  dateApplied: string | null;
  location: string;
  workMode: WorkMode | null;
  salaryMin: number | null;
  salaryMax: number | null;
  notes: string;
}

export interface JobApplicationStore {
  applications: JobApplication[];
}

export interface JobTrackerStats {
  total: number;
  inProgress: number;
  responseRate: number;
}

export type JobSearchView = "tracker" | "cover-letter" | "interview-prep";

export interface JobSearchState {
  view: JobSearchView;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  wishlist: "var(--home-stone)",
  applied: "var(--home-haze)",
  phone_screen: "#E89B3F",
  interview: "var(--home-moss)",
  offer: "var(--home-acid)",
  rejected: "var(--color-error, #D94040)",
  withdrawn: "var(--home-stone)",
};

export const JOB_STATUS_PIPELINE: JobStatus[] = [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};
