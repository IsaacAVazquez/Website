import { fireEvent, render, screen } from "@testing-library/react";
import { RentScenarios } from "../RentScenarios";
import { createDefaultInput } from "@/lib/rentVsBuy/defaults";
import {
  RENT_SCENARIOS_KEY,
  parseRentScenarios,
} from "@/lib/rentVsBuy/scenarios";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

beforeEach(() => {
  localStorage.clear();
  resetBrowserStorageMemory();
});
it("saves the inputs, compares a selected scenario, and loads it unchanged", () => {
  const onLoad = jest.fn();
  render(<RentScenarios input={createDefaultInput()} onLoad={onLoad} />);
  fireEvent.click(screen.getByText("Save and compare scenarios"));
  fireEvent.change(screen.getByLabelText("Scenario name"), {
    target: { value: "Oakland" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save current scenario" }),
  );
  expect(
    parseRentScenarios(localStorage.getItem(RENT_SCENARIOS_KEY)!)[0].input,
  ).toEqual(createDefaultInput());
  fireEvent.click(screen.getByLabelText("Compare Oakland"));
  expect(
    screen.getByRole("region", { name: "Scenario comparison" }),
  ).toHaveTextContent("Oakland");
  fireEvent.click(screen.getByRole("button", { name: "Load Oakland" }));
  expect(onLoad).toHaveBeenCalledWith(createDefaultInput());
  fireEvent.click(screen.getByRole("button", { name: "Remove Oakland" }));
  expect(parseRentScenarios(localStorage.getItem(RENT_SCENARIOS_KEY)!)).toEqual(
    [],
  );
});
it("keeps scenarios saved by another tab when adding a scenario", () => {
  render(<RentScenarios input={createDefaultInput()} onLoad={jest.fn()} />);
  fireEvent.click(screen.getByText("Save and compare scenarios"));
  localStorage.setItem(
    RENT_SCENARIOS_KEY,
    JSON.stringify([
      { id: "other", name: "Other tab", input: createDefaultInput() },
    ]),
  );
  fireEvent.change(screen.getByLabelText("Scenario name"), {
    target: { value: "New" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save current scenario" }),
  );
  expect(
    parseRentScenarios(localStorage.getItem(RENT_SCENARIOS_KEY)!).map(
      (row) => row.name,
    ),
  ).toEqual(["Other tab", "New"]);
});
