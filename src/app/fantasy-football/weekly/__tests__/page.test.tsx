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

    expect(preload).toHaveBeenCalledWith(
      expect.stringContaining("/data/fantasy/weekly.json?v="),
      { as: "fetch", crossOrigin: "anonymous" }
    );
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
