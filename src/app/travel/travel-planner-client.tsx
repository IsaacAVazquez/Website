"use client";

import { type FormEvent, type ReactNode, type SetStateAction, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
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
import { useClientNow } from "@/hooks/useClientNow";
import { useLocalStoragePersistenceStatus } from "@/hooks/useLocalStorageString";
import { daysBetween } from "@/lib/date-formatters";
import { boardingPass, itineraryColumns, timelineTicks, type ItineraryColumn, type TimelineTick } from "./itinerary";
import type { ActivityCategory, JournalEntry, Trip, TripActivity } from "@/types/travel";
import "./travel.css";
import { activityBudget, tripCalendar } from "@/lib/travelExtras";
import { downloadFile } from "@/lib/downloadFile";

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

/** The first-visit illustration of what a planned day looks like. Never stored, never counted. */
const SAMPLE_DAY: { time: string; title: string; category: ActivityCategory; place: string; done: boolean }[] = [
  { time: "9:00 AM – 11:00 AM", title: "Jerónimos Monastery", category: "sight", place: "Belém", done: true },
  { time: "12:30 PM", title: "Lunch by the river", category: "food", place: "Cais do Sodré", done: false },
  { time: "7:00 PM", title: "Sunset at the miradouro", category: "activity", place: "Graça", done: false },
];

function emptyActivityDraft(date: string): ActivityDraft {
  return {
    date,
    time: "",
    endTime: "",
    title: "",
    location: "",
    category: "activity",
    notes: "",
    cost: null,
  };
}

function emptyJournalDraft(date: string): JournalDraft {
  return { date, title: "", body: "", mood: "good" };
}

/** US dollars, whole when the value is whole and with both cents otherwise, so 1250.5 reads $1,250.50 and never $1,250.5. */
function formatBudget(value: number) {
  if (!value) return "$0";
  const digits = value % 1 === 0 ? 0 : 2;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * A null date in the new-trip draft means "today", which is only known once
 * the page has mounted. An empty string is a date the visitor cleared or has
 * half typed, and it stays empty so the field is not written over mid-edit.
 */
const EMPTY_TRIP_DRAFT: { name: string; destination: string; startDate: string | null; endDate: string | null } = {
  name: "",
  destination: "",
  startDate: null,
  endDate: null,
};

export function TravelPlannerClient() {
  // Today is the browser's day, read after mount. The server's day and the
  // browser's differ whenever their clocks sit either side of midnight, so a
  // render-time read printed one date into the server HTML and another into
  // the first client render, and hydration failed. The hook takes the same
  // day, so the status, the countdown, and the Today marker share one clock.
  const now = useClientNow();
  const today = now === null ? "" : getTodayKey(new Date(now));

  const planner = useTravelPlanner(today);
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

  const tripNameInputRef = useRef<HTMLInputElement>(null);
  const [tripDraft, setTripDraft] = useState(EMPTY_TRIP_DRAFT);
  const draftStart = tripDraft.startDate ?? today;
  const draftEnd = tripDraft.endDate ?? today;
  const [showTripForm, setShowTripForm] = useState(false);
  // Which delete button is armed, as "active:<id>" or "row:<id>". A second
  // click deletes, "Keep it" disarms, and focus returns to a control that stays.
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const newTripButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteTrip = (id: string) => {
    removeTrip(id);
    setConfirmingDelete(null);
    // Deleting the last trip takes the trip header with it, so focus goes to the form that replaces it.
    if (trips.length <= 1) requestAnimationFrame(() => tripNameInputRef.current?.focus());
    else newTripButtonRef.current?.focus();
  };

  function openTripForm() {
    setShowTripForm(true);
    requestAnimationFrame(() => tripNameInputRef.current?.focus());
  }

  const defaultActivityDate = useMemo(
    () => (activeTrip ? getDefaultActivityDate(activeTrip, today || activeTrip.startDate) : today),
    [activeTrip, today]
  );

  const [activityDraft, setActivityDraft] = useState<ActivityDraft>(() => emptyActivityDraft(defaultActivityDate));
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityTitleMissing, setActivityTitleMissing] = useState(false);
  const activityTitleInputRef = useRef<HTMLInputElement>(null);
  // The day the stop form sits under. Null follows the default day.
  const [formDay, setFormDay] = useState<string | null>(null);

  const [journalDraft, setJournalDraft] = useState<JournalDraft>(() => emptyJournalDraft(defaultActivityDate));
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalEmpty, setJournalEmpty] = useState(false);
  const journalTitleInputRef = useRef<HTMLInputElement>(null);

  const [lastTripContext, setLastTripContext] = useState({ tripId: activeTripId, date: defaultActivityDate });
  if (lastTripContext.tripId !== activeTripId || lastTripContext.date !== defaultActivityDate) {
    const tripChanged = lastTripContext.tripId !== activeTripId;
    setLastTripContext({ tripId: activeTripId, date: defaultActivityDate });
    // The default day also moves at midnight and when the trip's dates change.
    // Only another trip ends an edit, or Save would add a copy and leave the original as it was.
    if (tripChanged) {
      setEditingActivityId(null);
      setEditingJournalId(null);
      setFormDay(null);
    }
    if (tripChanged || !editingActivityId) {
      setActivityDraft((draft) =>
        draft.title || draft.location || draft.notes || draft.time ? draft : emptyActivityDraft(defaultActivityDate)
      );
    }
    if (tripChanged || !editingJournalId) {
      setJournalDraft((draft) => (draft.title || draft.body ? draft : emptyJournalDraft(defaultActivityDate)));
    }
  }

  function resetActivityDraft() {
    setEditingActivityId(null);
    setActivityTitleMissing(false);
    setActivityDraft(emptyActivityDraft(formDay ?? defaultActivityDate));
  }

  function resetJournalDraft() {
    setEditingJournalId(null);
    setJournalEmpty(false);
    setJournalDraft(emptyJournalDraft(defaultActivityDate));
  }

  /** Moves the one stop form under a day with its draft and puts the cursor in its title. */
  function moveStopForm(date: string, draft: SetStateAction<ActivityDraft>, editingId: string | null) {
    // flushSync so the form has moved before focus goes to it.
    flushSync(() => {
      setFormDay(date);
      setEditingActivityId(editingId);
      setActivityTitleMissing(false);
      setActivityDraft(draft);
    });
    activityTitleInputRef.current?.focus();
  }

  // A new stop keeps what was typed and takes the day's date; leaving an edit starts blank.
  function openStopFormOn(date: string) {
    moveStopForm(date, editingActivityId ? emptyActivityDraft(date) : (draft) => ({ ...draft, date }), null);
  }

  function handleEditActivity(activity: TripActivity) {
    moveStopForm(
      activity.date,
      {
        date: activity.date,
        time: activity.time,
        endTime: activity.endTime,
        title: activity.title,
        location: activity.location,
        category: activity.category,
        notes: activity.notes,
        cost: activity.cost ?? null,
      },
      activity.id,
    );
  }

  function handleEditJournal(entry: JournalEntry) {
    setEditingJournalId(entry.id);
    setJournalEmpty(false);
    setJournalDraft({ date: entry.date, title: entry.title, body: entry.body, mood: entry.mood });
    journalTitleInputRef.current?.focus();
  }

  function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tripDraft.name.trim() || !draftStart) return;
    addTrip({
      name: tripDraft.name.trim(),
      destination: tripDraft.destination.trim(),
      startDate: draftStart,
      endDate: draftEnd || draftStart,
    });
    setTripDraft(EMPTY_TRIP_DRAFT);
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
      activityTitleInputRef.current?.focus();
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
      journalTitleInputRef.current?.focus();
      return;
    }
    if (editingJournalId) {
      updateJournal(activeTrip.id, editingJournalId, journalDraft);
    } else {
      addJournal(activeTrip.id, journalDraft);
    }
    resetJournalDraft();
  }

  const passData = activeTrip && summary ? boardingPass(activeTrip, summary, today || undefined) : null;
  const conflictIds = summary ? summary.dayBuckets.flatMap((bucket) => bucket.conflictIds) : [];
  const columns = summary ? itineraryColumns(summary.dayBuckets, conflictIds) : [];
  const dayKeys = summary ? summary.dayBuckets.map((bucket) => bucket.date) : [];
  const anchorDay =
    [formDay, defaultActivityDate].find((day): day is string => !!day && dayKeys.includes(day)) ??
    dayKeys[dayKeys.length - 1] ??
    null;

  const hasTrips = trips.length > 0;
  const tripFormFields = (
    <>
      <label className="tp-span-2">
        <span className="c97-kicker">Trip name</span>
        <input
          ref={tripNameInputRef}
          type="text"
          value={tripDraft.name}
          onChange={(e) => setTripDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Lisbon long weekend"
          className="c97-field"
          required
        />
      </label>
      <label className="tp-span-2">
        <span className="c97-kicker">Destination</span>
        <input
          type="text"
          value={tripDraft.destination}
          onChange={(e) => setTripDraft((d) => ({ ...d, destination: e.target.value }))}
          placeholder="Lisbon, Portugal"
          className="c97-field"
        />
      </label>
      <label>
        <span className="c97-kicker">Start date</span>
        <input
          type="date"
          value={draftStart}
          onChange={(e) => {
            const startDate = e.target.value;
            setTripDraft((d) => {
              const end = d.endDate ?? today;
              return { ...d, startDate, endDate: !end || end < startDate ? startDate : end };
            });
          }}
          className="c97-field"
          // Required only once today has filled the field, since an empty required date paints as an error.
          required={today !== ""}
        />
      </label>
      <label>
        <span className="c97-kicker">End date</span>
        <input
          type="date"
          value={draftEnd}
          min={draftStart || undefined}
          onChange={(e) => setTripDraft((d) => ({ ...d, endDate: e.target.value }))}
          className="c97-field"
          required={today !== ""}
        />
      </label>
      <div className="tp-span-2 tp-actions">
        <button type="submit" className="c97-btn">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Save trip
        </button>
        {hasTrips ? (
          <button type="button" onClick={() => setShowTripForm(false)} className="c97-btn-ghost">
            Cancel
          </button>
        ) : null}
      </div>
    </>
  );

  const plannedCosts = activeTrip
    ? activityBudget(activeTrip.activities)
    : null;

  const stopForm = (
    <div className="tp-stop-form">
      <p className="c97-kicker">{editingActivityId ? "Edit stop" : "Add stop"}</p>
      <form onSubmit={handleSubmitActivity} className="tp-form tp-form-stop">
        <label className="tp-span-2">
          <span className="c97-kicker">Title</span>
          <input
            ref={activityTitleInputRef}
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
          />
        </label>
        {activityTitleMissing ? (
          <p id="travel-stop-title-error" role="alert" className="tp-span-2 tp-error">
            Give the stop a title to add it.
          </p>
        ) : null}
        <label>
          <span className="c97-kicker">Date</span>
          <input
            type="date"
            value={activityDraft.date}
            min={activeTrip?.startDate}
            max={activeTrip?.endDate}
            onChange={(e) => setActivityDraft((d) => ({ ...d, date: e.target.value }))}
            className="c97-field"
          />
        </label>
        <label>
          <span className="c97-kicker">Category</span>
          <select
            value={activityDraft.category}
            onChange={(e) => setActivityDraft((d) => ({ ...d, category: e.target.value as ActivityDraft["category"] }))}
            className="c97-field"
          >
            {ACTIVITY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {ACTIVITY_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label>
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
          />
        </label>
        <label>
          <span className="c97-kicker">Ends</span>
          <input
            type="time"
            value={activityDraft.endTime}
            min={activityDraft.time || undefined}
            disabled={!activityDraft.time}
            aria-invalid={endTimeInvalid || undefined}
            onChange={(e) => setActivityDraft((d) => ({ ...d, endTime: e.target.value }))}
            className="c97-field"
          />
        </label>
        {endTimeInvalid ? (
          <p role="alert" className="tp-span-2 tp-error">
            The end time has to come after the start. Overnight stops need one entry per day.
          </p>
        ) : null}
        <label className="tp-span-2">
          <span className="c97-kicker">Planned cost (USD)</span>
          <input
            className="c97-field"
            type="number"
            min="0"
            max="10000000"
            step="0.01"
            value={activityDraft.cost ?? ""}
            onChange={(event) =>
              setActivityDraft((draft) => ({
                ...draft,
                cost:
                  event.target.value === "" ? null : Number(event.target.value),
              }))
            }
          />
          <span className="tp-muted">
            Leave blank for unknown, or enter 0 for a free stop.
          </span>
        </label>
        <label className="tp-span-2">
          <span className="c97-kicker">Location</span>
          <input
            type="text"
            value={activityDraft.location}
            onChange={(e) => setActivityDraft((d) => ({ ...d, location: e.target.value }))}
            placeholder="Alfama"
            className="c97-field"
          />
        </label>
        <label className="tp-span-2">
          <span className="c97-kicker">Notes</span>
          <textarea
            value={activityDraft.notes}
            onChange={(e) => setActivityDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="Reservation, what to bring, etc."
            className="c97-field"
            rows={2}
          />
        </label>
        <div className="tp-span-2 tp-actions">
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
      </form>
    </div>
  );

  return (
    <div data-testid="travel-planner-shell" className="tp-root" data-empty={activeTrip ? undefined : "true"}>
      <div className="c97-shell c97-frame tp-page">
        <header className="tp-head">
          <h1>Travel Planner</h1>
          <p className="tp-lede">
            One dated plan per trip, laid out by day, with the stops ticked off as they happen and a journal for
            what the day was actually like.
          </p>
          <p className="tp-note">Your trips are saved in this browser only, so they never leave this device.</p>
          {persistenceStatus === "memory-only" ? (
            <p className="tp-note" role="status">
              Your trips are available in this tab, but browser storage is unavailable, so changes may not last
              after you close it.
            </p>
          ) : null}
        </header>

        {hasTrips ? null : (
          <div className="tp-first">
            <form onSubmit={handleCreateTrip} className="tp-form tp-form-trip" aria-label="Create a new trip">
              <p className="c97-kicker tp-span-2">Your first trip</p>
              {tripFormFields}
              <p className="tp-span-2 tp-note">The day-by-day itinerary and the journal open once a trip is saved.</p>
            </form>
            <figure className="tp-sample">
              <figcaption className="c97-kicker">A sample day, to show what the plan turns into</figcaption>
              <p className="tp-day-heading">Day 1 · Sat, Oct 10</p>
              <ul className="tp-stops">
                {SAMPLE_DAY.map((stop) => {
                  const Icon = CATEGORY_ICON[stop.category];
                  return (
                    <li key={stop.title} className="tp-stop" data-done={stop.done || undefined}>
                      <span className="tp-stop-time">{stop.time}</span>
                      <span className="tp-toggle" style={{ ["--mark-color" as string]: CATEGORY_CHART[stop.category] }} aria-hidden="true">
                        {stop.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </span>
                      <span className="tp-stop-body">
                        <span className="tp-stop-title">{stop.title}</span>
                        <span className="tp-stop-meta">
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" style={{ color: CATEGORY_CHART[stop.category] }} />
                          <span>{ACTIVITY_CATEGORY_LABELS[stop.category]}</span>
                          <span>· {stop.place}</span>
                          {stop.done ? <span>· Done</span> : null}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </figure>
          </div>
        )}

        {activeTrip && passData ? (
          <section className="tp-trip" aria-label="Trip management">
            <div className="tp-trip-row">
              <div className="tp-trip-name">
                {trips.length > 1 ? (
                  <label className="tp-trip-select">
                    <span className="sr-only">Trip</span>
                    <select value={activeTripId ?? ""} onChange={(e) => selectTrip(e.target.value)} className="c97-field">
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : activeTrip.destination ? (
                  <p className="c97-kicker">{activeTrip.name}</p>
                ) : null}
                <p className="tp-destination">{passData.destination}</p>
                <p className="tp-dates">{passData.dateRange}</p>
              </div>
              <dl className="tp-figures">
                <div>
                  <dt>Countdown</dt>
                  <dd>{passData.countdown}</dd>
                </div>
                <div>
                  <dt>Stops</dt>
                  <dd>
                    {passData.stopsDone}/{passData.stopsTotal}
                  </dd>
                </div>
              </dl>
              <button
                ref={newTripButtonRef}
                type="button"
                onClick={() => (showTripForm ? setShowTripForm(false) : openTripForm())}
                className="c97-btn tp-new-trip"
                aria-expanded={showTripForm}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                New trip
              </button>
            </div>

            {/* The budget and the notes live in the disclosure below, which paper hides, so they print from here. */}
            {activeTrip.budget > 0 || activeTrip.notes ? (
              <div className="tp-print-details">
                {activeTrip.budget > 0 ? (
                  <p>
                    <span className="c97-kicker">Budget</span> {formatBudget(activeTrip.budget)}
                  </p>
                ) : null}
                {activeTrip.notes ? (
                  <>
                    <p className="c97-kicker">Trip notes</p>
                    <p className="tp-print-notes">{activeTrip.notes}</p>
                  </>
                ) : null}
              </div>
            ) : null}

            {showTripForm ? (
              <form onSubmit={handleCreateTrip} className="tp-form tp-form-trip tp-new-trip-form" aria-label="Create a new trip">
                {tripFormFields}
              </form>
            ) : null}

            {plannedCosts ? (
              <section className="tp-costs" aria-label="Trip spending plan">
                <h2>Planned spending</h2>
                <p>
                  {formatBudget(plannedCosts.total)} across{" "}
                  {plannedCosts.priced} priced {plannedCosts.priced === 1 ? "stop" : "stops"}. {plannedCosts.unpriced}{" "}
                  {plannedCosts.unpriced === 1 ? "stop still needs" : "stops still need"} a cost.
                </p>
                <p>
                  {activeTrip.budget > 0
                    ? `${formatBudget(Math.abs(activeTrip.budget - plannedCosts.total))} ${plannedCosts.total > activeTrip.budget ? "over" : "remaining in"} your ${formatBudget(activeTrip.budget)} budget.`
                    : "Set a trip budget in Trip details to compare your planned spending."}
                </p>
                <button
                  type="button"
                  className="c97-btn-ghost"
                  disabled={!activeTrip.activities.length}
                  onClick={() =>
                    downloadFile(
                      "trip-itinerary.ics",
                      tripCalendar(activeTrip),
                      "text/calendar;charset=utf-8",
                    )
                  }
                >
                  Download calendar
                </button>
                <p className="tp-muted">
                  The calendar uses times as entered, with no time zone. Choose
                  the destination time zone when importing. Untimed stops are
                  all-day events.
                </p>
              </section>
            ) : null}
            <details className="tp-manage">
              <summary>Trip details and all trips ({trips.length})</summary>
              <div className="tp-manage-body">
                <TripDetailsFields trip={activeTrip} onUpdateField={(fields) => updateTripFields(activeTrip.id, fields)} />
                <div className="tp-actions">
                  <button
                    type="button"
                    onClick={() =>
                      confirmingDelete === `active:${activeTrip.id}`
                        ? confirmDeleteTrip(activeTrip.id)
                        : setConfirmingDelete(`active:${activeTrip.id}`)
                    }
                    className="c97-btn-ghost"
                    data-armed={confirmingDelete === `active:${activeTrip.id}` || undefined}
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
                </div>

                <div>
                  <p className="c97-kicker">All trips ({trips.length})</p>
                  <ul className="tp-trip-list">
                    {trips.map((other) => (
                      <li key={other.id}>
                        <button
                          type="button"
                          onClick={() => selectTrip(other.id)}
                          aria-current={other.id === activeTrip.id ? "true" : undefined}
                          className="tp-trip-pick"
                        >
                          <span className="tp-trip-pick-name">
                            {other.name}
                            {other.id === activeTrip.id ? " (active)" : ""}
                          </span>
                          <span className="tp-stop-meta">
                            {other.destination || "No destination"} &middot; {formatTripDateRange(other.startDate, other.endDate)}
                          </span>
                        </button>
                        <div className="tp-actions">
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
                            className="c97-btn-ghost tp-icon-btn"
                            data-armed={confirmingDelete === `row:${other.id}` || undefined}
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
                </div>
              </div>
            </details>
          </section>
        ) : null}

        {/* The itinerary and the journal open once a trip exists. */}
        {activeTrip && summary ? (
          <>
            <section id="section-itinerary" className="tp-section" aria-label="Day-by-day itinerary">
              <h2>Itinerary</h2>
              {summary.itineraryTruncated ? (
                <p className="tp-note">
                  This trip spans {summary.daysTotal.toLocaleString("en-US")} days, so the itinerary shows the first{" "}
                  {MAX_ITINERARY_DAYS}. Double-check the trip dates if that looks off.
                </p>
              ) : null}
              <div className="tp-itinerary">
                <div className="tp-days">
                  {summary.activitiesTotal === 0 ? (
                    <p className="tp-note">No stops yet. Add the first one with the Add stop form.</p>
                  ) : null}
                  {summary.dayBuckets.map((bucket) => (
                    <DayList
                      key={bucket.date}
                      // Counted from the trip's start. A stop left outside the trip's dates keeps its day and takes no number.
                      dayNumber={
                        bucket.date >= activeTrip.startDate && bucket.date <= activeTrip.endDate
                          ? (daysBetween(activeTrip.startDate, bucket.date) ?? 0) + 1
                          : null
                      }
                      bucket={bucket}
                      today={today}
                      onToggle={(id) => toggleActivity(activeTrip.id, id)}
                      onEdit={handleEditActivity}
                      onRemove={(id) => {
                        removeActivity(activeTrip.id, id);
                        if (editingActivityId === id) resetActivityDraft();
                      }}
                      onAddStop={() => openStopFormOn(bucket.date)}
                      form={bucket.date === anchorDay ? stopForm : null}
                    />
                  ))}
                </div>
                <div className="tp-grid-col">
                  <ItineraryTimeline columns={columns} ticks={timelineTicks(summary.dayBuckets)} />
                </div>
              </div>
            </section>

            <section id="section-journal" className="tp-section" aria-label="Trip journal">
              <div className="tp-section-head">
                <h2>Journal</h2>
                <p className="tp-count">
                  {activeTrip.journal.length} {activeTrip.journal.length === 1 ? "entry" : "entries"}
                </p>
              </div>
              <div className="tp-journal">
                <div>
                  {activeTrip.journal.length === 0 ? (
                    <p className="tp-note">Journal is empty. Capture a moment with the Journal entry form.</p>
                  ) : (
                    <ul className="tp-postcards">
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
                              removeJournal(activeTrip.id, id);
                              if (editingJournalId === id) resetJournalDraft();
                            }}
                          />
                        ))}
                    </ul>
                  )}
                </div>

                <div className="tp-journal-form">
                  <p className="c97-kicker">{editingJournalId ? "Edit entry" : "Journal entry"}</p>
                  <form onSubmit={handleSubmitJournal} className="tp-form">
                    <label>
                      <span className="c97-kicker">Date</span>
                      <input
                        type="date"
                        value={journalDraft.date}
                        min={activeTrip.startDate}
                        max={activeTrip.endDate}
                        onChange={(e) => setJournalDraft((d) => ({ ...d, date: e.target.value }))}
                        className="c97-field"
                      />
                    </label>
                    <label>
                      <span className="c97-kicker">Mood</span>
                      <select
                        value={journalDraft.mood}
                        onChange={(e) => setJournalDraft((d) => ({ ...d, mood: e.target.value as JournalDraft["mood"] }))}
                        className="c97-field"
                      >
                        {JOURNAL_MOODS.map((mood) => (
                          <option key={mood} value={mood}>
                            {JOURNAL_MOOD_LABELS[mood]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="tp-span-2">
                      <span className="c97-kicker">Title</span>
                      <input
                        ref={journalTitleInputRef}
                        type="text"
                        value={journalDraft.title}
                        onChange={(e) => {
                          setJournalEmpty(false);
                          setJournalDraft((d) => ({ ...d, title: e.target.value }));
                        }}
                        aria-describedby={journalEmpty ? "travel-journal-error" : undefined}
                        placeholder="A long walk in Alfama"
                        className="c97-field"
                      />
                    </label>
                    <label className="tp-span-2">
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
                        rows={3}
                      />
                    </label>
                    {journalEmpty ? (
                      <p id="travel-journal-error" role="alert" className="tp-span-2 tp-error">
                        Add a title or a note to save the entry.
                      </p>
                    ) : null}
                    <div className="tp-span-2 tp-actions">
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
                  </form>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
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
    return <p className="tp-note">No days yet.</p>;
  }
  const categories = ACTIVITY_CATEGORIES.filter((category) =>
    columns.some((column) => column.stops.some((stop) => stop.category === category)),
  );
  const hasConflict = columns.some((column) => column.stops.some((stop) => stop.conflict));
  return (
    <div>
      {columns.length > 3 ? (
        <p className="c97-meta tp-grid-cue" data-many={columns.length > 8 || undefined}>
          Scroll to see every day
        </p>
      ) : null}
      <div className="tp-grid-frame">
        <div className="tp-grid-day-col tp-grid-axis" aria-hidden="true">
          <p className="tp-grid-day">&nbsp;</p>
          <div className="tp-grid-track">
            {ticks.map((tick) => (
              <span key={tick.label} style={{ top: `${tick.top * 100}%` }}>
                {tick.label}
              </span>
            ))}
          </div>
        </div>
        <div className="tp-grid" role="img" aria-label={describeTimeline(columns)}>
          {columns.map((column) => (
            <div key={column.dateKey} className="tp-grid-day-col">
              <p className="tp-grid-day">{column.label}</p>
              <div className="tp-grid-track">
                {ticks.map((tick) => (
                  <span key={tick.label} className="tp-grid-rule" style={{ top: `${tick.top * 100}%` }} />
                ))}
                {column.stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="tp-grid-mark"
                    data-conflict={stop.conflict || undefined}
                    data-done={stop.done || undefined}
                    style={{ top: `${stop.top * 100}%`, height: `${stop.height * 100}%`, ["--mark-color" as string]: CATEGORY_CHART[stop.category] }}
                    title={stop.title}
                  />
                ))}
              </div>
              {column.untimed.length > 0 ? <p className="tp-grid-untimed">{column.untimed.length} untimed</p> : null}
            </div>
          ))}
        </div>
      </div>
      {categories.length > 0 ? (
        <ul className="tp-grid-legend" aria-label="Timeline key">
          {categories.map((category) => (
            <li key={category}>
              <span className="tp-grid-swatch" style={{ ["--mark-color" as string]: CATEGORY_CHART[category] }} aria-hidden="true" />
              {ACTIVITY_CATEGORY_LABELS[category]}
            </li>
          ))}
          {hasConflict ? (
            <li>
              <span className="tp-grid-swatch" data-conflict="true" aria-hidden="true" />
              Overlaps another stop
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function DayList({
  dayNumber,
  bucket,
  today,
  onToggle,
  onEdit,
  onRemove,
  onAddStop,
  form,
}: {
  dayNumber: number | null;
  bucket: NonNullable<ReturnType<typeof useTravelPlanner>["summary"]>["dayBuckets"][number];
  today: string;
  onToggle: (id: string) => void;
  onEdit: (activity: TripActivity) => void;
  onRemove: (id: string) => void;
  onAddStop: () => void;
  form: ReactNode;
}) {
  const heading = formatDayHeading(bucket.date);
  const isToday = bucket.date === today;
  return (
    <div className="tp-day" data-today={isToday || undefined}>
      <div className="tp-day-head">
        {/* Always rendered, since the head is a three-column grid and the heading must stay in the second. */}
        <p className="tp-day-number" aria-hidden="true">
          {dayNumber === null ? null : `Day ${dayNumber}`}
        </p>
        <h3 className="tp-day-heading">
          {heading}
          {isToday ? " · Today" : ""}
        </h3>
        <span className="tp-count">
          {bucket.activities.length === 0 ? "0 stops" : `${bucket.completed}/${bucket.activities.length} done`}
        </span>
      </div>
      {bucket.activities.length === 0 ? (
        <p className="tp-note">Nothing planned yet.</p>
      ) : (
        <ul className="tp-stops">
          {bucket.activities.map((activity) => {
            const Icon = CATEGORY_ICON[activity.category];
            const hasConflict = bucket.conflictIds.includes(activity.id);
            return (
              <li key={activity.id} className="tp-stop" data-done={activity.completed || undefined}>
                <span className="tp-stop-time">
                  {activity.time ? formatActivityTimeRange(activity.time, activity.endTime) : "Any time"}
                </span>
                <button
                  type="button"
                  onClick={() => onToggle(activity.id)}
                  aria-label={activity.completed ? `Mark ${activity.title} as not done` : `Mark ${activity.title} as done`}
                  className="tp-toggle"
                  style={{ ["--mark-color" as string]: CATEGORY_CHART[activity.category] }}
                >
                  {activity.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <span className="tp-stop-body">
                  <span className="tp-stop-title-row">
                    <span className="tp-stop-title">{activity.title}</span>
                    {hasConflict ? (
                      <span className="c97-chip c97-chip-warning">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Overlap
                      </span>
                    ) : null}
                  </span>
                  <span className="tp-stop-meta">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" style={{ color: CATEGORY_CHART[activity.category] }} />
                    <span>{ACTIVITY_CATEGORY_LABELS[activity.category]}</span>
                    {activity.location ? <span>· {activity.location}</span> : null}
                    <span>· {activity.cost == null ? "Cost unknown" : formatBudget(activity.cost)}</span>
                  </span>
                  {activity.notes ? <span className="tp-stop-notes">{activity.notes}</span> : null}
                </span>
                <span className="tp-stop-actions">
                  <button type="button" onClick={() => onEdit(activity)} className="c97-btn-ghost">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(activity.id)}
                    aria-label={`Delete ${activity.title}`}
                    className="c97-btn-ghost tp-icon-btn"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {form ?? (
        <button type="button" onClick={onAddStop} className="c97-btn-ghost tp-add-stop" aria-label={`Add a stop on ${heading}`}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add a stop
        </button>
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
    <li className="tp-postcard">
      <div className="tp-postcard-body">
        <p className="tp-postcard-title">{entry.title}</p>
        {entry.body ? <p className="tp-postcard-text">{entry.body}</p> : null}
        <div className="tp-actions">
          <button type="button" onClick={() => onEdit(entry)} className="c97-btn-ghost">
            Edit
          </button>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            aria-label={`Delete journal entry ${entry.title}`}
            className="c97-btn-ghost tp-icon-btn"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="tp-postcard-stamp">
        <p>{formatDayHeading(entry.date)}</p>
        <span className={`c97-chip ${tone}`}>
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
    <div className="tp-form tp-details">
      <label>
        <span className="c97-kicker">Trip name</span>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraftField("name", e.target.value)}
          onBlur={() => onUpdateField({ name: draft.name })}
          className="c97-field"
        />
      </label>
      <label>
        <span className="c97-kicker">Destination</span>
        <input
          type="text"
          value={draft.destination}
          onChange={(e) => setDraftField("destination", e.target.value)}
          onBlur={() => onUpdateField({ destination: draft.destination })}
          className="c97-field"
        />
      </label>
      <label>
        <span className="c97-kicker">Start date</span>
        <input
          type="date"
          value={draft.startDate}
          onChange={(e) => handleDateChange("startDate", e.target.value)}
          onBlur={() => handleDateBlur("startDate")}
          className="c97-field"
        />
      </label>
      <label>
        <span className="c97-kicker">End date</span>
        <input
          type="date"
          value={draft.endDate}
          min={draft.startDate}
          onChange={(e) => handleDateChange("endDate", e.target.value)}
          onBlur={() => handleDateBlur("endDate")}
          className="c97-field"
        />
      </label>
      <label>
        <span className="c97-kicker">Budget (USD)</span>
        <input
          type="number"
          min="0"
          // Any amount is a budget, cents included, so no step marks one as invalid.
          step="any"
          value={draft.budget}
          onChange={(e) => setDraftField("budget", e.target.value)}
          onBlur={() => onUpdateField({ budget: Number(draft.budget) || 0 })}
          className="c97-field"
        />
        <span className="sr-only">{formatBudget(Number(draft.budget) || 0)}</span>
      </label>
      <label className="tp-span-2">
        <span className="c97-kicker">Trip notes</span>
        <textarea
          value={draft.notes}
          onChange={(e) => setDraftField("notes", e.target.value)}
          onBlur={() => onUpdateField({ notes: draft.notes })}
          placeholder="Hotels, packing list, must-see places"
          className="c97-field"
          rows={3}
        />
      </label>
    </div>
  );
}
