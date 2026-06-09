"use client";

import { type FormEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BedDouble,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  Circle,
  Compass,
  Frown,
  Landmark,
  ListChecks,
  type LucideIcon,
  Map,
  MapPin,
  Meh,
  Moon,
  NotebookPen,
  Plane,
  Plus,
  Smile,
  Sparkles,
  Star,
  Ticket,
  Train,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { getReducedMotionVariants, fadeInVariants } from "@/components/investments/animations";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  JOURNAL_MOODS,
  JOURNAL_MOOD_LABELS,
  formatActivityTimeRange,
  formatDayHeading,
  formatTripDateRange,
  getDefaultActivityDate,
  getTodayKey,
} from "@/lib/travelPlanner";
import {
  type ActivityDraft,
  type JournalDraft,
  useTravelPlanner,
} from "@/hooks/useTravelPlanner";
import { HomeStatsPanel, type HomeStatsCell } from "@/components/home/HomeStatsPanel";
import type { ActivityCategory, JournalEntry, Trip, TripActivity } from "@/types/travel";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Compass, href: "#section-overview" },
  { id: "itinerary", label: "Itinerary", icon: ListChecks, href: "#section-itinerary" },
  { id: "journal", label: "Journal", icon: BookOpen, href: "#section-journal" },
  { id: "trips", label: "All trips", icon: Map, href: "#section-trips" },
] as const;

const STATUS_LABELS = {
  planned: "Planned",
  active: "On the road",
  completed: "Completed",
} as const;

const MOOD_TONE: Record<JournalEntry["mood"], string> = {
  amazing: "var(--color-success, #2f7d4f)",
  good: "var(--home-haze)",
  neutral: "var(--home-ink-muted)",
  rough: "var(--color-warning, #b8860b)",
  tired: "var(--color-error, #b3322c)",
};

const MOOD_ICON: Record<JournalEntry["mood"], LucideIcon> = {
  amazing: Star,
  good: Smile,
  neutral: Meh,
  rough: Frown,
  tired: Moon,
};

const CATEGORY_META: Record<ActivityCategory, { icon: LucideIcon; tint: string }> = {
  transit: { icon: Train, tint: "#3b6ea5" },
  lodging: { icon: BedDouble, tint: "#7c5cbf" },
  food: { icon: UtensilsCrossed, tint: "#b8860b" },
  sight: { icon: Landmark, tint: "#2f7d4f" },
  activity: { icon: Ticket, tint: "#c2410c" },
  other: { icon: MapPin, tint: "var(--home-ink-muted)" },
};

function emptyActivityDraft(date: string): ActivityDraft {
  return {
    date,
    time: "",
    endTime: "",
    title: "",
    location: "",
    category: "activity",
    notes: "",
  };
}

function emptyJournalDraft(date: string): JournalDraft {
  return {
    date,
    title: "",
    body: "",
    mood: "good",
  };
}

function formatBudget(value: number) {
  if (!value) return "$0";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
}

const fieldLabel =
  "block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--home-ink)_45%,var(--home-paper))]";
const fieldInput =
  "mt-1.5 w-full min-h-touch rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 py-2 text-[13px] text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2";
const textareaInput = `${fieldInput} min-h-[88px] resize-y`;

