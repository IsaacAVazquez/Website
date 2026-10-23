import { fireEvent, render, screen } from "@testing-library/react";
import { FoodPersonal } from "../RestaurantRecord";
import { EMPTY_FOOD_RECORD } from "../foodPersonal";
import { FOOD_MAP_PLACES } from "../food-map-data";
import { createTrip, saveTrips, loadTrips } from "@/lib/travelPlanner";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

beforeEach(() => {
  localStorage.clear();
  resetBrowserStorageMemory();
});
it("adds a restaurant to the latest trip without losing an independently added stop", () => {
  const trip = createTrip({
    name: "Austin",
    destination: "Austin",
    startDate: "2026-11-01",
    endDate: "2026-11-03",
  });
  saveTrips([trip]);
  render(
    <FoodPersonal
      place={FOOD_MAP_PLACES[0]}
      record={EMPTY_FOOD_RECORD}
      onChange={jest.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Restaurant trip"), {
    target: { value: trip.id },
  });
  const updated = { ...trip, notes: "Changed elsewhere" };
  localStorage.setItem("travel_planner_trips_v1", JSON.stringify([updated]));
  fireEvent.click(
    screen.getByRole("button", { name: "Add restaurant to trip" }),
  );
  expect(loadTrips()[0].notes).toBe("Changed elsewhere");
  expect(loadTrips()[0].activities[0]).toMatchObject({
    title: "Franklin Barbecue",
    date: "2026-11-01",
    cost: null,
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Add restaurant to trip" }),
  );
  expect(loadTrips()[0].activities).toHaveLength(1);
});
