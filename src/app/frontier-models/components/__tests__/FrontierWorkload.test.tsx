import { fireEvent, render, screen, within } from "@testing-library/react";
import { FrontierWorkload } from "../FrontierWorkload";
import { MODELS } from "./fixtures/models";
import {
  DEFAULT_FRONTIER_WORKLOAD,
  FRONTIER_COMPARISONS_KEY,
  parseFrontierComparisons,
} from "@/lib/frontierWorkload";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

const props = {
  models: MODELS,
  snapshotGeneratedAt: "2026-10-23T07:30:00.000Z",
  factsAsOf: "2026-10-23",
  reviewIsOverdue: false,
};
const saved = {
  id: "old",
  name: "Earlier workload",
  input: DEFAULT_FRONTIER_WORKLOAD,
  modelIds: ["retired-model"],
  savedAt: "2026-10-22T12:00:00.000Z",
  snapshotGeneratedAt: "2026-10-21T07:30:00.000Z",
};

beforeEach(() => {
  localStorage.clear();
  resetBrowserStorageMemory();
});
afterEach(() => {
  jest.restoreAllMocks();
});

it("compares one workload, saves its model choices, and restores it after remount", () => {
  const { unmount } = render(<FrontierWorkload {...props} />);
  fireEvent.change(screen.getByLabelText("Add a model"), {
    target: { value: "alpha" },
  });
  fireEvent.change(screen.getByLabelText("Add a model"), {
    target: { value: "bravo" },
  });
  const comparison = within(
    screen.getByRole("region", { name: "Workload comparison" }),
  );
  expect(comparison.getByRole("row", { name: /Alpha/ })).toHaveTextContent(
    "$75.00",
  );
  expect(comparison.getByRole("row", { name: /Bravo/ })).toHaveTextContent(
    "Price unavailable",
  );
  fireEvent.change(screen.getByLabelText("Monthly requests"), {
    target: { value: "20000" },
  });
  fireEvent.change(screen.getByLabelText("Comparison name"), {
    target: { value: "Support replies" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));
  const [record] = parseFrontierComparisons(
    localStorage.getItem(FRONTIER_COMPARISONS_KEY)!,
  );
  expect(record.input.monthlyRequests).toBe(20000);
  expect(record.modelIds).toEqual(["alpha", "bravo"]);
  expect(record.snapshotGeneratedAt).toBe(props.snapshotGeneratedAt);
  unmount();
  render(<FrontierWorkload {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Load Support replies" }));
  expect(screen.getByLabelText("Monthly requests")).toHaveValue(20000);
  expect(
    screen.getByRole("region", { name: "Workload comparison" }),
  ).toHaveTextContent("$150.00");
  fireEvent.click(
    screen.getByRole("button", { name: "Remove saved Support replies" }),
  );
  expect(
    parseFrontierComparisons(localStorage.getItem(FRONTIER_COMPARISONS_KEY)!),
  ).toEqual([]);
});

it("explains unmet requirements and prevents saving incomplete numeric inputs", () => {
  render(<FrontierWorkload {...props} />);
  fireEvent.change(screen.getByLabelText("Add a model"), {
    target: { value: "alpha" },
  });
  fireEvent.click(screen.getByLabelText("Audio"));
  expect(
    screen.getByRole("region", { name: "Workload comparison" }),
  ).toHaveTextContent("Audio support is not listed.");
  fireEvent.change(screen.getByLabelText("Input tokens per request"), {
    target: { value: "" },
  });
  expect(screen.getByText(/Enter whole numbers/)).toBeVisible();
  expect(screen.getByLabelText("Input tokens per request")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(screen.getByLabelText("Monthly requests")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  expect(
    screen.getByRole("button", { name: "Save comparison" }),
  ).toBeDisabled();
  expect(
    screen.queryByRole("region", { name: "Workload comparison" }),
  ).not.toBeInTheDocument();
});

it("limits model choices to four and makes room when a model is removed", () => {
  const models = Array.from({ length: 5 }, (_, index) => ({
    ...MODELS[0],
    id: `model-${index}`,
    name: `Model ${index}`,
  }));
  render(<FrontierWorkload {...props} models={models} />);
  for (let index = 0; index < 4; index++) {
    fireEvent.change(screen.getByLabelText("Add a model"), {
      target: { value: `model-${index}` },
    });
  }
  expect(screen.getByLabelText("Add a model")).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Remove model Model 0" }));
  expect(screen.getByLabelText("Add a model")).toBeEnabled();
  fireEvent.change(screen.getByLabelText("Add a model"), {
    target: { value: "model-4" },
  });
  expect(
    screen.getByRole("region", { name: "Workload comparison" }),
  ).toHaveTextContent("Model 4");
});

it("reads the latest saved collection before applying the twenty-record limit", () => {
  render(<FrontierWorkload {...props} />);
  localStorage.setItem(
    FRONTIER_COMPARISONS_KEY,
    JSON.stringify(
      Array.from({ length: 20 }, (_, index) => ({
        ...saved,
        id: `saved-${index}`,
      })),
    ),
  );
  fireEvent.change(screen.getByLabelText("Add a model"), {
    target: { value: "alpha" },
  });
  fireEvent.change(screen.getByLabelText("Comparison name"), {
    target: { value: "One too many" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));
  expect(
    parseFrontierComparisons(localStorage.getItem(FRONTIER_COMPARISONS_KEY)!),
  ).toHaveLength(20);
  expect(
    screen.getByText(/Remove a saved comparison before adding another/),
  ).toBeVisible();
});

it("retains retired models and explains recalculation with the displayed dataset", () => {
  localStorage.setItem(FRONTIER_COMPARISONS_KEY, JSON.stringify([saved]));
  render(<FrontierWorkload {...props} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Load Earlier workload" }),
  );
  expect(
    screen.getByRole("region", { name: "Workload comparison" }),
  ).toHaveTextContent("retired-model");
  expect(
    screen.getByText(/This model is no longer in the dataset on this page/),
  ).toBeVisible();
  expect(
    screen.getByText(/Recalculated with the prices on this page/),
  ).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Remove model retired-model" }),
  );
  expect(screen.getByText(/Add a model to compare/)).toBeVisible();
});

it("preserves a comparison saved in another tab and reports storage write failures", () => {
  render(<FrontierWorkload {...props} />);
  localStorage.setItem(FRONTIER_COMPARISONS_KEY, JSON.stringify([saved]));
  fireEvent.change(screen.getByLabelText("Add a model"), {
    target: { value: "alpha" },
  });
  fireEvent.change(screen.getByLabelText("Comparison name"), {
    target: { value: "New comparison" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));
  expect(
    parseFrontierComparisons(
      localStorage.getItem(FRONTIER_COMPARISONS_KEY)!,
    ).map((item) => item.name),
  ).toEqual(["Earlier workload", "New comparison"]);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  fireEvent.change(screen.getByLabelText("Comparison name"), {
    target: { value: "Memory comparison" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save comparison" }));
  expect(screen.getByText(/Browser storage is unavailable/)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Load Memory comparison" }),
  ).toBeVisible();
});
