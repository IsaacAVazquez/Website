import { fireEvent, render, screen } from "@testing-library/react";
import { FlightQuoteComparison } from "../FlightQuoteComparison";
import { FLIGHT_QUOTES_KEY, parseFlightQuotes } from "@/lib/flightQuotes";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

beforeEach(() => {
  localStorage.clear();
  resetBrowserStorageMemory();
});
it("retains a points option and includes its cash fees and baggage in the comparison", () => {
  render(<FlightQuoteComparison />);
  fireEvent.click(screen.getByText("Save and compare flight quotes"));
  for (const [label, value] of [
    ["Quote name or airline", "Award"],
    ["Origin airport or city", "SFO"],
    ["Destination airport or city", "JFK"],
    ["Outbound date", "2026-11-01"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.change(screen.getByLabelText("Payment method"), {
    target: { value: "points" },
  });
  fireEvent.change(screen.getByLabelText("Points for party"), {
    target: { value: "50000" },
  });
  fireEvent.change(
    screen.getByLabelText("Taxes and booking fees for party, USD"),
    { target: { value: "80" } },
  );
  fireEvent.change(screen.getByLabelText("Baggage for party, USD"), {
    target: { value: "60" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save flight quote" }));
  expect(
    parseFlightQuotes(localStorage.getItem(FLIGHT_QUOTES_KEY)!)[0],
  ).toMatchObject({ label: "Award", payment: "points", points: 50000 });
  expect(
    screen.getByRole("region", { name: "Flight quote comparison" }),
  ).toHaveTextContent("$140.00");
  expect(
    screen.getByRole("region", { name: "Flight quote comparison" }),
  ).toHaveTextContent("$840.00");
});
