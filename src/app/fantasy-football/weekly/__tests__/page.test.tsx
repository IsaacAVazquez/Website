import { render } from "@testing-library/react";
import ReactDOM from "react-dom";
import WeeklyBoardPage from "../page";

jest.mock("../weekly-client", () => ({
  WeeklyBoardClient: () => <div data-testid="weekly-client" />,
}));

describe("WeeklyBoardPage", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
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
      { as: "fetch" }
    );
  });
});
