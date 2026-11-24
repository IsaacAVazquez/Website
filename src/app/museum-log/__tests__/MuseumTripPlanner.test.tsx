import { fireEvent, render, screen } from "@testing-library/react";
import { MuseumTripPlanner } from "../MuseumTripPlanner";
import { TRAVEL_PLANNER_STORAGE_KEY, loadTrips } from "@/lib/travelPlanner";
import type { Museum } from "@/types/museum";

// An inline museum, so a review of the curated catalog cannot break this test.
const museum = { id: "m-test", slug: "test-museum", name: "Test Museum of Art", city: "New York", admissionUSD: 30, websiteUrl: "https://example.org", exhibits: [{ id: "show", title: "Selected show", startDate: "2026-10-11", endDate: "2027-05-10" }] } as Museum;

it("finds selected exhibitions in a saved trip and persists a museum stop once", () => {
  localStorage.clear();
  localStorage.setItem(TRAVEL_PLANNER_STORAGE_KEY, JSON.stringify([{ id: "nyc", name: "NYC weekend", destination: "New York", startDate: "2026-10-30", endDate: "2026-11-01", budget: 0, notes: "", activities: [], journal: [] }]));
  render(<MuseumTripPlanner museums={[museum]} onOpenMuseum={jest.fn()} />);
  fireEvent.click(screen.getByText("Find exhibitions during a trip"));
  fireEvent.change(screen.getByLabelText("Saved trip"), { target: { value: "nyc" } });
  fireEvent.change(screen.getByLabelText("City or museum"), { target: { value: "Test Museum" } });
  expect(screen.getByText(/Selected show/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add to trip" }));
  expect(loadTrips()[0].activities[0]).toMatchObject({ title: "Test Museum of Art", date: "2026-10-30" });
  fireEvent.click(screen.getByRole("button", { name: "Add to trip" }));
  expect(loadTrips()[0].activities).toHaveLength(1);
});
