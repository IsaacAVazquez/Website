import { render, screen } from "@testing-library/react";
import ReactDOM from "react-dom";
import type { FantasySnapshot } from "@/lib/fantasy";
import FantasyFootballPage from "../page";
import type { FantasySearchState } from "../fantasy-state";

type ClientProps = { initialState: FantasySearchState; initialSnapshot?: FantasySnapshot | null };
const mockClient = jest.fn<void, [ClientProps]>();

jest.mock("../fantasy-football-client", () => ({
  FantasyFootballClient: (props: ClientProps) => {
    mockClient(props);
    return <div data-testid="fantasy-client" />;
  },
}));

describe("FantasyFootballPage", () => {
  beforeEach(() => {
    mockClient.mockReset();
    jest.spyOn(ReactDOM, "preload").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("seeds the client with the first page of the requested slice", async () => {
    render(
      await FantasyFootballPage({
        searchParams: Promise.resolve({ position: "wr", scoring: "ppr" }),
      })
    );

    expect(screen.getByTestId("fantasy-client")).toBeInTheDocument();
    const props = mockClient.mock.calls.at(-1)?.[0];
    expect(props?.initialState.position).toBe("wr");
    expect(props?.initialSnapshot?.positions.WR).toHaveLength(40);
    expect(props?.initialSnapshot?.overall).toEqual([]);
  });
});
