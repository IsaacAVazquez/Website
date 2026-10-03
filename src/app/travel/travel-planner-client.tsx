"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Circle,
  Frown,
  Landmark,
  type LucideIcon,
  MapPin,
  Meh,
  Moon,
  Plus,
  Smile,
  Star,
  Ticket,
  Train,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { Catalog97ProjectHero } from "@/components/catalog97/Catalog97ProjectHero";
import { PROJECT_PRESS } from "@/constants/projectPress";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  JOURNAL_MOODS,
  JOURNAL_MOOD_LABELS,
  MAX_ITINERARY_DAYS,
  TRAVEL_PLANNER_STORAGE_KEY,
  formatActivityTimeRange,
  formatDayHeading,
  formatTripDateRange,
  getDefaultActivityDate,
  getTodayKey,
  isIsoDate,
} from "@/lib/travelPlanner";
import {
  type ActivityDraft,
  type JournalDraft,
  useTravelPlanner,
} from "@/hooks/useTravelPlanner";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { boardingPass, itineraryColumns, timelineTicks, type ItineraryColumn, type TimelineTick } from "./itinerary";
import type { ActivityCategory, JournalEntry, Trip, TripActivity } from "@/types/travel";
import "./travel.css";

const ROUTE = "/travel";

const CATEGORY_ICON: Record<ActivityCategory, LucideIcon> = {
  transit: Train,
  lodging: BedDouble,
  food: UtensilsCrossed,
  sight: Landmark,
  activity: Ticket,
  other: MapPin,
};

/** Category swatches come from the chart ramp, never a hand-picked hex. */
const CATEGORY_CHART: Record<ActivityCategory, string> = {
  transit: "var(--c97-chart-1)",
  lodging: "var(--c97-chart-2)",
  food: "var(--c97-chart-3)",
  sight: "var(--c97-chart-4)",
  activity: "var(--c97-chart-5)",
  other: "var(--c97-chart-6)",
};

const MOOD_ICON: Record<JournalEntry["mood"], LucideIcon> = {
  amazing: Star,
  good: Smile,
  neutral: Meh,
  rough: Frown,
  tired: Moon,
};

/** Mood is always spelled out as text; the tone class only supplements it. */
const MOOD_CHIP_TONE: Record<JournalEntry["mood"], string> = {
  amazing: "c97-chip-positive",
  good: "",
  neutral: "",
  rough: "c97-chip-warning",
  tired: "c97-chip-negative",
};

function emptyActivityDraft(date: string): ActivityDraft {
  return { date, time: "", endTime: "", title: "", location: "", category: "activity", notes: "" };
}

