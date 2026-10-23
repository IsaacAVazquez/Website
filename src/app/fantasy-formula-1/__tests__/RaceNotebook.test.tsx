import { fireEvent, render, screen } from "@testing-library/react";
import { RaceNotebook } from "../RaceNotebook";
import { f1ResultsKey, parseF1Results } from "@/lib/fantasyFormula1Records";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import type {
  FantasyFormula1Asset,
  FantasyFormula1LineupSummary,
} from "@/types/fantasyFormula1";

beforeEach(() => {
  localStorage.clear();
  resetBrowserStorageMemory();
});
it("freezes a complete lineup and keeps a zero actual result distinct from unknown", () => {
  const assets = Array.from({ length: 7 }, (_, index) => ({
    id: `${index < 5 ? "driver" : "constructor"}-${index}`,
    name: `Pick ${index}`,
    price: 10,
    projectedPoints: 20,
  })) as FantasyFormula1Asset[];
  const lineup = {
    assets,
    isComplete: true,
    isOverBudget: false,
  } as FantasyFormula1LineupSummary;
  render(
    <RaceNotebook
      season={2026}
      race="Austin"
      date="2026-10-25"
      sourceAt="2026-10-23T12:00:00Z"
      assets={assets}
      lineup={lineup}
      prices={{}}
      onPrice={jest.fn()}
      memoryOnly={false}
    />,
  );
  fireEvent.click(screen.getByText("Game prices and race notebook"));
  fireEvent.click(
    screen.getByRole("button", { name: "Record current lineup" }),
  );
  expect(
    parseF1Results(localStorage.getItem(f1ResultsKey(2026))!)[0].actual,
  ).toBeNull();
  fireEvent.change(screen.getByLabelText("Actual points for Austin"), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save race result" }));
  expect(
    parseF1Results(localStorage.getItem(f1ResultsKey(2026))!)[0].actual,
  ).toBe(0);
  expect(screen.getByText(/Actual minus model -140.0 points/)).toBeVisible();
});
