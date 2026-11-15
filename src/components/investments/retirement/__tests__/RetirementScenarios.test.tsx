import { fireEvent, render, screen } from "@testing-library/react";
import { RetirementScenarios } from "../RetirementScenarios";
import { createDefaultPlan } from "@/lib/retirement";
import {
  resetBrowserStorageMemory,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";
import { RETIREMENT_SCENARIOS_KEY } from "@/lib/retirement/scenarios";

beforeEach(() => {
  localStorage.clear();
  resetBrowserStorageMemory();
});
afterEach(() => jest.restoreAllMocks());
it("saves, compares, restores, and removes named plans", () => {
  const plan = createDefaultPlan();
  plan.assumptions.simulations = 100;
  const onLoad = jest.fn();
  const view = render(<RetirementScenarios plan={plan} onLoad={onLoad} />);
  fireEvent.change(screen.getByLabelText("Plan name"), {
    target: { value: "Starting plan" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save current retirement plan" }),
  );
  view.rerender(
    <RetirementScenarios
      plan={{ ...plan, desiredAnnualSpend: 20000 }}
      onLoad={onLoad}
    />,
  );
  fireEvent.change(screen.getByLabelText("Plan name"), {
    target: { value: "Spend less" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save current retirement plan" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Compare selected retirement plans" }),
  );
  expect(screen.getByRole("table")).toHaveTextContent("Annual spending");
  expect(screen.getByRole("table")).toHaveTextContent("$20,000");
  view.unmount();
  render(<RetirementScenarios plan={plan} onLoad={onLoad} />);
  fireEvent.click(screen.getByRole("button", { name: "Load Spend less" }));
  expect(onLoad).toHaveBeenCalledWith(
    expect.objectContaining({ desiredAnnualSpend: 20000 }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove Starting plan" }));
  expect(
    screen.queryByRole("button", { name: "Load Starting plan" }),
  ).not.toBeInTheDocument();
});

it("preserves a newer record added by another tab when saving", () => {
  const plan = createDefaultPlan();
  render(<RetirementScenarios plan={plan} onLoad={jest.fn()} />);
  localStorage.setItem(
    RETIREMENT_SCENARIOS_KEY,
    JSON.stringify([
      { id: "other", name: "Other tab", savedAt: "2026-10-26T10:00:00Z", plan },
    ]),
  );
  fireEvent.change(screen.getByLabelText("Plan name"), {
    target: { value: "This tab" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save current retirement plan" }),
  );
  expect(screen.getByRole("button", { name: "Load Other tab" })).toBeVisible();
});

it("keeps failed writes in memory and reports their persistence limit", () => {
  writeBrowserStorageJson(RETIREMENT_SCENARIOS_KEY, []);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  render(<RetirementScenarios plan={createDefaultPlan()} onLoad={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Plan name"), {
    target: { value: "Temporary plan" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save current retirement plan" }),
  );
  expect(screen.getByText(/Browser storage is unavailable/)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Load Temporary plan" }),
  ).toBeVisible();
});
