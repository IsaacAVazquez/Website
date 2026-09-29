import { fireEvent, render, screen } from "@testing-library/react";
import type { FrontierModel } from "@/types/frontierModels";
import { frontierModelsSnapshot } from "@/data/frontierModelsSnapshot";
import { FrontierModelsClient } from "../frontier-models-client";
import { DEFAULT_FRONTIER_MODELS_STATE } from "../frontier-models-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("../components/FrontierModelsTable", () => ({
  FrontierModelsTable: ({
    models,
    onSelectModel,
  }: {
    models: FrontierModel[];
    onSelectModel: (id: string | null) => void;
  }) => (
    <div data-testid="frontier-table">
      {models.map((model) => (
        <button key={model.id} type="button" onClick={() => onSelectModel(model.id)}>
          {model.name}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("../components/FrontierCostContextChart", () => ({
  FrontierCostContextChart: ({
    models,
    onSelectModel,
  }: {
    models: FrontierModel[];
    onSelectModel: (id: string | null) => void;
  }) => (
    <div data-testid="frontier-chart">
      {models.map((model) => (
        <button key={model.id} type="button" onClick={() => onSelectModel(model.id)}>
          Chart {model.name}
        </button>
      ))}
    </div>
  ),
}));

describe("FrontierModelsClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("renders the model tracker with the chart in the hero and navigates filter changes", () => {
    render(
      <FrontierModelsClient
        initialState={DEFAULT_FRONTIER_MODELS_STATE}
        snapshot={frontierModelsSnapshot}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /frontier model tracker/i })
    ).toBeVisible();
    expect(screen.getByTestId("frontier-chart")).toBeVisible();
    expect(screen.getByTestId("frontier-table")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /OpenAI/ }));
    expect(mockPush).toHaveBeenLastCalledWith("/frontier-models?provider=openai", {
      scroll: false,
    });
  });

  it("states how many models the fact check changed, matched, and could not find", () => {
    render(
      <FrontierModelsClient
        initialState={DEFAULT_FRONTIER_MODELS_STATE}
        snapshot={{
          ...frontierModelsSnapshot,
          liveFacts: {
            checkedAt: "2026-09-27T07:30:00.000Z",
            sources: ["models.dev", "openrouter"],
            updated: 6,
            confirmed: 1,
            curatedOnly: 2,
          },
        }}
      />
    );

    expect(screen.getByText(/facts auto-checked 2026-09-27/)).toHaveTextContent(
      "facts auto-checked 2026-09-27 against models.dev + openrouter · 6 changed by the check, 1 matched, 2 not found in either catalog"
    );
  });

  it("selects a model through the rendered table", () => {
    render(
      <FrontierModelsClient
        initialState={DEFAULT_FRONTIER_MODELS_STATE}
        snapshot={frontierModelsSnapshot}
      />
    );

    // Read from the snapshot, so refreshing the curated list cannot break this.
    const [model] = frontierModelsSnapshot.models;
    fireEvent.click(screen.getByRole("button", { name: model.name }));

    expect(mockPush).toHaveBeenLastCalledWith(
      `/frontier-models?model=${model.id}`,
      { scroll: false }
    );
  });
});