export function TravelPlannerClient() {
  const planner = useTravelPlanner();
  const {
    trips,
    activeTrip,
    activeTripId,
    summary,
    selectTrip,
    addTrip,
    removeTrip,
    updateTripFields,
    addActivity,
    updateActivity,
    toggleActivity,
    removeActivity,
    addJournal,
    updateJournal,
    removeJournal,
  } = planner;

  const shouldReduceMotion = useReducedMotion();
  const motionVariants = shouldReduceMotion
    ? getReducedMotionVariants().fadeInVariants
    : fadeInVariants;

  const today = getTodayKey();

  const [tripDraft, setTripDraft] = useState({
    name: "",
    destination: "",
    startDate: today,
    endDate: today,
  });
  const [showTripForm, setShowTripForm] = useState(false);

  const defaultActivityDate = useMemo(
    () => (activeTrip ? getDefaultActivityDate(activeTrip, today) : today),
    [activeTrip, today]
  );

  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(() =>
    emptyActivityDraft(defaultActivityDate)
  );
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  const [journalDraft, setJournalDraft] = useState<JournalDraft>(() =>
    emptyJournalDraft(defaultActivityDate)
  );
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  const [lastTripContext, setLastTripContext] = useState({
    tripId: activeTripId,
    date: defaultActivityDate,
  });
  if (
    lastTripContext.tripId !== activeTripId ||
    lastTripContext.date !== defaultActivityDate
  ) {
    setLastTripContext({ tripId: activeTripId, date: defaultActivityDate });
    setEditingActivityId(null);
    setEditingJournalId(null);
    setActivityDraft((draft) =>
      draft.title || draft.location || draft.notes || draft.time
        ? draft
        : emptyActivityDraft(defaultActivityDate)
    );
    setJournalDraft((draft) =>
      draft.title || draft.body ? draft : emptyJournalDraft(defaultActivityDate)
    );
  }

  function resetActivityDraft() {
    setEditingActivityId(null);
    setActivityDraft(emptyActivityDraft(defaultActivityDate));
  }

  function resetJournalDraft() {
    setEditingJournalId(null);
    setJournalDraft(emptyJournalDraft(defaultActivityDate));
  }

  function handleEditActivity(activity: TripActivity) {
    setEditingActivityId(activity.id);
    setActivityDraft({
      date: activity.date,
      time: activity.time,
      endTime: activity.endTime,
      title: activity.title,
      location: activity.location,
      category: activity.category,
      notes: activity.notes,
    });
  }

  function handleEditJournal(entry: JournalEntry) {
    setEditingJournalId(entry.id);
    setJournalDraft({
      date: entry.date,
      title: entry.title,
      body: entry.body,
      mood: entry.mood,
    });
  }

  function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tripDraft.name.trim() || !tripDraft.startDate) return;
    addTrip({
      name: tripDraft.name.trim(),
      destination: tripDraft.destination.trim(),
      startDate: tripDraft.startDate,
      endDate: tripDraft.endDate || tripDraft.startDate,
    });
    setTripDraft({ name: "", destination: "", startDate: today, endDate: today });
    setShowTripForm(false);
  }

  function handleSubmitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTrip) return;
    if (!activityDraft.title.trim() || !activityDraft.date) return;

    if (editingActivityId) {
      updateActivity(activeTrip.id, editingActivityId, activityDraft);
    } else {
      addActivity(activeTrip.id, activityDraft);
    }
    resetActivityDraft();
  }

  function handleSubmitJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTrip) return;
    if (!journalDraft.title.trim() && !journalDraft.body.trim()) return;

    if (editingJournalId) {
      updateJournal(activeTrip.id, editingJournalId, journalDraft);
    } else {
      addJournal(activeTrip.id, journalDraft);
    }
    resetJournalDraft();
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8">
      <motion.div
        variants={motionVariants}
        initial="hidden"
        animate="visible"
        className="tool-page-stack"
        data-testid="travel-planner-shell"
      >
        <div className="tool-shell">
          <aside className="tool-sidebar" aria-label="Travel planner navigation">
            <div className="tool-brand">
              <div className="tool-brand-mark" aria-hidden="true">
                <Plane className="h-4 w-4" />
              </div>
              <div className="tool-brand-name">
                Travel Planner
                <small>Plan · Track · Journal</small>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5" aria-label="Section navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.id} href={item.href} className="tool-nav-link">
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>

            <div className="tool-sidebar-footer">
              <Bookmark size={14} aria-hidden="true" />
              <span>Saved in your browser</span>
            </div>
          </aside>

          <main className="tool-main">
            <div className="tool-topbar">
              <div className="min-w-0">
                <p className="tool-crumbs">
                  Travel Planner /{" "}
                  <strong>{activeTrip ? activeTrip.name : "No trip selected"}</strong>
                </p>
                <h1>Travel Planner</h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {trips.length > 0 ? (
                  <label className="flex items-center gap-2 rounded-full border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_92%,var(--home-elev-mix))] px-3 py-1.5 text-[12px] font-semibold text-[var(--home-ink)] shadow-[var(--shadow-sm)]">
                    <CalendarDays className="h-3.5 w-3.5 text-[var(--home-haze)]" aria-hidden="true" />
                    <span className="sr-only">Active trip</span>
                    <select
                      aria-label="Active trip"
                      value={activeTripId ?? ""}
                      onChange={(event) => selectTrip(event.target.value)}
                      className="border-0 bg-transparent p-0 text-[12px] font-semibold text-[var(--home-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    >
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowTripForm((open) => !open)}
                  className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-full bg-[var(--home-ink)] px-3 text-[12.5px] font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-haze))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                  aria-expanded={showTripForm}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New trip
                </button>
              </div>
            </div>

            {showTripForm ? (
              <section
                aria-label="Create a new trip"
                className="tool-card mb-5 border-dashed"
              >
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreateTrip}>
                  <label className="block sm:col-span-2">
                    <span className={fieldLabel}>Trip name</span>
                    <input
                      type="text"
                      autoFocus
                      value={tripDraft.name}
                      onChange={(event) =>
                        setTripDraft((draft) => ({ ...draft, name: event.target.value }))
                      }
                      placeholder="Lisbon long weekend"
                      className={fieldInput}
                      required
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={fieldLabel}>Destination</span>
                    <input
                      type="text"
                      value={tripDraft.destination}
                      onChange={(event) =>
                        setTripDraft((draft) => ({ ...draft, destination: event.target.value }))
                      }
                      placeholder="Lisbon, Portugal"
                      className={fieldInput}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Start date</span>
                    <input
                      type="date"
                      value={tripDraft.startDate}
                      onChange={(event) =>
                        setTripDraft((draft) => ({
                          ...draft,
                          startDate: event.target.value,
                          endDate:
                            !draft.endDate || draft.endDate < event.target.value
                              ? event.target.value
                              : draft.endDate,
                        }))
                      }
                      className={fieldInput}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>End date</span>
                    <input
                      type="date"
                      value={tripDraft.endDate}
                      min={tripDraft.startDate}
                      onChange={(event) =>
                        setTripDraft((draft) => ({ ...draft, endDate: event.target.value }))
                      }
                      className={fieldInput}
                      required
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button
                      type="submit"
                      className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-4 text-[13px] font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-haze))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Save trip
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTripForm(false)}
                      className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 text-[12.5px] font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            {activeTrip && summary ? (
              <ActiveTripView
                trip={activeTrip}
                summary={summary}
                onUpdateField={(fields) => updateTripFields(activeTrip.id, fields)}
                onToggleActivity={(activityId) => toggleActivity(activeTrip.id, activityId)}
                onRemoveActivity={(activityId) => {
                  removeActivity(activeTrip.id, activityId);
                  if (editingActivityId === activityId) resetActivityDraft();
                }}
                onEditActivity={handleEditActivity}
                onRemoveJournal={(entryId) => {
                  removeJournal(activeTrip.id, entryId);
                  if (editingJournalId === entryId) resetJournalDraft();
                }}
                onEditJournal={handleEditJournal}
                onSelectTrip={selectTrip}
                onRemoveTrip={removeTrip}
                trips={trips}
              />
            ) : (
              <EmptyState onStart={() => setShowTripForm(true)} />
            )}
          </main>

          <aside className="tool-rail" aria-label="Quick actions">
            <section aria-labelledby="rail-add-activity">
              <p className="tool-rail-label" id="rail-add-activity">
                <Plus size={12} aria-hidden="true" />
                {editingActivityId ? "Edit stop" : "Add stop"}
              </p>
              <form
                onSubmit={handleSubmitActivity}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_94%,var(--home-elev-mix))] p-3 shadow-[var(--shadow-sm)]"
              >
                <fieldset disabled={!activeTrip} className="contents">
                  <label className="block">
                    <span className={fieldLabel}>Title</span>
                    <input
                      type="text"
                      value={activityDraft.title}
                      onChange={(event) =>
                        setActivityDraft((draft) => ({ ...draft, title: event.target.value }))
                      }
                      placeholder="Sunset at Miradouro"
                      className={fieldInput}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Date</span>
                    <input
                      type="date"
                      value={activityDraft.date}
                      min={activeTrip?.startDate}
                      max={activeTrip?.endDate}
                      onChange={(event) =>
                        setActivityDraft((draft) => ({ ...draft, date: event.target.value }))
                      }
                      className={fieldInput}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className={fieldLabel}>Starts</span>
                      <input
                        type="time"
                        value={activityDraft.time}
                        onChange={(event) =>
                          setActivityDraft((draft) => {
                            const time = event.target.value;
                            return {
                              ...draft,
                              time,
                              // Drop an end that's no longer after the start.
                              endTime:
                                time && draft.endTime > time ? draft.endTime : "",
                            };
                          })
                        }
                        className={fieldInput}
                      />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Ends</span>
                      <input
                        type="time"
                        value={activityDraft.endTime}
                        min={activityDraft.time || undefined}
                        disabled={!activityDraft.time}
                        onChange={(event) =>
                          setActivityDraft((draft) => ({ ...draft, endTime: event.target.value }))
                        }
                        className={`${fieldInput} disabled:cursor-not-allowed disabled:opacity-50`}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className={fieldLabel}>Category</span>
                    <select
                      value={activityDraft.category}
                      onChange={(event) =>
                        setActivityDraft((draft) => ({
                          ...draft,
                          category: event.target.value as ActivityDraft["category"],
                        }))
                      }
                      className={fieldInput}
                    >
                      {ACTIVITY_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {ACTIVITY_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Location</span>
                    <input
                      type="text"
                      value={activityDraft.location}
                      onChange={(event) =>
                        setActivityDraft((draft) => ({ ...draft, location: event.target.value }))
                      }
                      placeholder="Alfama"
                      className={fieldInput}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Notes</span>
                    <textarea
                      value={activityDraft.notes}
                      onChange={(event) =>
                        setActivityDraft((draft) => ({ ...draft, notes: event.target.value }))
                      }
                      placeholder="Reservation, what to bring, etc."
                      className={textareaInput}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="inline-flex min-h-touch flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-3 text-[13px] font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-haze))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {editingActivityId ? "Save stop" : "Add stop"}
                    </button>
                    {editingActivityId ? (
                      <button
                        type="button"
                        onClick={resetActivityDraft}
                        className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12.5px] font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </fieldset>
              </form>
            </section>

            <section aria-labelledby="rail-add-journal">
              <p className="tool-rail-label" id="rail-add-journal">
                <NotebookPen size={12} aria-hidden="true" />
                {editingJournalId ? "Edit entry" : "Journal entry"}
              </p>
              <form
                onSubmit={handleSubmitJournal}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--home-rule)] bg-[color-mix(in_srgb,var(--home-paper)_94%,var(--home-elev-mix))] p-3 shadow-[var(--shadow-sm)]"
              >
                <fieldset disabled={!activeTrip} className="contents">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className={fieldLabel}>Date</span>
                      <input
                        type="date"
                        value={journalDraft.date}
                        min={activeTrip?.startDate}
                        max={activeTrip?.endDate}
                        onChange={(event) =>
                          setJournalDraft((draft) => ({ ...draft, date: event.target.value }))
                        }
                        className={fieldInput}
                      />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Mood</span>
                      <select
                        value={journalDraft.mood}
                        onChange={(event) =>
                          setJournalDraft((draft) => ({
                            ...draft,
                            mood: event.target.value as JournalDraft["mood"],
                          }))
                        }
                        className={fieldInput}
                      >
                        {JOURNAL_MOODS.map((mood) => (
                          <option key={mood} value={mood}>
                            {JOURNAL_MOOD_LABELS[mood]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className={fieldLabel}>Title</span>
                    <input
                      type="text"
                      value={journalDraft.title}
                      onChange={(event) =>
                        setJournalDraft((draft) => ({ ...draft, title: event.target.value }))
                      }
                      placeholder="A long walk in Alfama"
                      className={fieldInput}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Notes</span>
                    <textarea
                      value={journalDraft.body}
                      onChange={(event) =>
                        setJournalDraft((draft) => ({ ...draft, body: event.target.value }))
                      }
                      placeholder="What stood out today…"
                      className={textareaInput}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="inline-flex min-h-touch flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-3 text-[13px] font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-haze))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {editingJournalId ? "Save entry" : "Add entry"}
                    </button>
                    {editingJournalId ? (
                      <button
                        type="button"
                        onClick={resetJournalDraft}
                        className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12.5px] font-semibold text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </fieldset>
              </form>
            </section>

            <p className="tool-rail-foot">
              <Sparkles size={14} aria-hidden="true" />
              Saved in your browser — no account, no server.
            </p>
          </aside>
        </div>
      </motion.div>
    </div>
  );
}

interface ActiveTripViewProps {
  trip: Trip;
  summary: NonNullable<ReturnType<typeof useTravelPlanner>["summary"]>;
  trips: Trip[];
  onUpdateField: (
    fields: Partial<Pick<Trip, "name" | "destination" | "startDate" | "endDate" | "notes" | "budget">>
  ) => void;
  onToggleActivity: (activityId: string) => void;
  onRemoveActivity: (activityId: string) => void;
  onEditActivity: (activity: TripActivity) => void;
  onRemoveJournal: (entryId: string) => void;
  onEditJournal: (entry: JournalEntry) => void;
  onSelectTrip: (id: string) => void;
  onRemoveTrip: (id: string) => void;
}

function ActiveTripView({
  trip,
  summary,
  trips,
  onUpdateField,
  onToggleActivity,
  onRemoveActivity,
  onEditActivity,
  onRemoveJournal,
  onEditJournal,
  onSelectTrip,
  onRemoveTrip,
}: ActiveTripViewProps) {
  const today = getTodayKey();
  const journalSorted = useMemo(
    () =>
      [...trip.journal].sort((left, right) => {
        if (left.date !== right.date) return right.date.localeCompare(left.date);
        return right.id.localeCompare(left.id);
      }),
    [trip.journal]
  );

  const stats: HomeStatsCell[] = [
    {
      label: "Status",
      value: STATUS_LABELS[summary.status],
      tone: summary.status === "active" ? "good" : "default",
    },
    {
      label: "Days",
      value: `${summary.daysElapsed} / ${summary.daysTotal}`,
      sub:
        summary.status === "planned"
          ? `${summary.daysUntilStart} day${summary.daysUntilStart === 1 ? "" : "s"} away`
          : summary.status === "active"
            ? "Trip in progress"
            : "Trip wrapped",
    },
    {
      label: "Stops",
      value: `${summary.activitiesCompleted} / ${summary.activitiesTotal}`,
      sub:
        summary.activitiesTotal === 0
          ? "Add your first stop"
          : summary.conflictCount > 0
            ? `${summary.conflictCount} time overlap${summary.conflictCount === 1 ? "" : "s"}`
            : "Completed",
    },
    {
      label: "Journal",
      value: summary.journalCount.toString(),
      sub: summary.journalCount === 1 ? "entry" : "entries",
    },
    {
      label: "Destination",
      value: trip.destination || "—",
    },
    {
      label: "Dates",
      value: formatTripDateRange(trip.startDate, trip.endDate),
    },
    {
      label: "Budget",
      value: formatBudget(trip.budget),
    },
    {
      label: "Trips saved",
      value: trips.length.toString(),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div id="section-overview" className="scroll-mt-28">
        <HomeStatsPanel
          id="travel-stats"
          title="Trip at a glance"
          meta={STATUS_LABELS[summary.status]}
          hideLiveDot={summary.status !== "active"}
          cells={stats}
          pills={[
            { label: "Itinerary", href: "#section-itinerary" },
            { label: "Journal", href: "#section-journal" },
            { label: "Trips", href: "#section-trips" },
          ]}
        />
      </div>

      <section className="tool-card" aria-label="Trip details">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="tool-section-kicker">Trip</p>
            <h2 className="tool-section-title">{trip.name}</h2>
          </div>
          {trip.destination ? (
            <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--home-ink-muted)]">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {trip.destination}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>Trip name</span>
            <input
              type="text"
              value={trip.name}
              onChange={(event) => onUpdateField({ name: event.target.value })}
              className={fieldInput}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>Destination</span>
            <input
              type="text"
              value={trip.destination}
              onChange={(event) => onUpdateField({ destination: event.target.value })}
              className={fieldInput}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>Start date</span>
            <input
              type="date"
              value={trip.startDate}
              onChange={(event) => onUpdateField({ startDate: event.target.value })}
              className={fieldInput}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>End date</span>
            <input
              type="date"
              value={trip.endDate}
              min={trip.startDate}
              onChange={(event) => onUpdateField({ endDate: event.target.value })}
              className={fieldInput}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>Budget (USD)</span>
            <input
              type="number"
              min="0"
              step="50"
              value={String(trip.budget)}
              onChange={(event) => onUpdateField({ budget: Number(event.target.value) || 0 })}
              className={`${fieldInput} [font-variant-numeric:tabular-nums]`}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={fieldLabel}>Trip notes</span>
            <textarea
              value={trip.notes}
              onChange={(event) => onUpdateField({ notes: event.target.value })}
              placeholder="Hotels, packing list, must-see places…"
              className={textareaInput}
            />
          </label>
        </div>
      </section>

      <section
        id="section-itinerary"
        className="tool-card scroll-mt-28"
        aria-label="Day-by-day itinerary"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="tool-section-kicker">Day by day</p>
            <h2 className="tool-section-title">Itinerary</h2>
          </div>
          <p className="text-[12px] text-[var(--home-ink-muted)] [font-variant-numeric:tabular-nums]">
            {summary.activitiesCompleted}/{summary.activitiesTotal} stops checked off
          </p>
        </div>

        {summary.activitiesTotal > 0 ? (
          <div className="mt-3">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--home-rule)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={summary.activitiesTotal}
              aria-valuenow={summary.activitiesCompleted}
              aria-label="Itinerary completion"
            >
              <div
                className="h-full rounded-full bg-[var(--color-success,#2f7d4f)] transition-[width] duration-500"
                style={{
                  width: `${Math.round(
                    (summary.activitiesCompleted / summary.activitiesTotal) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {summary.activitiesTotal === 0 ? (
          <div className="tool-empty mt-4">
            <p className="text-[13.5px] font-semibold text-[var(--home-ink)]">No stops yet</p>
            <p>Add the first stop using the "Add stop" panel on the right.</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {summary.dayBuckets.map((bucket) => (
              <div key={bucket.date} className="flex flex-col gap-2">
                <header className="flex items-baseline justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                    <span className={bucket.date === today ? "text-[var(--home-ink)]" : undefined}>
                      {formatDayHeading(bucket.date)}
                    </span>
                    {bucket.date === today ? (
                      <span className="rounded-full bg-[var(--home-ink)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--home-paper)]">
                        Today
                      </span>
                    ) : null}
                  </h3>
                  <span className="text-[11.5px] text-[var(--home-ink-muted)] [font-variant-numeric:tabular-nums]">
                    {bucket.activities.length === 0
                      ? "0 stops"
                      : `${bucket.completed}/${bucket.activities.length} done`}
                  </span>
                </header>
                {bucket.activities.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--home-rule)] px-3 py-2 text-[12px] text-[var(--home-ink-muted)]">
                    Nothing planned yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--home-rule)] rounded-xl border border-[var(--home-rule)] bg-[var(--home-paper)]">
                    {bucket.activities.map((activity) => {
                      const categoryMeta = CATEGORY_META[activity.category];
                      const CategoryIcon = categoryMeta.icon;
                      const hasConflict = bucket.conflictIds.includes(activity.id);
                      return (
                      <li key={activity.id} className="flex items-start gap-3 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => onToggleActivity(activity.id)}
                          aria-label={
                            activity.completed
                              ? `Mark ${activity.title} as not done`
                              : `Mark ${activity.title} as done`
                          }
                          className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--home-ink-muted)] transition hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                        >
                          {activity.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-[var(--color-success,#2f7d4f)]" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <span
                          aria-hidden="true"
                          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            color: categoryMeta.tint,
                            backgroundColor: `color-mix(in srgb, ${categoryMeta.tint} 14%, transparent)`,
                          }}
                        >
                          <CategoryIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p
                              className={`text-[13.5px] font-semibold text-[var(--home-ink)] ${
                                activity.completed ? "line-through opacity-60" : ""
                              }`}
                            >
                              {activity.title}
                            </p>
                            {hasConflict ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-full border border-[var(--color-warning,#b8860b)] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--color-warning,#b8860b)]"
                                title="Overlaps another stop on this day"
                              >
                                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                Overlap
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs uppercase tracking-[0.12em] text-[var(--home-ink-muted)]">
                            <span style={{ color: categoryMeta.tint }}>
                              {ACTIVITY_CATEGORY_LABELS[activity.category]}
                            </span>
                            {activity.time ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{formatActivityTimeRange(activity.time, activity.endTime)}</span>
                              </>
                            ) : null}
                            {activity.location ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="normal-case tracking-normal">
                                  {activity.location}
                                </span>
                              </>
                            ) : null}
                          </p>
                          {activity.notes ? (
                            <p className="mt-1 text-[12.5px] text-[var(--home-ink-muted)] whitespace-pre-line">
                              {activity.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditActivity(activity)}
                            className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2.5 text-[11.5px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveActivity(activity.id)}
                            className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-2.5 text-[11.5px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                            aria-label={`Delete ${activity.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        id="section-journal"
        className="tool-card scroll-mt-28"
        aria-label="Trip journal"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="tool-section-kicker">Reflection</p>
            <h2 className="tool-section-title">Journal</h2>
          </div>
          <p className="text-[12px] text-[var(--home-ink-muted)] [font-variant-numeric:tabular-nums]">
            {trip.journal.length} {trip.journal.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        {journalSorted.length === 0 ? (
          <div className="tool-empty mt-4">
            <p className="text-[13.5px] font-semibold text-[var(--home-ink)]">
              Journal is empty
            </p>
            <p>Capture a moment using the journal panel on the right.</p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {journalSorted.map((entry) => {
              const MoodIcon = MOOD_ICON[entry.mood];
              return (
              <li
                key={entry.id}
                className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-[13.5px] font-semibold text-[var(--home-ink)]">
                      {entry.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-2xs uppercase tracking-[0.14em] text-[var(--home-ink-muted)]">
                      <span>{formatDayHeading(entry.date)}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ color: MOOD_TONE[entry.mood] }}
                      >
                        <MoodIcon aria-hidden="true" className="h-3.5 w-3.5" />
                        {JOURNAL_MOOD_LABELS[entry.mood]}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditJournal(entry)}
                      className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--home-haze)] hover:text-[var(--home-haze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveJournal(entry.id)}
                      aria-label={`Delete journal entry ${entry.title}`}
                      className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {entry.body ? (
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[var(--home-ink)]">
                    {entry.body}
                  </p>
                ) : null}
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        id="section-trips"
        className="tool-card scroll-mt-28"
        aria-label="All saved trips"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="tool-section-kicker">Library</p>
            <h2 className="tool-section-title">All trips</h2>
          </div>
          <p className="text-[12px] text-[var(--home-ink-muted)] [font-variant-numeric:tabular-nums]">
            {trips.length} {trips.length === 1 ? "trip" : "trips"}
          </p>
        </div>
        <ul className="mt-4 divide-y divide-[var(--home-rule)]">
          {trips.map((other) => {
            const isActive = other.id === trip.id;
            return (
              <li
                key={other.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => onSelectTrip(other.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[13.5px] font-semibold text-[var(--home-ink)]">
                    {other.name} {isActive ? <span className="text-2xs font-medium text-[var(--home-haze)]">· active</span> : null}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-[var(--home-ink-muted)]">
                    {other.destination || "No destination"} ·{" "}
                    {formatTripDateRange(other.startDate, other.endDate)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      !window.confirm(`Delete "${other.name}"? This can't be undone.`)
                    ) {
                      return;
                    }
                    onRemoveTrip(other.id);
                  }}
                  aria-label={`Delete trip ${other.name}`}
                  className="inline-flex min-h-touch items-center justify-center rounded-lg border border-[var(--home-rule)] bg-[var(--home-paper)] px-3 text-[12px] font-medium text-[var(--home-ink-muted)] transition hover:border-[var(--color-error)] hover:text-[var(--color-error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="tool-empty mt-2">
      <p className="text-[14.5px] font-semibold text-[var(--home-ink)]">
        No trips yet
      </p>
      <p className="mb-4 mt-1">
        Start a trip to plan a day-by-day itinerary, track stops, and keep a journal as you go.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-touch items-center justify-center gap-1.5 rounded-lg bg-[var(--home-ink)] px-4 text-[13px] font-semibold text-[var(--home-paper)] shadow-[var(--shadow-sm)] transition hover:bg-[color-mix(in_srgb,var(--home-ink)_88%,var(--home-haze))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-haze)] focus-visible:ring-offset-2"
      >
        <Plus className="h-3.5 w-3.5" />
        Start a trip
      </button>
    </div>
  );
}
