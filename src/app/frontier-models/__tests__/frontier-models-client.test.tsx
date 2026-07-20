import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("renders the model tracker and navigates filter/view changes", () => {
    render(
      <FrontierModelsClient
        initialState={DEFAULT_FRONTIER_MODELS_STATE}
        snapshot={frontierModelsSnapshot}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /frontier model tracker/i })
    ).toBeVisible();
    expect(screen.getByTestId("frontier-table")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /OpenAI/ }));
    expect(mockPush).toHaveBeenLastCalledWith("/frontier-models?provider=openai", {
      scroll: false,
    });

    fireEvent.click(
      within(screen.getByRole("tablist", { name: "Frontier model view" })).getByRole(
        "tab",
        { name: "Chart" }
      )
    );
    expect(mockPush).toHaveBeenLastCalledWith("/frontier-models?view=chart", {
      scroll: false,
    });
  });

  it("selects a model through the rendered table", () => {
    render(
      <FrontierModelsClient
        initialState={DEFAULT_FRONTIER_MODELS_STATE}
        snapshot={frontierModelsSnapshot}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "GPT-5.6" }));

    expect(mockPush).toHaveBeenLastCalledWith(
      "/frontier-models?model=openai-gpt-5-6",
      { scroll: false }
    );
  });
});
