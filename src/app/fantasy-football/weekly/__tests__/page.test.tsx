import { render } from "@testing-library/react";
import ReactDOM from "react-dom";
import WeeklyBoardPage from "../page";

const clientProps: unknown[] = [];
jest.mock("../weekly-client", () => ({
  WeeklyBoardClient: (props: unknown) => {
    clientProps.push(props);
    return <div data-testid="weekly-client" />;
  },
}));

describe("WeeklyBoardPage", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    clientProps.length = 0;
  });

  it("does not preload the weekly board before Week 1, when nothing has been published", async () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2026, 7, 30)));
    const preload = jest.spyOn(ReactDOM, "preload").mockImplementation(() => {});

    render(await WeeklyBoardPage({ searchParams: Promise.resolve({}) }));

    expect(preload).not.toHaveBeenCalled();
  });

  it("preloads the weekly board once the season is under way", async () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2026, 9, 1)));
    const preload = jest.spyOn(ReactDOM, "preload").mockImplementation(() => {});

    render(await WeeklyBoardPage({ searchParams: Promise.resolve({}) }));

    // Exactly the URL useFantasyWeeklySnapshot requests. Any difference makes
    // the browser discard the preload and download the file a second time.
    expect(preload).toHaveBeenCalledWith("/data/fantasy/weekly.json", {
      as: "fetch",
      crossOrigin: "anonymous",
    });
  });

  // Next.js hands a repeated query parameter to a page as an array, and
  // ?scoring=ppr&scoring=standard took the page down with a TypeError.
  it("reads the first value when scoring is repeated in the URL", async () => {
    jest.spyOn(ReactDOM, "preload").mockImplementation(() => {});

    render(
      await WeeklyBoardPage({
        searchParams: Promise.resolve({
          scoring: ["standard", "ppr"],
        } as unknown as { scoring?: string }),
      })
    );

    expect(clientProps[0]).toMatchObject({ initialState: { scoring: "standard" } });
  });

  // The board's rows are in the HTML only if the page hands the client real
  // data; a crawler that runs no JavaScript never sees the client's own fetch.
  it("seeds the client with the published board for the requested scoring", async () => {
    jest.spyOn(ReactDOM, "preload").mockImplementation(() => {});

    render(await WeeklyBoardPage({ searchParams: Promise.resolve({ scoring: "half_ppr" }) }));

    const { initialSnapshot } = clientProps[0] as {
      initialSnapshot: { boards: Record<string, unknown> } | null;
    };
    expect(Object.keys(initialSnapshot?.boards ?? {})).toEqual(["half_ppr"]);
  });
});
