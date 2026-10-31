import { fireEvent, render, screen } from "@testing-library/react";
import { MuseumTripPlanner } from "../MuseumTripPlanner";
import { TRAVEL_PLANNER_STORAGE_KEY, loadTrips } from "@/lib/travelPlanner";
import { museumSnapshot } from "@/data/museumSnapshot";

it("finds selected exhibitions in a saved trip and persists a museum stop once", () => {
  localStorage.clear();
  localStorage.setItem(TRAVEL_PLANNER_STORAGE_KEY, JSON.stringify([{ id: "nyc", name: "NYC weekend", destination: "New York", startDate: "2026-10-30", endDate: "2026-11-01", budget: 0, notes: "", activities: [], journal: [] }]));
  render(<MuseumTripPlanner museums={museumSnapshot.museums} onOpenMuseum={jest.fn()} />);
  fireEvent.click(screen.getByText("Find exhibitions during a trip"));
  fireEvent.change(screen.getByLabelText("Saved trip"), { target: { value: "nyc" } });
  fireEvent.change(screen.getByLabelText("City or museum"), { target: { value: "Whitney" } });
  expect(screen.getByText(/Roy Lichtenstein: Like New/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add to trip" }));
  expect(loadTrips()[0].activities[0]).toMatchObject({ title: "Whitney Museum of American Art", date: "2026-10-30" });
  fireEvent.click(screen.getByRole("button", { name: "Add to trip" }));
  expect(loadTrips()[0].activities).toHaveLength(1);
});