function emptyJournalDraft(date: string): JournalDraft {
  return { date, title: "", body: "", mood: "good" };
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

export function TravelPlannerClient() {
  const planner = useTravelPlanner();
  const persistenceStatus = useLocalStoragePersistenceStatus(TRAVEL_PLANNER_STORAGE_KEY);
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


  const today = getTodayKey();
  const lead = PROJECT_PRESS[ROUTE].lead;

  const tripNameInputRef = useRef<HTMLInputElement>(null);
  const [tripDraft, setTripDraft] = useState({ name: "", destination: "", startDate: today, endDate: today });
  const [showTripForm, setShowTripForm] = useState(false);
  // Which delete button is armed, as "active:<id>" or "row:<id>". A second
  // click deletes, "Keep it" disarms, and focus returns to a control that stays.
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const newTripButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteTrip = (id: string) => {
    removeTrip(id);
    setConfirmingDelete(null);
    newTripButtonRef.current?.focus();
  };

  function openTripForm() {
    setShowTripForm(true);
    requestAnimationFrame(() => tripNameInputRef.current?.focus());
  }

  const defaultActivityDate = useMemo(
    () => (activeTrip ? getDefaultActivityDate(activeTrip, today) : today),
    [activeTrip, today]
  );

  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(() => emptyActivityDraft(defaultActivityDate));
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityTitleMissing, setActivityTitleMissing] = useState(false);

  const [journalDraft, setJournalDraft] = useState<JournalDraft>(() => emptyJournalDraft(defaultActivityDate));
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalEmpty, setJournalEmpty] = useState(false);

  const [lastTripContext, setLastTripContext] = useState({ tripId: activeTripId, date: defaultActivityDate });
  if (lastTripContext.tripId !== activeTripId || lastTripContext.date !== defaultActivityDate) {
    setLastTripContext({ tripId: activeTripId, date: defaultActivityDate });
    setEditingActivityId(null);
    setEditingJournalId(null);
    setActivityDraft((draft) =>
      draft.title || draft.location || draft.notes || draft.time ? draft : emptyActivityDraft(defaultActivityDate)
    );
    setJournalDraft((draft) => (draft.title || draft.body ? draft : emptyJournalDraft(defaultActivityDate)));
  }

  function resetActivityDraft() {
    setEditingActivityId(null);
    setActivityTitleMissing(false);
    setActivityDraft(emptyActivityDraft(defaultActivityDate));
  }

  function resetJournalDraft() {
    setEditingJournalId(null);
    setJournalEmpty(false);
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
    setJournalDraft({ date: entry.date, title: entry.title, body: entry.body, mood: entry.mood });
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

  const endTimeInvalid = Boolean(
    activityDraft.time && activityDraft.endTime && activityDraft.endTime <= activityDraft.time
  );

  function handleSubmitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTrip) return;
    if (!activityDraft.title.trim()) {
      setActivityTitleMissing(true);
      return;
    }
    if (!activityDraft.date) return;
    if (endTimeInvalid) return;
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
    if (!journalDraft.title.trim() && !journalDraft.body.trim()) {
      setJournalEmpty(true);
      return;
    }
    if (editingJournalId) {
      updateJournal(activeTrip.id, editingJournalId, journalDraft);
    } else {
      addJournal(activeTrip.id, journalDraft);
    }
    resetJournalDraft();
  }

  const passData = activeTrip && summary ? boardingPass(activeTrip, summary, today) : null;
  const conflictIds = summary ? summary.dayBuckets.flatMap((bucket) => bucket.conflictIds) : [];
  const columns = summary ? itineraryColumns(summary.dayBuckets, conflictIds) : [];

  const standfirst =
    "I wanted one dated plan per trip, laid out by day, with the stops I've done ticked off and a journal for what actually happened along the way.";

  return (
    <div data-testid="travel-planner-shell">
      <Catalog97ProjectHero
        ink={lead}
        title="Travel Planner"
        standfirst={standfirst}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "var(--c97-sp-4)" }}>
          <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: 0 }}>
            Your trips are saved in this browser only, so they never leave this device.
          </p>
          <div data-c97-surface="paper" className="c97-offset c97-boarding-pass">
            <BoardingPassMain
              trips={trips}
              activeTripId={activeTripId}
              destination={passData?.destination ?? null}
              dateRange={passData?.dateRange ?? null}
              onSelectTrip={selectTrip}
            />
            <BoardingPassStub pass={passData} onStartTrip={openTripForm} />
          </div>

          {persistenceStatus === "memory-only" ? (
            <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }} role="status">
              Your trips are available in this tab, but browser storage is unavailable, so changes may not last
              after you close it.
            </p>
          ) : null}

          {activeTrip && summary ? (
            <div data-c97-surface="paper" className="c97-offset" style={{ padding: "var(--c97-sp-3)" }}>
              <ItineraryTimeline columns={columns} ticks={summary ? timelineTicks(summary.dayBuckets) : []} />
            </div>
          ) : null}
        </div>
      </Catalog97ProjectHero>

      <section
        id="section-itinerary"
        className="c97-band c97-sheet"
        data-c97-surface="paper"
        data-seam="torn"
        aria-label="Day-by-day itinerary"
      >
        <div className="c97-shell">
          <div className="flex flex-wrap items-end justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <div>
              <p className="c97-kicker">Day by day</p>
              <h2 className="c97-poster-sm">Itinerary</h2>
            </div>
            {summary ? (
              <p className="c97-meta c97-tabular">
                {summary.activitiesCompleted}/{summary.activitiesTotal} stops checked off
              </p>
            ) : null}
          </div>

          {summary?.itineraryTruncated ? (
            <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-3)" }}>
              This trip spans {summary.daysTotal.toLocaleString("en-US")} days, so the itinerary shows the first{" "}
              {MAX_ITINERARY_DAYS}. Double-check the trip dates if that looks off.
            </p>
          ) : null}

          <div className="grid" style={{ gap: "var(--c97-sp-4)", marginTop: "var(--c97-sp-4)" }}>
            <div className="xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]" style={{ gap: "var(--c97-sp-4)" }}>
              <div>
                {!activeTrip ? (
                  <p className="c97-prose">Start a trip above to plan its first day.</p>
                ) : summary && summary.activitiesTotal === 0 ? (
                  <p className="c97-prose">No stops yet. Add the first one with the Add stop form.</p>
                ) : (
                  <div className="flex flex-col" style={{ gap: "var(--c97-sp-3)" }}>
                    {summary?.dayBuckets.map((bucket) => (
                      <DayList key={bucket.date} bucket={bucket} today={today} onToggle={(id) => activeTrip && toggleActivity(activeTrip.id, id)} onEdit={handleEditActivity} onRemove={(id) => {
                        if (!activeTrip) return;
                        removeActivity(activeTrip.id, id);
                        if (editingActivityId === id) resetActivityDraft();
                      }} />
                    ))}
                  </div>
                )}
              </div>

              <aside className="mt-[var(--c97-sp-3)] xl:mt-0">
                <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
                  {editingActivityId ? "Edit stop" : "Add stop"}
                </p>
                <form onSubmit={handleSubmitActivity} className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
                  <fieldset disabled={!activeTrip} className="contents">
                    <label className="block">
                      <span className="c97-kicker">Title</span>
                      <input
                        type="text"
                        value={activityDraft.title}
                        onChange={(e) => {
                          setActivityTitleMissing(false);
                          setActivityDraft((d) => ({ ...d, title: e.target.value }));
                        }}
                        aria-invalid={activityTitleMissing || undefined}
                        aria-describedby={activityTitleMissing ? "travel-stop-title-error" : undefined}
                        placeholder="Sunset at Miradouro"
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                    {activityTitleMissing ? (
                      <p id="travel-stop-title-error" role="alert" className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-negative)" }}>
                        Give the stop a title to add it.
                      </p>
                    ) : null}
                    <label className="block">
                      <span className="c97-kicker">Date</span>
                      <input
                        type="date"
                        value={activityDraft.date}
                        min={activeTrip?.startDate}
                        max={activeTrip?.endDate}
                        onChange={(e) => setActivityDraft((d) => ({ ...d, date: e.target.value }))}
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                    <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
                      <label className="block">
                        <span className="c97-kicker">Starts</span>
                        <input
                          type="time"
                          value={activityDraft.time}
                          onChange={(e) =>
                            setActivityDraft((d) => {
                              const time = e.target.value;
                              return { ...d, time, endTime: time && d.endTime > time ? d.endTime : "" };
                            })
                          }
                          className="c97-field"
                          style={{ marginTop: "var(--c97-sp-1)" }}
                        />
                      </label>
                      <label className="block">
                        <span className="c97-kicker">Ends</span>
                        <input
                          type="time"
                          value={activityDraft.endTime}
                          min={activityDraft.time || undefined}
                          disabled={!activityDraft.time}
                          aria-invalid={endTimeInvalid || undefined}
                          onChange={(e) => setActivityDraft((d) => ({ ...d, endTime: e.target.value }))}
                          className="c97-field"
                          style={{ marginTop: "var(--c97-sp-1)" }}
                        />
                      </label>
                    </div>
                    {endTimeInvalid ? (
                      <p role="alert" className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-negative)" }}>
                        The end time has to come after the start. Overnight stops need one entry per day.
                      </p>
                    ) : null}
                    <label className="block">
                      <span className="c97-kicker">Category</span>
                      <select
                        value={activityDraft.category}
                        onChange={(e) => setActivityDraft((d) => ({ ...d, category: e.target.value as ActivityDraft["category"] }))}
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      >
                        {ACTIVITY_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {ACTIVITY_CATEGORY_LABELS[category]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="c97-kicker">Location</span>
                      <input
                        type="text"
                        value={activityDraft.location}
                        onChange={(e) => setActivityDraft((d) => ({ ...d, location: e.target.value }))}
                        placeholder="Alfama"
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                    <label className="block">
                      <span className="c97-kicker">Notes</span>
                      <textarea
                        value={activityDraft.notes}
                        onChange={(e) => setActivityDraft((d) => ({ ...d, notes: e.target.value }))}
                        placeholder="Reservation, what to bring, etc."
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)", minHeight: "88px" }}
                      />
                    </label>
                    <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                      <button type="submit" className="c97-btn">
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        {editingActivityId ? "Save stop" : "Add stop"}
                      </button>
                      {editingActivityId ? (
                        <button type="button" onClick={resetActivityDraft} className="c97-btn-ghost">
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </fieldset>
                </form>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section
        id="section-journal"
        className="c97-band c97-sheet"
        data-c97-surface="bone"
        data-seam="deckle"
        aria-label="Trip journal"
      >
        <div className="c97-shell">
          <div className="flex flex-wrap items-end justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <div>
              <p className="c97-kicker">Reflection</p>
              <h2 className="c97-poster-sm">Journal</h2>
            </div>
            {activeTrip ? (
              <p className="c97-meta c97-tabular">
                {activeTrip.journal.length} {activeTrip.journal.length === 1 ? "entry" : "entries"}
              </p>
            ) : null}
          </div>

          <div className="xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]" style={{ gap: "var(--c97-sp-4)", marginTop: "var(--c97-sp-4)" }}>
            <div>
              {!activeTrip ? (
                <p className="c97-prose">Start a trip above to keep a journal for it.</p>
              ) : activeTrip.journal.length === 0 ? (
                <p className="c97-prose">Journal is empty. Capture a moment with the Journal entry form.</p>
              ) : (
                <ul className="flex flex-col" style={{ gap: "var(--c97-sp-2)", listStyle: "none", padding: 0, margin: 0 }}>
                  {[...activeTrip.journal]
                    .sort((left, right) =>
                      left.date !== right.date ? right.date.localeCompare(left.date) : right.id.localeCompare(left.id)
                    )
                    .map((entry) => (
                      <JournalPostcard
                        key={entry.id}
                        entry={entry}
                        onEdit={handleEditJournal}
                        onRemove={(id) => {
                          if (!activeTrip) return;
                          removeJournal(activeTrip.id, id);
                          if (editingJournalId === id) resetJournalDraft();
                        }}
                      />
                    ))}
                </ul>
              )}
            </div>

            <aside className="mt-[var(--c97-sp-3)] xl:mt-0">
              <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
                {editingJournalId ? "Edit entry" : "Journal entry"}
              </p>
              <form onSubmit={handleSubmitJournal} className="c97-panel" style={{ display: "grid", gap: "var(--c97-sp-2)" }}>
                <fieldset disabled={!activeTrip} className="contents">
                  <div className="grid grid-cols-2" style={{ gap: "var(--c97-sp-1)" }}>
                    <label className="block">
                      <span className="c97-kicker">Date</span>
                      <input
                        type="date"
                        value={journalDraft.date}
                        min={activeTrip?.startDate}
                        max={activeTrip?.endDate}
                        onChange={(e) => setJournalDraft((d) => ({ ...d, date: e.target.value }))}
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
                      />
                    </label>
                    <label className="block">
                      <span className="c97-kicker">Mood</span>
                      <select
                        value={journalDraft.mood}
                        onChange={(e) => setJournalDraft((d) => ({ ...d, mood: e.target.value as JournalDraft["mood"] }))}
                        className="c97-field"
                        style={{ marginTop: "var(--c97-sp-1)" }}
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
                    <span className="c97-kicker">Title</span>
                    <input
                      type="text"
                      value={journalDraft.title}
                      onChange={(e) => {
                        setJournalEmpty(false);
                        setJournalDraft((d) => ({ ...d, title: e.target.value }));
                      }}
                      aria-describedby={journalEmpty ? "travel-journal-error" : undefined}
                      placeholder="A long walk in Alfama"
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)" }}
                    />
                  </label>
                  <label className="block">
                    <span className="c97-kicker">Notes</span>
                    <textarea
                      value={journalDraft.body}
                      onChange={(e) => {
                        setJournalEmpty(false);
                        setJournalDraft((d) => ({ ...d, body: e.target.value }));
                      }}
                      aria-describedby={journalEmpty ? "travel-journal-error" : undefined}
                      placeholder="What stood out today"
                      className="c97-field"
                      style={{ marginTop: "var(--c97-sp-1)", minHeight: "88px" }}
                    />
                  </label>
                  {journalEmpty ? (
                    <p id="travel-journal-error" role="alert" className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-negative)" }}>
                      Add a title or a note to save the entry.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
                    <button type="submit" className="c97-btn">
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      {editingJournalId ? "Save entry" : "Add entry"}
                    </button>
                    {editingJournalId ? (
                      <button type="button" onClick={resetJournalDraft} className="c97-btn-ghost">
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </fieldset>
              </form>
            </aside>
          </div>
        </div>
      </section>

      <section id="section-trip" className="c97-band c97-sheet" data-c97-surface="paper" data-seam="torn" aria-label="Trip management">
        <div className="c97-shell">
          <div className="flex flex-wrap items-end justify-between" style={{ gap: "var(--c97-sp-2)" }}>
            <div>
              <p className="c97-kicker">Manage</p>
              <h2 className="c97-poster-sm">Trip</h2>
            </div>
            <div className="flex flex-wrap" style={{ gap: "var(--c97-sp-1)" }}>
              {activeTrip ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      confirmingDelete === `active:${activeTrip.id}`
                        ? confirmDeleteTrip(activeTrip.id)
                        : setConfirmingDelete(`active:${activeTrip.id}`)
                    }
                    className="c97-btn-ghost"
                    style={confirmingDelete === `active:${activeTrip.id}` ? { color: "var(--c97-negative)" } : undefined}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {confirmingDelete === `active:${activeTrip.id}` ? "Confirm delete" : "Delete trip"}
                  </button>
                  {confirmingDelete === `active:${activeTrip.id}` ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        setConfirmingDelete(null);
                        (event.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
                      }}
                      className="c97-btn-ghost"
                    >
                      Keep it
                    </button>
                  ) : null}
                </>
              ) : null}
              <button ref={newTripButtonRef} type="button" onClick={() => (showTripForm ? setShowTripForm(false) : openTripForm())} className="c97-btn" aria-expanded={showTripForm}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New trip
              </button>
            </div>
          </div>

          {showTripForm ? (
            <form onSubmit={handleCreateTrip} className="c97-panel grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)", marginTop: "var(--c97-sp-3)" }} aria-label="Create a new trip">
              <label className="block sm:col-span-2">
                <span className="c97-kicker">Trip name</span>
                <input
                  ref={tripNameInputRef}
                  type="text"
                  value={tripDraft.name}
                  onChange={(e) => setTripDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Lisbon long weekend"
                  className="c97-field"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="c97-kicker">Destination</span>
                <input
                  type="text"
                  value={tripDraft.destination}
                  onChange={(e) => setTripDraft((d) => ({ ...d, destination: e.target.value }))}
                  placeholder="Lisbon, Portugal"
                  className="c97-field"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                />
              </label>
              <label className="block">
                <span className="c97-kicker">Start date</span>
                <input
                  type="date"
                  value={tripDraft.startDate}
                  onChange={(e) =>
                    setTripDraft((d) => ({
                      ...d,
                      startDate: e.target.value,
                      endDate: !d.endDate || d.endDate < e.target.value ? e.target.value : d.endDate,
                    }))
                  }
                  className="c97-field"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                  required
                />
              </label>
              <label className="block">
                <span className="c97-kicker">End date</span>
                <input
                  type="date"
                  value={tripDraft.endDate}
                  min={tripDraft.startDate}
                  onChange={(e) => setTripDraft((d) => ({ ...d, endDate: e.target.value }))}
                  className="c97-field"
                  style={{ marginTop: "var(--c97-sp-1)" }}
                  required
                />
              </label>
              <div className="flex flex-wrap sm:col-span-2" style={{ gap: "var(--c97-sp-1)" }}>
                <button type="submit" className="c97-btn">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Save trip
                </button>
                <button type="button" onClick={() => setShowTripForm(false)} className="c97-btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {activeTrip ? (
            <div style={{ marginTop: "var(--c97-sp-4)" }}>
              <TripDetailsFields trip={activeTrip} onUpdateField={(fields) => updateTripFields(activeTrip.id, fields)} />
            </div>
          ) : null}

          <div style={{ marginTop: "var(--c97-sp-5)" }}>
            <p className="c97-kicker" style={{ marginBottom: "var(--c97-sp-2)" }}>
              All trips ({trips.length})
            </p>
            {trips.length === 0 ? (
              <p className="c97-prose">No trips saved yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {trips.map((other) => (
                  <li key={other.id} className="c97-row" style={{ minHeight: "44px", borderBottom: "1px solid var(--c97-rule)", padding: "var(--c97-sp-1) 0" }}>
                    <button
                      type="button"
                      onClick={() => selectTrip(other.id)}
                      aria-current={other.id === activeTrip?.id ? "true" : undefined}
                      className="c97-travel-trip-pick text-left min-w-0"
                    >
                      <span className="c97-serif" style={{ display: "block", fontSize: "var(--c97-fs-body)" }}>
                        {other.name}
                        {other.id === activeTrip?.id ? " (active)" : ""}
                      </span>
                      <span className="c97-meta" style={{ display: "block", marginTop: "2px" }}>
                        {other.destination || "No destination"} &middot; {formatTripDateRange(other.startDate, other.endDate)}
                      </span>
                    </button>
                    <div className="flex flex-wrap justify-end" style={{ gap: "var(--c97-sp-1)" }}>
                      <button
                        type="button"
                        onClick={() =>
                          confirmingDelete === `row:${other.id}`
                            ? confirmDeleteTrip(other.id)
                            : setConfirmingDelete(`row:${other.id}`)
                        }
                        aria-label={
                          confirmingDelete === `row:${other.id}`
                            ? `Confirm delete trip ${other.name}`
                            : `Delete trip ${other.name}`
                        }
                        className="c97-btn-ghost"
                        style={{
                          minWidth: 44,
                          justifyContent: "center",
                          ...(confirmingDelete === `row:${other.id}` ? { color: "var(--c97-negative)" } : {}),
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {confirmingDelete === `row:${other.id}` ? "Confirm delete" : null}
                      </button>
                      {confirmingDelete === `row:${other.id}` ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            setConfirmingDelete(null);
                            (event.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
                          }}
                          className="c97-btn-ghost"
                        >
                          Keep it
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

interface BoardingPassMainProps {
  trips: Trip[];
  activeTripId: string | null;
  destination: string | null;
  dateRange: string | null;
  onSelectTrip: (id: string) => void;
}

function BoardingPassMain({ trips, activeTripId, destination, dateRange, onSelectTrip }: BoardingPassMainProps) {
  return (
    <div>
      <p className="c97-kicker">Boarding pass</p>
      {trips.length > 0 ? (
        <label className="block c97-boarding-pass-trip-select">
          <span className="sr-only">Trip</span>
          <select value={activeTripId ?? ""} onChange={(e) => onSelectTrip(e.target.value)} className="c97-field">
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="c97-serif c97-h2 c97-boarding-pass-destination">
        {destination ?? <span className="c97-boarding-pass-blank" aria-hidden="true" />}
      </p>
      {destination ? null : <p className="c97-stat-label">Destination</p>}
      <p className="c97-meta" style={{ marginTop: "var(--c97-sp-1)" }}>
        {dateRange ?? <span className="c97-boarding-pass-blank-sm" aria-hidden="true" />}
      </p>
      {dateRange ? null : <p className="c97-stat-label">Dates</p>}
    </div>
  );
}

function BoardingPassStub({ pass, onStartTrip }: { pass: ReturnType<typeof boardingPass> | null; onStartTrip: () => void }) {
  return (
    <div className="c97-boarding-pass-stub">
      <p className="c97-stat-label">{pass ? "Stops" : "No trip yet"}</p>
      <p className="c97-stat-value">{pass ? `${pass.stopsDone}/${pass.stopsTotal}` : "—"}</p>
      <p className="c97-stat-delta">{pass ? pass.countdown : "Nothing planned"}</p>
      {!pass ? (
        <button type="button" onClick={onStartTrip} className="c97-btn c97-offset" style={{ marginTop: "var(--c97-sp-2)" }}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Start a trip
        </button>
      ) : null}
    </div>
  );
}

function describeTimeline(columns: ItineraryColumn[]): string {
  const totalStops = columns.reduce((n, c) => n + c.stops.length + c.untimed.length, 0);
  const conflicts = columns.reduce((n, c) => n + c.stops.filter((s) => s.conflict).length, 0);
  const days = columns.length;
  return `Itinerary across ${days} day${days === 1 ? "" : "s"}, ${totalStops} stop${
    totalStops === 1 ? "" : "s"
  } placed by time and category${conflicts > 0 ? `, ${conflicts} overlapping` : ""}.`;
}

function ItineraryTimeline({ columns, ticks }: { columns: ItineraryColumn[]; ticks: TimelineTick[] }) {
  if (columns.length === 0) {
    return <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)" }}>No days yet.</p>;
  }
  const categories = ACTIVITY_CATEGORIES.filter((category) =>
    columns.some((column) => column.stops.some((stop) => stop.category === category)),
  );
  const hasConflict = columns.some((column) => column.stops.some((stop) => stop.conflict));
  return (
    <div>
      {columns.length > 3 ? (
        <p className="c97-meta c97-travel-timeline-cue" data-many={columns.length > 8 || undefined} style={{ marginBottom: "var(--c97-sp-2)" }}>
          Scroll to see every day
        </p>
      ) : null}
      <div className="c97-travel-timeline-frame">
        <div className="c97-travel-timeline-col c97-travel-timeline-axis" aria-hidden="true">
          <p className="c97-travel-timeline-day">&nbsp;</p>
          <div className="c97-travel-timeline-track">
            {ticks.map((tick) => (
              <span key={tick.label} style={{ top: `${tick.top * 100}%` }}>
                {tick.label}
              </span>
            ))}
          </div>
        </div>
        <div className="c97-travel-timeline" role="img" aria-label={describeTimeline(columns)}>
          {columns.map((column) => (
            <div key={column.dateKey} className="c97-travel-timeline-col">
              <p className="c97-travel-timeline-day">{column.label}</p>
              <div className="c97-travel-timeline-track">
                {ticks.map((tick) => (
                  <span key={tick.label} className="c97-travel-timeline-rule" style={{ top: `${tick.top * 100}%` }} />
                ))}
                {column.stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="c97-travel-timeline-mark"
                    data-conflict={stop.conflict || undefined}
                    data-done={stop.done || undefined}
                    style={{ top: `${stop.top * 100}%`, height: `${stop.height * 100}%`, ["--mark-color" as string]: CATEGORY_CHART[stop.category] }}
                    title={stop.title}
                  />
                ))}
              </div>
              {column.untimed.length > 0 ? (
                <p className="c97-travel-timeline-untimed">
                  {column.untimed.length} untimed
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {categories.length > 0 ? (
        <ul className="c97-travel-timeline-legend" aria-label="Timeline key">
          {categories.map((category) => (
            <li key={category}>
              <span className="c97-travel-timeline-swatch" style={{ ["--mark-color" as string]: CATEGORY_CHART[category] }} aria-hidden="true" />
              {ACTIVITY_CATEGORY_LABELS[category]}
            </li>
          ))}
          {hasConflict ? (
            <li>
              <span className="c97-travel-timeline-swatch" data-conflict="true" aria-hidden="true" />
              Overlaps another stop
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function DayList({
  bucket,
  today,
  onToggle,
  onEdit,
  onRemove,
}: {
  bucket: NonNullable<ReturnType<typeof useTravelPlanner>["summary"]>["dayBuckets"][number];
  today: string;
  onToggle: (id: string) => void;
  onEdit: (activity: TripActivity) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between" style={{ gap: "var(--c97-sp-1)" }}>
        <h3 className="c97-kicker" style={{ margin: 0, color: bucket.date === today ? "var(--c97-ink)" : undefined }}>
          {formatDayHeading(bucket.date)}
          {bucket.date === today ? " · Today" : ""}
        </h3>
        <span className="c97-meta c97-tabular">
          {bucket.activities.length === 0 ? "0 stops" : `${bucket.completed}/${bucket.activities.length} done`}
        </span>
      </div>
      {bucket.activities.length === 0 ? (
        <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-1)" }}>
          Nothing planned yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: "var(--c97-sp-2) 0 0" }}>
          {bucket.activities.map((activity) => {
            const Icon = CATEGORY_ICON[activity.category];
            const hasConflict = bucket.conflictIds.includes(activity.id);
            return (
              <li
                key={activity.id}
                className="flex items-start"
                style={{ gap: "var(--c97-sp-2)", padding: "var(--c97-sp-2) 0", borderBottom: "1px solid var(--c97-rule)" }}
              >
                <button
                  type="button"
                  onClick={() => onToggle(activity.id)}
                  aria-label={activity.completed ? `Mark ${activity.title} as not done` : `Mark ${activity.title} as done`}
                  className="c97-travel-toggle"
                >
                  {activity.completed ? (
                    <CheckCircle2 className="h-5 w-5" style={{ color: "var(--c97-positive)" }} />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" style={{ color: CATEGORY_CHART[activity.category], marginTop: "var(--c97-sp-0)" }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center" style={{ columnGap: "var(--c97-sp-1)", rowGap: "var(--c97-sp-0)" }}>
                    <p
                      className="c97-serif"
                      style={{
                        fontSize: "var(--c97-fs-body)",
                        color: activity.completed ? "var(--c97-ink-2)" : "var(--c97-ink)",
                        textDecoration: activity.completed ? "line-through" : "none",
                      }}
                    >
                      {activity.title}
                    </p>
                    {hasConflict ? (
                      <span className="c97-chip c97-chip-warning">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Overlap
                      </span>
                    ) : null}
                  </div>
                  <p className="c97-meta" style={{ marginTop: "2px" }}>
                    <span>{ACTIVITY_CATEGORY_LABELS[activity.category]}</span>
                    {activity.time ? <span>{formatActivityTimeRange(activity.time, activity.endTime)}</span> : null}
                    {activity.location ? <span style={{ textTransform: "none", letterSpacing: 0 }}>{activity.location}</span> : null}
                  </p>
                  {activity.notes ? (
                    <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", marginTop: "var(--c97-sp-1)", whiteSpace: "pre-line" }}>
                      {activity.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col" style={{ gap: "var(--c97-sp-0)" }}>
                  <button type="button" onClick={() => onEdit(activity)} className="c97-btn-ghost">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(activity.id)}
                    aria-label={`Delete ${activity.title}`}
                    className="c97-btn-ghost"
                    style={{ minWidth: 44, justifyContent: "center" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function JournalPostcard({
  entry,
  onEdit,
  onRemove,
}: {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onRemove: (id: string) => void;
}) {
  const MoodIcon = MOOD_ICON[entry.mood];
  const tone = MOOD_CHIP_TONE[entry.mood];
  return (
    <li data-c97-surface="paper" className="c97-offset c97-postcard">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between" style={{ gap: "var(--c97-sp-1)" }}>
          <p className="c97-serif" style={{ fontSize: "var(--c97-fs-body)" }}>
            {entry.title}
          </p>
          <div className="flex" style={{ gap: "var(--c97-sp-1)" }}>
            <button type="button" onClick={() => onEdit(entry)} className="c97-btn-ghost">
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              aria-label={`Delete journal entry ${entry.title}`}
              className="c97-btn-ghost"
              style={{ minWidth: 44, justifyContent: "center" }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        {entry.body ? (
          <p className="c97-prose" style={{ marginTop: "var(--c97-sp-2)", whiteSpace: "pre-line" }}>
            {entry.body}
          </p>
        ) : null}
      </div>
      <div className="c97-postcard-stamp">
        <p className="c97-meta" style={{ justifyContent: "center" }}>
          {formatDayHeading(entry.date)}
        </p>
        <span className={`c97-chip ${tone}`} style={{ justifyContent: "center" }}>
          <MoodIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {JOURNAL_MOOD_LABELS[entry.mood]}
        </span>
      </div>
    </li>
  );
}

interface TripDetailsFieldsProps {
  trip: Trip;
  onUpdateField: (fields: Partial<Pick<Trip, "name" | "destination" | "startDate" | "endDate" | "notes" | "budget">>) => void;
}

function tripFieldDraft(trip: Trip) {
  return {
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    budget: String(trip.budget),
    notes: trip.notes,
  };
}

function TripDetailsFields({ trip, onUpdateField }: TripDetailsFieldsProps) {
  // Edits buffer locally and commit on blur (dates commit as soon as they are
  // valid again), so the sanitize-on-parse store never sees partial input.
  const [draft, setDraft] = useState(() => tripFieldDraft(trip));
  const [lastTripId, setLastTripId] = useState(trip.id);
  if (lastTripId !== trip.id) {
    setLastTripId(trip.id);
    setDraft(tripFieldDraft(trip));
  }

  function setDraftField(field: keyof ReturnType<typeof tripFieldDraft>, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleDateChange(field: "startDate" | "endDate", value: string) {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      if (field === "startDate" && isIsoDate(value) && next.endDate < value) next.endDate = value;
      return next;
    });
    if (isIsoDate(value)) onUpdateField({ [field]: value });
  }

  function handleDateBlur(field: "startDate" | "endDate") {
    setDraft((current) => (isIsoDate(current[field]) ? current : { ...current, [field]: trip[field] }));
  }

  return (
    <div className="c97-panel grid sm:grid-cols-2" style={{ gap: "var(--c97-sp-2)" }}>
      <label className="block">
        <span className="c97-kicker">Trip name</span>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraftField("name", e.target.value)}
          onBlur={() => onUpdateField({ name: draft.name })}
          className="c97-field"
          style={{ marginTop: "var(--c97-sp-1)" }}
        />
      </label>
      <label className="block">
        <span className="c97-kicker">Destination</span>
        <input
          type="text"
          value={draft.destination}
          onChange={(e) => setDraftField("destination", e.target.value)}
          onBlur={() => onUpdateField({ destination: draft.destination })}
          className="c97-field"
          style={{ marginTop: "var(--c97-sp-1)" }}
        />
      </label>
      <label className="block">
        <span className="c97-kicker">Start date</span>
        <input
          type="date"
          value={draft.startDate}
          onChange={(e) => handleDateChange("startDate", e.target.value)}
          onBlur={() => handleDateBlur("startDate")}
          className="c97-field"
          style={{ marginTop: "var(--c97-sp-1)" }}
        />
      </label>
      <label className="block">
        <span className="c97-kicker">End date</span>
        <input
          type="date"
          value={draft.endDate}
          min={draft.startDate}
          onChange={(e) => handleDateChange("endDate", e.target.value)}
          onBlur={() => handleDateBlur("endDate")}
          className="c97-field"
          style={{ marginTop: "var(--c97-sp-1)" }}
        />
      </label>
      <label className="block">
        <span className="c97-kicker">Budget (USD)</span>
        <input
          type="number"
          min="0"
          step="50"
          value={draft.budget}
          onChange={(e) => setDraftField("budget", e.target.value)}
          onBlur={() => onUpdateField({ budget: Number(draft.budget) || 0 })}
          className="c97-field"
          style={{ marginTop: "var(--c97-sp-1)" }}
        />
        <span className="sr-only">{formatBudget(Number(draft.budget) || 0)}</span>
      </label>
      <label className="block sm:col-span-2">
        <span className="c97-kicker">Trip notes</span>
        <textarea
          value={draft.notes}
          onChange={(e) => setDraftField("notes", e.target.value)}
          onBlur={() => onUpdateField({ notes: draft.notes })}
          placeholder="Hotels, packing list, must-see places"
          className="c97-field"
          style={{ marginTop: "var(--c97-sp-1)", minHeight: "88px" }}
        />
      </label>
    </div>
  );
}
