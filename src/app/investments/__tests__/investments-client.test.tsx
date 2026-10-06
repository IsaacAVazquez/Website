import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { InvestmentsClient } from "../investments-client";
import { DEFAULT_INVESTMENTS_STATE } from "../investments-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseInvestments = jest.fn();
const mockDashboardProps = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("@/hooks/useInvestments", () => ({
  useInvestments: () => mockUseInvestments(),
}));

jest.mock("@/components/investments/InvestmentsDashboard", () => ({
  InvestmentsDashboard: (props: {
    researchSymbol: string;
    researchTab: string;
    onResearchSymbolChange: (symbol: string) => void;
    onResearchTabChange: (tab: "overview" | "chart") => void;
  }) => {
    mockDashboardProps(props);
    return (
      <div>
        <div>Investments Dashboard</div>
        <div data-testid="research-props">{`${props.researchSymbol}:${props.researchTab}`}</div>
        <button type="button" onClick={() => props.onResearchSymbolChange("V")}>
          Research Visa
        </button>
        <button type="button" onClick={() => props.onResearchTabChange("chart")}>
          Chart section
        </button>
      </div>
    );
  },
}));

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("InvestmentsClient", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.history.replaceState(null, "", "/investments");
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockDashboardProps.mockReset();
    mockUseInvestments.mockReturnValue({
      holdings: [{ symbol: "MSFT" }],
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("hydrates from URL params and preserves research context across dashboard callbacks", async () => {
    currentSearchParams = new URLSearchParams("view=research&symbol=MSFT&section=chart");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe("MSFT:chart");

    await act(async () => {
      const button = Array.from(container.querySelectorAll("button")).find((tab) =>
        tab.textContent?.includes("Chart section")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/investments?symbol=MSFT&section=chart",
      { scroll: false }
    );

    currentSearchParams = new URLSearchParams("view=research&symbol=MSFT&section=chart");
    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(container.textContent).toContain("Investments Dashboard");

    await act(async () => {
      const portfolioButton = Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Research Visa")
      ) as HTMLButtonElement | undefined;
      portfolioButton?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/investments?symbol=V&section=chart",
      { scroll: false }
    );

    currentSearchParams = new URLSearchParams("view=research&symbol=V&section=chart");
    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe("V:chart");

    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe("V:chart");
  });

  it("canonicalizes invalid query params back to the default investments workspace", async () => {
    currentSearchParams = new URLSearchParams("view=invalid&symbol=visa inc&section=invalid");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).toHaveBeenCalledWith(
      "/investments?section=overview",
      { scroll: false }
    );
    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe(":overview");
  });

  // The canonical href is built from the query alone. A link that names a
  // section has to keep naming it after the rewrite.
  it("carries the fragment through when it canonicalizes a legacy link", async () => {
    window.history.replaceState(
      null,
      "",
      "/investments?view=research&symbol=V&section=chart#research-section"
    );
    currentSearchParams = new URLSearchParams("view=research&symbol=V&section=chart");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(
      "/investments?symbol=V&section=chart#research-section",
      { scroll: false }
    );
  });

  // A tab or a symbol the visitor picks is a new place on the page, so the
  // fragment they arrived with no longer describes it.
  it("drops the fragment when the visitor picks another section", async () => {
    window.history.replaceState(null, "", "/investments?symbol=V&section=overview#retirement");
    currentSearchParams = new URLSearchParams("symbol=V&section=overview");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    await act(async () => {
      const button = Array.from(container.querySelectorAll("button")).find((tab) =>
        tab.textContent?.includes("Chart section")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/investments?symbol=V&section=chart",
      { scroll: false }
    );
  });

  it("reads the task from the URL and keeps the default task off it", async () => {
    currentSearchParams = new URLSearchParams("task=retirement&section=overview");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockDashboardProps.mock.lastCall?.[0].task).toBe("retirement");

    await act(async () => {
      mockDashboardProps.mock.lastCall?.[0].onTaskChange("research");
    });
    expect(mockPush).toHaveBeenLastCalledWith("/investments?task=research&section=overview", { scroll: false });

    await act(async () => {
      mockDashboardProps.mock.lastCall?.[0].onTaskChange("portfolio");
    });
    expect(mockPush).toHaveBeenLastCalledWith("/investments?section=overview", { scroll: false });
  });

  it("drops a task the page does not have", async () => {
    currentSearchParams = new URLSearchParams("task=taxes&section=overview");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).toHaveBeenCalledWith("/investments?section=overview", { scroll: false });
    expect(mockDashboardProps.mock.lastCall?.[0].task).toBe("portfolio");
  });

  it("keeps a clean /investments visit clean without rewriting the URL", async () => {
    currentSearchParams = new URLSearchParams();

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe(":overview");
  });

  it("settles without replacing once the URL already matches the canonical href", async () => {
    currentSearchParams = new URLSearchParams("section=overview");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
