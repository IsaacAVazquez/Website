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
      "/investments",
      { scroll: false }
    );
    expect(container.querySelector('[data-testid="research-props"]')?.textContent).toBe(":overview");
  });

  it("does not navigate when a bare /investments URL is already canonical", async () => {
    // A replace here is an endless refetch loop: every navigation on the
    // dynamic route re-renders with fresh searchParams and would fire again.
    currentSearchParams = new URLSearchParams("");

    await act(async () => {
      root.render(<InvestmentsClient initialState={DEFAULT_INVESTMENTS_STATE} />);
    });
    await flushPromises();

    expect(mockReplace).not.toHaveBeenCalled();
  });
});
