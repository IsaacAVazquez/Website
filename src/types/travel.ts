export type TripStatus = "planned" | "active" | "completed";

export type ActivityCategory =
  | "transit"
  | "lodging"
  | "food"
  | "sight"
  | "activity"
  | "other";

export interface TripActivity {
  id: string;
  date: string;
  time: string;
  endTime: string;
  title: string;
  location: string;
  category: ActivityCategory;
  notes: string;
  completed: boolean;
}

export type JournalMood =
  | "amazing"
  | "good"
  | "neutral"
  | "rough"
  | "tired";

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: JournalMood;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  budget: number;
  activities: TripActivity[];
  journal: JournalEntry[];
}

export interface TripDayBucket {
  date: string;
  activities: TripActivity[];
  completed: number;
  /** Activity ids that overlap another timed stop on the same day. */
  conflictIds: string[];
}

export interface TripSummary {
  status: TripStatus;
  daysTotal: number;
  daysElapsed: number;
  daysUntilStart: number;
  activitiesTotal: number;
  activitiesCompleted: number;
  conflictCount: number;
  journalCount: number;
  dayBuckets: TripDayBucket[];
  upcomingActivities: TripActivity[];
}
