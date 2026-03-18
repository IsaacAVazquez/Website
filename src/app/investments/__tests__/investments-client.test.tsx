import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { InvestmentsClient } from "../investments-client";
import { DEFAULT_INVESTMENTS_STATE } from "../investments-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseInvestments = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => true,
}));

jest.mock("@/hooks/useInvestments", () => ({
  useInvestments: () => mockUseInvestments(),
}));

jest.mock("@/components/investments/PortfolioTracker", () => ({
  PortfolioTracker: ({ onResearch }: { onResearch: (symbol: string) => void }) => (
    <div>
      <div>Portfolio Tracker</div>
      <button type="button" onClick={() => onResearch("V")}>
        Research Visa
      </button>
    </div>
  ),
}));

jest.mock("@/components/investments/StockResearch", () => ({
  StockResearch: ({
    symbol,
    activeTab,
  }: {
    symbol: string;
    activeTab: string;
  }) => <div data-testid="research-props">{`${symbol}:${activeTab}`}</div>,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseInvestments.mockReturnValue({
      holdings: [{ symbol: "MSFT" }],
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("hydrates from URL params and preserves research context across top-level views", async () => {
    currentSearchParams = new URLSearchParams("view=research&symbol=MSFT&section=chart");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe("MSFT:chart");

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find((tab) =>
        tab.textContent?.includes("My Portfolio")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/investments?view=portfolio&symbol=MSFT&section=chart",
      { scroll: false }
    );

    currentSearchParams = new URLSearchParams("view=portfolio&symbol=MSFT&section=chart");
    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(container.textContent).toContain("Portfolio Tracker");

    await act(async () => {
      const portfolioButton = Array.from(container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Research Visa")
      ) as HTMLButtonElement | undefined;
      portfolioButton?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/investments?view=research&symbol=V&section=chart",
      { scroll: false }
    );

    currentSearchParams = new URLSearchParams("view=research&symbol=V&section=chart");
    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe("V:chart");

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find((tab) =>
        tab.textContent?.includes("Research")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/investments?view=research&symbol=V&section=chart",
      { scroll: false }
    );

    currentSearchParams = new URLSearchParams("view=research&symbol=V&section=chart");
    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe("V:chart");
  });

  it("canonicalizes invalid query params back to the default investments workspace", async () => {
    currentSearchParams = new URLSearchParams("view=invalid&symbol=visa inc&section=invalid");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).toHaveBeenCalledWith(
      "/investments?view=research&symbol=AAPL&section=overview",
      { scroll: false }
    );
    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe("AAPL:overview");
  });
});
