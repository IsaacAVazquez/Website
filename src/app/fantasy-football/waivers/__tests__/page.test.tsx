import { render } from "@testing-library/react";
import ReactDOM from "react-dom";
import WaiverTargetsPage from "../page";

const clientProps: unknown[] = [];
jest.mock("../../weekly/weekly-client", () => ({
  WeeklyBoardClient: (props: unknown) => {
    clientProps.push(props);
    return <div data-testid="weekly-client" />;
  },
}));

describe("WaiverTargetsPage", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    clientProps.length = 0;
  });

  it("renders the shared client in the waivers view with scoring from the URL", async () => {
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2026, 9, 1)));
    const preload = jest
      .spyOn(ReactDOM, "preload")
      .mockImplementation(() => {});

    render(
      await WaiverTargetsPage({
        searchParams: Promise.resolve({ scoring: "standard" }),
      }),
    );

    expect(clientProps[0]).toMatchObject({
      view: "waivers",
      initialState: { scoring: "standard" },
    });
    expect(preload).toHaveBeenCalledWith(
      expect.stringContaining("/data/fantasy/weekly.json?v="),
      { as: "fetch", crossOrigin: "anonymous" },
    );
  });

  // The board's rows are in the HTML only if the page hands the client real
  // data; a crawler that runs no JavaScript never sees the client's own fetch.
  it("seeds the client with the published board for the requested scoring", async () => {
    jest.spyOn(ReactDOM, "preload").mockImplementation(() => {});

    render(
      await WaiverTargetsPage({
        searchParams: Promise.resolve({ scoring: "standard" }),
      }),
    );

    const { initialSnapshot } = clientProps[0] as {
      initialSnapshot: { boards: Record<string, unknown> } | null;
    };
    expect(Object.keys(initialSnapshot?.boards ?? {})).toEqual(["standard"]);
  });
});
