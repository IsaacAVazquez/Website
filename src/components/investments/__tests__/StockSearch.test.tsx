import { act, fireEvent, render, screen } from "@testing-library/react";
import { StockSearch } from "../StockSearch";

jest.mock("@/lib/investmentsClientData", () => ({
  getClientInvestmentsIndex: () =>
    Promise.resolve({
      entries: [
        {
          symbol: "XOM",
          shortName: "Exxon Mobil Corporation",
          longName: "Exxon Mobil Corporation",
          searchText: "xom exxon mobil corporation",
        },
      ],
    }),
}));

/** Types a query and waits out the index load and the 200ms input debounce. */
async function suggest(query: string) {
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Search stock symbol" }), { target: { value: query } });
  act(() => {
    jest.advanceTimersByTime(250);
  });
  return screen.getByRole("listbox", { name: "Symbol suggestions" });
}

describe("StockSearch suggestion list", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("portals into the root a route marks for it, ahead of the page root", async () => {
    render(
      <div className="c97-page">
        <div data-stock-search-portal="" data-testid="route-root">
          <StockSearch value="NVDA" onChange={() => {}} />
        </div>
      </div>
    );

    expect(screen.getByTestId("route-root")).toContainElement(await suggest("xo"));
  });

  it("portals into the page root where no route marks one", async () => {
    render(
      <div className="c97-page" data-testid="page-root">
        <div data-testid="tool">
          <StockSearch value="NVDA" onChange={() => {}} />
        </div>
      </div>
    );

    const list = await suggest("xo");
    expect(screen.getByTestId("page-root")).toContainElement(list);
    expect(screen.getByTestId("tool")).not.toContainElement(list);
  });
});
