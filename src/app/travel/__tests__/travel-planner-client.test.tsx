import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { toLocalDateKey } from "@/lib/date-formatters";
import { TRAVEL_PLANNER_STORAGE_KEY, formatDayHeading } from "@/lib/travelPlanner";
import type { Trip } from "@/types/travel";
import { TravelPlannerClient } from "../travel-planner-client";

function dayKey(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toLocalDateKey(date);
}

const TODAY = dayKey(0);

function makeTrip(overrides: Partial<Trip> & Pick<Trip, "id" | "name">): Trip {
  return {
    destination: "",
    startDate: TODAY,
    endDate: dayKey(2),
    notes: "",
    budget: 0,
    activities: [],
    journal: [],
    ...overrides,
  };
}

const LISBON = makeTrip({
  id: "trip-lisbon",
  name: "Lisbon weekend",
  destination: "Lisbon, Portugal",
  activities: [
    { id: "act-museum", date: TODAY, time: "09:00", endTime: "11:00", title: "Museum", location: "Belem", category: "sight", notes: "Buy tickets ahead", completed: false },
    { id: "act-lunch", date: TODAY, time: "10:30", endTime: "", title: "Lunch", location: "", category: "food", notes: "", completed: false },
    { id: "act-walk", date: dayKey(1), time: "", endTime: "", title: "Walk", location: "Alfama", category: "activity", notes: "", completed: true },
  ],
  journal: [
    { id: "jrn-a", date: TODAY, title: "Arrival", body: "Long flight.", mood: "tired" },
    { id: "jrn-b", date: dayKey(1), title: "Tram 28", body: "", mood: "amazing" },
  ],
});

const PORTO = makeTrip({
  id: "trip-porto",
  name: "Porto",
  destination: "",
  startDate: dayKey(10),
  endDate: dayKey(12),
});

function seed(trips: unknown) {
  window.localStorage.setItem(TRAVEL_PLANNER_STORAGE_KEY, typeof trips === "string" ? trips : JSON.stringify(trips));
}

function stored(): Trip[] {
  return JSON.parse(window.localStorage.getItem(TRAVEL_PLANNER_STORAGE_KEY) ?? "[]") as Trip[];
}

const region = (name: string) => screen.getByRole("region", { name });
const itinerary = () => region("Day-by-day itinerary");
const journal = () => region("Trip journal");
const manage = () => region("Trip management");

function stopForm() {
  return within(itinerary()).getByRole("button", { name: /^(Add|Save) stop$/ }).closest("form") as HTMLFormElement;
}

function journalForm() {
  return within(journal()).getByRole("button", { name: /^(Add|Save) entry$/ }).closest("form") as HTMLFormElement;
}

