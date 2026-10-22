import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { SavedBets } from "../SavedBetWorkspace";
import { SAVED_BETS_KEY } from "../decisionSaved";
import { normalizeDecisionLabState } from "../decision-lab-state";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

function Workspace() {
  const [state, setState] = useState(normalizeDecisionLabState(new URLSearchParams()));
  return <SavedBets state={state} onLoad={setState} />;
}
beforeEach(() => { localStorage.clear(); resetBrowserStorageMemory(); });
it("saves, loads, merges a concurrent rename, and removes a named bet", () => {
  render(<Workspace />);
  fireEvent.change(screen.getByLabelText("Bet name"), { target: { value: "Activation" } });
  fireEvent.click(screen.getByRole("button", { name: "Save as new bet" }));
  fireEvent.click(screen.getByRole("button", { name: "Load Activation" }));
  const saved = JSON.parse(localStorage.getItem(SAVED_BETS_KEY)!);
  const concurrent = JSON.stringify([{ ...saved[0], name: "Renamed elsewhere", impact: 90 }]);
  act(() => { localStorage.setItem(SAVED_BETS_KEY, concurrent); window.dispatchEvent(new StorageEvent("storage", { key: SAVED_BETS_KEY, newValue: concurrent })); });
  fireEvent.click(screen.getByRole("button", { name: "Update Renamed elsewhere" }));
  expect(screen.getByLabelText("Bet name")).toHaveValue("Renamed elsewhere");
  fireEvent.click(screen.getByRole("button", { name: "Update Renamed elsewhere" }));
  expect(JSON.parse(localStorage.getItem(SAVED_BETS_KEY)!)[0].impact).toBe(90);
  fireEvent.click(screen.getByRole("button", { name: "Remove Renamed elsewhere" }));
  expect(screen.getByText(/No saved bets yet/)).toBeVisible();
});
it("shows a storage failure notice while keeping the current tab usable", () => {
  const fail = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota"); });
  render(<Workspace />);
  fireEvent.change(screen.getByLabelText("Bet name"), { target: { value: "Temporary" } });
  fireEvent.click(screen.getByRole("button", { name: "Save as new bet" }));
  expect(screen.getByText(/These edits only last in this tab/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Load Temporary" })).toBeVisible();
  fail.mockRestore();
});
