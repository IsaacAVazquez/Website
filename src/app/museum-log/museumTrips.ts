import type { Museum, MuseumExhibit } from "@/types/museum";
import type { Trip } from "@/types/travel";
import { createActivity } from "@/lib/travelPlanner";

export function isMuseumTripDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}

export function museumExhibitsDuring(
  museum: Museum,
  start: string,
  end: string,
): MuseumExhibit[] {
  if (!isMuseumTripDate(start) || !isMuseumTripDate(end) || end < start)
    return [];
  return museum.exhibits.filter(
    (exhibit) =>
      exhibit.startDate <= end &&
      (!exhibit.endDate || exhibit.endDate >= start),
  );
}

export function addMuseumToTrip(
  trip: Trip,
  museum: Museum,
  date: string,
): Trip {
  if (
    !isMuseumTripDate(date) ||
    date < trip.startDate ||
    date > trip.endDate ||
    trip.activities.some(
      (activity) =>
        activity.date === date &&
        activity.title === museum.name &&
        activity.location === museum.city,
    )
  )
    return trip;
  return {
    ...trip,
    activities: [
      ...trip.activities,
      createActivity({
        title: museum.name,
        date,
        time: "",
        endTime: "",
        location: museum.city,
        category: "sight",
        cost: null,
        notes: [
          museum.websiteUrl,
          museum.admissionUSD === null
            ? "Listed general admission is free. Verify before visiting."
            : `Catalog general admission is USD ${museum.admissionUSD}. Check the current ticket price before budgeting.`,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    ],
  };
}