function change(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

describe("TravelPlannerClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts empty, with the forms disabled until a trip exists", () => {
    render(<TravelPlannerClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Travel Planner" })).toBeInTheDocument();
    expect(screen.getByText("No trip yet")).toBeInTheDocument();
    expect(screen.getByText("Nothing planned")).toBeInTheDocument();
    expect(screen.getByText("Start a trip above to plan its first day.")).toBeInTheDocument();
    expect(screen.getByText("Start a trip above to keep a journal for it.")).toBeInTheDocument();
    expect(within(manage()).getByText("No trips saved yet.")).toBeInTheDocument();
    expect(within(manage()).getByText("All trips (0)")).toBeInTheDocument();
    expect(within(stopForm()).getByRole("textbox", { name: "Title" })).toBeDisabled();
    expect(within(journalForm()).getByRole("textbox", { name: "Title" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Delete trip" })).toBeNull();
  });

  it.each([
    ["unreadable JSON", "{not json"],
    ["a non-array payload", JSON.stringify({ trips: [] })],
  ])("treats %s in storage as no trips", (_label, raw) => {
    seed(raw);
    render(<TravelPlannerClient />);
    expect(within(manage()).getByText("No trips saved yet.")).toBeInTheDocument();
  });

  it("creates a trip from the start button and saves it to this browser", () => {
    const frames: FrameRequestCallback[] = [];
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    render(<TravelPlannerClient />);

    fireEvent.click(screen.getByRole("button", { name: "Start a trip" }));
    const form = screen.getByRole("form", { name: "Create a new trip" });
    act(() => frames.forEach((frame) => frame(0)));
    expect(within(form).getByRole("textbox", { name: "Trip name" })).toHaveFocus();
    expect(within(manage()).getByRole("button", { name: "New trip" })).toHaveAttribute("aria-expanded", "true");

    change(within(form).getByRole("textbox", { name: "Trip name" }), "  Kyoto  ");
    change(within(form).getByRole("textbox", { name: "Destination" }), "Kyoto, Japan");
    change(within(form).getByLabelText("End date"), dayKey(1));
    // Moving the start past the end pulls the end along with it.
    change(within(form).getByLabelText("Start date"), dayKey(3));
    expect(within(form).getByLabelText("End date")).toHaveValue(dayKey(3));
    fireEvent.click(within(form).getByRole("button", { name: "Save trip" }));

    expect(screen.queryByRole("form", { name: "Create a new trip" })).toBeNull();
    expect(stored()).toEqual([
      expect.objectContaining({ name: "Kyoto", destination: "Kyoto, Japan", startDate: dayKey(3), endDate: dayKey(3) }),
    ]);
    expect(within(manage()).getByText("All trips (1)")).toBeInTheDocument();
    expect(within(manage()).getByText("Kyoto (active)")).toBeInTheDocument();
    expect(screen.getByText("Kyoto, Japan", { selector: ".c97-boarding-pass-destination" })).toBeInTheDocument();
    expect(screen.getByText("3 days to go")).toBeInTheDocument();
    expect(within(itinerary()).getByText("No stops yet. Add the first one with the Add stop form.")).toBeInTheDocument();
    expect(within(journal()).getByText(/Journal is empty/)).toBeInTheDocument();
    expect(within(journal()).getByText("0 entries")).toBeInTheDocument();
  });

  it("toggles and cancels the new trip form without saving", () => {
    render(<TravelPlannerClient />);
    const newTrip = within(manage()).getByRole("button", { name: "New trip" });

    fireEvent.click(newTrip);
    const form = screen.getByRole("form", { name: "Create a new trip" });
    // A blank name never saves.
    fireEvent.submit(form);
    expect(stored()).toEqual([]);

    fireEvent.click(within(form).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("form", { name: "Create a new trip" })).toBeNull();

    fireEvent.click(newTrip);
    fireEvent.click(newTrip);
    expect(screen.queryByRole("form", { name: "Create a new trip" })).toBeNull();
  });

  it("lays out a stored trip by day with overlaps, progress, and a timeline", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);

    expect(screen.getByText("Lisbon, Portugal", { selector: ".c97-boarding-pass-destination" })).toBeInTheDocument();
    expect(screen.getByText("Stops").nextElementSibling).toHaveTextContent("1/3");
    expect(screen.getByText("Day 1 of 3")).toBeInTheDocument();
    expect(within(itinerary()).getByText("1/3 stops checked off")).toBeInTheDocument();

    expect(within(itinerary()).getByRole("heading", { name: `${formatDayHeading(TODAY)} · Today` })).toBeInTheDocument();
    expect(within(itinerary()).getByText("0/2 done")).toBeInTheDocument();
    expect(within(itinerary()).getByText("1/1 done")).toBeInTheDocument();
    expect(within(itinerary()).getByText("0 stops")).toBeInTheDocument();
    expect(within(itinerary()).getByText("Nothing planned yet.")).toBeInTheDocument();
    expect(within(itinerary()).getAllByText("Overlap")).toHaveLength(2);
    expect(within(itinerary()).getByText("Buy tickets ahead")).toBeInTheDocument();
    expect(within(itinerary()).getByText("9:00 AM – 11:00 AM")).toBeInTheDocument();
    expect(within(itinerary()).getByRole("button", { name: "Mark Walk as not done" })).toBeInTheDocument();

    expect(
      screen.getByRole("img", { name: "Itinerary across 3 days, 3 stops placed by time and category, 2 overlapping." })
    ).toBeInTheDocument();
    const key = screen.getByRole("list", { name: "Timeline key" });
    expect(within(key).getByText("Food")).toBeInTheDocument();
    expect(within(key).getByText("Overlaps another stop")).toBeInTheDocument();
    expect(screen.getByText("1 untimed")).toBeInTheDocument();
    expect(screen.queryByText("Scroll to see every day")).toBeNull();
  });

  it("refuses a stop without a title or with an end before its start", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);
    const form = stopForm();
    const title = within(form).getByRole("textbox", { name: "Title" });

    fireEvent.click(within(form).getByRole("button", { name: "Add stop" }));
    expect(within(form).getByRole("alert")).toHaveTextContent("Give the stop a title to add it.");
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAttribute("aria-describedby", "travel-stop-title-error");

    change(title, "Fado show");
    expect(within(form).queryByRole("alert")).toBeNull();

    const ends = within(form).getByLabelText("Ends");
    expect(ends).toBeDisabled();
    change(within(form).getByLabelText("Starts"), "21:00");
    change(ends, "20:00");
    expect(within(form).getByRole("alert")).toHaveTextContent("The end time has to come after the start.");
    fireEvent.click(within(form).getByRole("button", { name: "Add stop" }));
    expect(stored()[0].activities).toHaveLength(3);

    // Moving the start past the end clears the end instead of keeping a bad range.
    change(within(form).getByLabelText("Starts"), "20:30");
    expect(ends).toHaveValue("");
    expect(within(form).queryByRole("alert")).toBeNull();
  });

  it("adds a stop and clears the form", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);
    const form = stopForm();

    change(within(form).getByRole("textbox", { name: "Title" }), "Fado show");
    change(within(form).getByLabelText("Date"), dayKey(2));
    change(within(form).getByLabelText("Starts"), "21:00");
    change(within(form).getByLabelText("Ends"), "23:00");
    change(within(form).getByRole("combobox", { name: "Category" }), "food");
    change(within(form).getByRole("textbox", { name: "Location" }), "Bairro Alto");
    change(within(form).getByRole("textbox", { name: "Notes" }), "Book a table");
    fireEvent.click(within(form).getByRole("button", { name: "Add stop" }));

    const added = stored()[0].activities.find((activity) => activity.title === "Fado show");
    expect(added).toEqual(
      expect.objectContaining({ date: dayKey(2), time: "21:00", endTime: "23:00", category: "food", location: "Bairro Alto", notes: "Book a table" })
    );
    expect(within(itinerary()).getByText("1/4 stops checked off")).toBeInTheDocument();
    expect(within(form).getByRole("textbox", { name: "Title" })).toHaveValue("");
  });

  it("edits a stop in place and cancels an edit", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);

    const museumRow = within(itinerary()).getByText("Museum").closest("li") as HTMLElement;
    fireEvent.click(within(museumRow).getByRole("button", { name: "Edit" }));
    expect(within(itinerary()).getByText("Edit stop")).toBeInTheDocument();
    const form = stopForm();
    expect(within(form).getByRole("textbox", { name: "Title" })).toHaveValue("Museum");
    expect(within(form).getByLabelText("Starts")).toHaveValue("09:00");

    change(within(form).getByRole("textbox", { name: "Title" }), "Gulbenkian Museum");
    fireEvent.click(within(form).getByRole("button", { name: "Save stop" }));
    expect(stored()[0].activities.find((activity) => activity.id === "act-museum")?.title).toBe("Gulbenkian Museum");
    expect(within(itinerary()).getByText("Gulbenkian Museum")).toBeInTheDocument();
    expect(within(itinerary()).getByText("Add stop", { selector: "p" })).toBeInTheDocument();

    const lunchRow = within(itinerary()).getByText("Lunch").closest("li") as HTMLElement;
    fireEvent.click(within(lunchRow).getByRole("button", { name: "Edit" }));
    fireEvent.click(within(stopForm()).getByRole("button", { name: "Cancel" }));
    expect(within(stopForm()).getByRole("textbox", { name: "Title" })).toHaveValue("");
  });

  it("checks a stop off and deletes one, resetting the form when it was being edited", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);

    fireEvent.click(within(itinerary()).getByRole("button", { name: "Mark Museum as done" }));
    expect(within(itinerary()).getByRole("button", { name: "Mark Museum as not done" })).toBeInTheDocument();
    expect(stored()[0].activities.find((activity) => activity.id === "act-museum")?.completed).toBe(true);
    expect(within(itinerary()).getByText("2/3 stops checked off")).toBeInTheDocument();

    const lunchRow = within(itinerary()).getByText("Lunch").closest("li") as HTMLElement;
    fireEvent.click(within(lunchRow).getByRole("button", { name: "Edit" }));
    fireEvent.click(within(itinerary()).getByRole("button", { name: "Delete Lunch" }));
    expect(within(itinerary()).queryByText("Lunch")).toBeNull();
    expect(within(itinerary()).queryByText("Overlap")).toBeNull();
    expect(within(stopForm()).getByRole("button", { name: "Add stop" })).toBeInTheDocument();
    expect(stored()[0].activities.map((activity) => activity.id)).toEqual(["act-museum", "act-walk"]);
  });

  it("lists journal entries newest first and adds, edits, and deletes them", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);

    expect(within(journal()).getByText("2 entries")).toBeInTheDocument();
    const cards = within(journal()).getAllByRole("listitem");
    expect(cards.map((card) => card.querySelector(".c97-serif")?.textContent)).toEqual(["Tram 28", "Arrival"]);
    expect(within(cards[0]).getByText("Amazing")).toHaveClass("c97-chip-positive");
    expect(within(cards[1]).getByText("Long flight.")).toBeInTheDocument();

    const form = journalForm();
    fireEvent.click(within(form).getByRole("button", { name: "Add entry" }));
    expect(within(form).getByRole("alert")).toHaveTextContent("Add a title or a note to save the entry.");
    change(within(form).getByRole("textbox", { name: "Notes" }), "Pasteis de nata.");
    expect(within(form).queryByRole("alert")).toBeNull();
    change(within(form).getByRole("combobox", { name: "Mood" }), "good");
    fireEvent.click(within(form).getByRole("button", { name: "Add entry" }));
    expect(stored()[0].journal).toHaveLength(3);
    expect(within(journal()).getByText("3 entries")).toBeInTheDocument();
    expect(within(journal()).getByText("Pasteis de nata.")).toBeInTheDocument();

    const arrival = within(journal()).getByText("Arrival").closest("li") as HTMLElement;
    fireEvent.click(within(arrival).getByRole("button", { name: "Edit" }));
    expect(within(journal()).getByText("Edit entry")).toBeInTheDocument();
    change(within(journalForm()).getByRole("textbox", { name: "Title" }), "Arrival day");
    fireEvent.click(within(journalForm()).getByRole("button", { name: "Save entry" }));
    expect(stored()[0].journal.find((entry) => entry.id === "jrn-a")?.title).toBe("Arrival day");

    const tram = within(journal()).getByText("Tram 28").closest("li") as HTMLElement;
    fireEvent.click(within(tram).getByRole("button", { name: "Edit" }));
    fireEvent.click(within(journal()).getByRole("button", { name: "Delete journal entry Tram 28" }));
    expect(within(journal()).queryByText("Tram 28")).toBeNull();
    expect(within(journalForm()).getByRole("button", { name: "Add entry" })).toBeInTheDocument();

    fireEvent.click(within(journal()).getByRole("button", { name: "Delete journal entry Arrival day" }));
    fireEvent.click(within(journal()).getByRole("button", { name: /Delete journal entry Untitled entry/ }));
    expect(within(journal()).getByText(/Journal is empty/)).toBeInTheDocument();
  });

  it("cancels a journal edit back to a blank entry", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);
    const arrival = within(journal()).getByText("Arrival").closest("li") as HTMLElement;
    fireEvent.click(within(arrival).getByRole("button", { name: "Edit" }));
    fireEvent.click(within(journalForm()).getByRole("button", { name: "Cancel" }));
    expect(within(journalForm()).getByRole("textbox", { name: "Title" })).toHaveValue("");
  });

  it("switches the active trip from the list and the boarding pass", () => {
    seed([LISBON, PORTO]);
    render(<TravelPlannerClient />);

    expect(within(manage()).getByText("Lisbon weekend (active)")).toBeInTheDocument();
    expect(within(manage()).getByText(/No destination ·/)).toBeInTheDocument();

    fireEvent.click(within(manage()).getByRole("button", { name: /^Porto/ }));
    expect(within(manage()).getByRole("button", { name: /^Porto \(active\)/ })).toHaveAttribute("aria-current", "true");
    // With no destination the pass prints the trip name.
    expect(screen.getByText("Porto", { selector: ".c97-boarding-pass-destination" })).toBeInTheDocument();
    expect(screen.getByText("10 days to go")).toBeInTheDocument();

    change(screen.getByRole("combobox", { name: "Trip" }), "trip-lisbon");
    expect(within(manage()).getByText("Lisbon weekend (active)")).toBeInTheDocument();
  });

  it("asks before deleting the active trip and can back out", () => {
    seed([LISBON, PORTO]);
    render(<TravelPlannerClient />);

    fireEvent.click(within(manage()).getByRole("button", { name: "Delete trip" }));
    const keep = within(manage()).getByRole("button", { name: "Keep it" });
    fireEvent.click(keep);
    expect(within(manage()).getByRole("button", { name: "Delete trip" })).toHaveFocus();
    expect(stored()).toHaveLength(2);

    fireEvent.click(within(manage()).getByRole("button", { name: "Delete trip" }));
    fireEvent.click(within(manage()).getByRole("button", { name: "Confirm delete" }));
    expect(stored().map((trip) => trip.id)).toEqual(["trip-porto"]);
    expect(within(manage()).getByRole("button", { name: "New trip" })).toHaveFocus();
    expect(within(manage()).getByText("Porto (active)")).toBeInTheDocument();
  });

  it("deletes a trip from its row after a confirm", () => {
    seed([LISBON, PORTO]);
    render(<TravelPlannerClient />);

    fireEvent.click(within(manage()).getByRole("button", { name: "Delete trip Porto" }));
    const confirm = within(manage()).getByRole("button", { name: "Confirm delete trip Porto" });
    fireEvent.click(within(confirm.parentElement as HTMLElement).getByRole("button", { name: "Keep it" }));
    expect(within(manage()).getByRole("button", { name: "Delete trip Porto" })).toHaveFocus();

    fireEvent.click(within(manage()).getByRole("button", { name: "Delete trip Porto" }));
    fireEvent.click(within(manage()).getByRole("button", { name: "Confirm delete trip Porto" }));
    expect(stored().map((trip) => trip.id)).toEqual(["trip-lisbon"]);
    expect(within(manage()).getByText("All trips (1)")).toBeInTheDocument();
  });

  it("commits trip details on blur and keeps stored dates valid", () => {
    seed([LISBON]);
    render(<TravelPlannerClient />);
    const details = within(manage()).getByRole("spinbutton", { name: /Budget/ }).closest(".c97-panel") as HTMLElement;

    const name = within(details).getByRole("textbox", { name: "Trip name" });
    change(name, "Lisbon long weekend");
    expect(stored()[0].name).toBe("Lisbon weekend");
    fireEvent.blur(name);
    expect(stored()[0].name).toBe("Lisbon long weekend");
    expect(within(manage()).getByText("Lisbon long weekend (active)")).toBeInTheDocument();

    const destination = within(details).getByRole("textbox", { name: "Destination" });
    change(destination, "Lisboa");
    fireEvent.blur(destination);
    expect(stored()[0].destination).toBe("Lisboa");

    const budget = within(details).getByRole("spinbutton", { name: /Budget/ });
    change(budget, "1250.5");
    fireEvent.blur(budget);
    expect(stored()[0].budget).toBe(1250.5);
    change(budget, "");
    expect(within(details).getByText("$0")).toBeInTheDocument();
    change(budget, "1250");
    expect(within(details).getByText("$1,250")).toBeInTheDocument();

    const notes = within(details).getByRole("textbox", { name: "Trip notes" });
    change(notes, "Pack layers");
    fireEvent.blur(notes);
    expect(stored()[0].notes).toBe("Pack layers");

    // A valid start after the end saves at once and pulls the end along.
    const start = within(details).getByLabelText("Start date");
    const end = within(details).getByLabelText("End date");
    change(start, dayKey(5));
    expect(end).toHaveValue(dayKey(5));
    expect(stored()[0]).toEqual(expect.objectContaining({ startDate: dayKey(5), endDate: dayKey(5) }));

    // A cleared date never reaches storage and snaps back on blur.
    change(end, "");
    expect(stored()[0].endDate).toBe(dayKey(5));
    fireEvent.blur(end);
    expect(end).toHaveValue(dayKey(5));
    fireEvent.blur(start);
    expect(start).toHaveValue(dayKey(5));
  });

  it("picks up a trip saved in another tab", () => {
    render(<TravelPlannerClient />);
    expect(within(manage()).getByText("No trips saved yet.")).toBeInTheDocument();

    const payload = JSON.stringify([PORTO]);
    window.localStorage.setItem(TRAVEL_PLANNER_STORAGE_KEY, payload);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: TRAVEL_PLANNER_STORAGE_KEY, newValue: payload }));
    });
    expect(within(manage()).getByText("Porto (active)")).toBeInTheDocument();
  });

  it("warns when browser storage refuses the write but keeps the trip in this tab", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    render(<TravelPlannerClient />);

    fireEvent.click(within(manage()).getByRole("button", { name: "New trip" }));
    const form = screen.getByRole("form", { name: "Create a new trip" });
    change(within(form).getByRole("textbox", { name: "Trip name" }), "Offline trip");
    fireEvent.click(within(form).getByRole("button", { name: "Save trip" }));

    expect(screen.getByRole("status")).toHaveTextContent(/browser storage is unavailable/);
    expect(within(manage()).getByText("Offline trip (active)")).toBeInTheDocument();
  });

  it("caps a very long trip's itinerary and offers a scroll cue", () => {
    seed([makeTrip({ id: "trip-long", name: "Sabbatical", startDate: dayKey(0), endDate: dayKey(399) })]);
    render(<TravelPlannerClient />);

    expect(within(itinerary()).getByText(/This trip spans 400 days, so the itinerary shows the first 366/)).toBeInTheDocument();
    expect(screen.getByText("Scroll to see every day")).toHaveAttribute("data-many", "true");
  });
});
