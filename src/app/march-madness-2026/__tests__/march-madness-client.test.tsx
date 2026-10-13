import { fireEvent, render, screen, within } from "@testing-library/react";
import { MarchMadnessClient } from "../march-madness-client";
import { DEFAULT_MARCH_MADNESS_STATE } from "../march-madness-state";

const mockReplace = jest.fn();
// The address the router holds, which is where the client reads the open pick.
let mockSearch = "";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

describe("MarchMadnessClient", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockSearch = "";
    window.history.replaceState(null, "", "/");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders the bracket analysis with default bracket and region tabs", () => {
    render(<MarchMadnessClient initialState={DEFAULT_MARCH_MADNESS_STATE} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /march madness bracket analysis/i })
    ).toBeVisible();
    expect(
      screen.getByRole("tab", { name: "Bracket", selected: true })
    ).toBeVisible();
    expect(screen.getByRole("tab", { name: "East", selected: true })).toBeVisible();
    expect(screen.getAllByText("Duke").length).toBeGreaterThan(0);
  });

  it("explains every badge the picks board uses, CONFIRM included", () => {
    render(
      <MarchMadnessClient initialState={{ view: "picks", region: "east", analytics: "rankings" }} />
    );

    expect(screen.getByText("Analytics confirms the seed")).toBeVisible();
  });

  it("links straight into the workspace from the opening lines, on the view the reader is in", () => {
    render(
      <MarchMadnessClient
        initialState={{ view: "analytics", region: "south", analytics: "s-curve" }}
      />
    );

    expect(screen.getByRole("link", { name: "Open the analysis workspace" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=analytics&region=south&analytics=s-curve#analysis-workspace"
    );
  });

  it("updates route state when primary, region, and analytics tabs are selected", () => {
    render(<MarchMadnessClient initialState={DEFAULT_MARCH_MADNESS_STATE} />);

    fireEvent.click(screen.getByRole("tab", { name: "West" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/march-madness-2026?region=west",
      { scroll: false }
    );

    fireEvent.click(screen.getByRole("tab", { name: "Analytics" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/march-madness-2026?view=analytics&region=west",
      { scroll: false }
    );

    fireEvent.click(screen.getByRole("tab", { name: "Injuries" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/march-madness-2026?view=analytics&region=west&analytics=injuries",
      { scroll: false }
    );
  });

  it("copies the current deep link to the clipboard", async () => {
    render(
      <MarchMadnessClient
        initialState={{
          view: "analytics",
          region: "south",
          analytics: "s-curve",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /copy current view link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "http://localhost/march-madness-2026?view=analytics&region=south&analytics=s-curve"
    );
    expect(await screen.findByText("Deep link copied.")).toBeVisible();
  });

  it("keeps the newer region when an earlier tab change's response lands late", () => {
    const { rerender } = render(<MarchMadnessClient initialState={DEFAULT_MARCH_MADNESS_STATE} />);
    const regions = screen.getByRole("tablist", { name: "March Madness regions" });

    fireEvent.click(within(regions).getByRole("tab", { name: "West" }));
    fireEvent.click(within(regions).getByRole("tab", { name: "South" }));

    // The West response arrives after the South click.
    rerender(<MarchMadnessClient initialState={{ ...DEFAULT_MARCH_MADNESS_STATE, region: "west" }} />);
    expect(within(regions).getByRole("tab", { name: "South", selected: true })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "South region" })).toBeVisible();

    rerender(<MarchMadnessClient initialState={{ ...DEFAULT_MARCH_MADNESS_STATE, region: "south" }} />);
    expect(within(regions).getByRole("tab", { name: "South", selected: true })).toBeVisible();

    // With nothing of ours pending, a reading from Back or a link is adopted.
    rerender(<MarchMadnessClient initialState={{ ...DEFAULT_MARCH_MADNESS_STATE, region: "midwest" }} />);
    expect(within(regions).getByRole("tab", { name: "Midwest", selected: true })).toBeVisible();
  });

  it("keeps the open pick in the address, the copied link, and the next tab change", async () => {
    const picks = { view: "picks" as const, region: "east" as const, analytics: "rankings" as const };
    window.history.replaceState({ entry: "kept" }, "", "/march-madness-2026?view=picks");
    const { rerender } = render(<MarchMadnessClient initialState={picks} />);

    const [first] = screen.getAllByRole("button", { expanded: false });
    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    // Written at once on the entry's own state, so leaving before the router answers keeps the pick.
    expect(window.location.search).toBe("?view=picks&pick=tz-0");
    expect(window.history.state).toEqual({ entry: "kept" });
    // Through the router too, so the history entry Back returns to carries the pick.
    expect(mockReplace).toHaveBeenLastCalledWith("/march-madness-2026?view=picks&pick=tz-0", { scroll: false });

    fireEvent.click(screen.getByRole("button", { name: /copy current view link/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "http://localhost/march-madness-2026?view=picks&pick=tz-0"
    );
    await screen.findByText("Deep link copied.");

    fireEvent.click(screen.getByRole("tab", { name: "West" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      "/march-madness-2026?view=picks&region=west&pick=tz-0",
      { scroll: false }
    );

    // Back to a ?pick= address opens that pick.
    mockSearch = "view=picks&region=west&pick=tz-0";
    rerender(<MarchMadnessClient initialState={{ ...picks, region: "west" }} />);
    mockSearch = "view=picks&pick=tz-1";
    rerender(<MarchMadnessClient initialState={picks} />);
    const toggles = screen.getAllByRole("button", { expanded: true });
    expect(toggles).toHaveLength(1);
    expect(toggles[0]).toHaveAttribute("aria-controls", "pick-body-tz-1");
  });

  it("keeps the newer pick when an earlier toggle's response lands late", () => {
    const picks = { view: "picks" as const, region: "east" as const, analytics: "rankings" as const };
    const { rerender } = render(<MarchMadnessClient initialState={picks} />);

    const [first, second] = screen.getAllByRole("button", { expanded: false });
    fireEvent.click(first);
    fireEvent.click(second);

    // The first pick's response arrives after the second click.
    mockSearch = "view=picks&pick=tz-0";
    rerender(<MarchMadnessClient initialState={picks} />);
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("carries the open pick on the opening links that stay on the picks board", () => {
    mockSearch = "view=picks&pick=tz-0";
    render(<MarchMadnessClient initialState={{ view: "picks", region: "east", analytics: "rankings" }} />);

    expect(screen.getByRole("link", { name: "How the model works" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=picks&pick=tz-0#why-this-model-is-different"
    );
    expect(screen.getByRole("link", { name: "Open the analysis workspace" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=picks&pick=tz-0#analysis-workspace"
    );
    expect(screen.getByRole("link", { name: "See best upsets" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=picks&pick=tz-0#analysis-workspace"
    );
    expect(screen.getByRole("link", { name: "Open upset board" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=picks&pick=tz-0#analysis-workspace"
    );
  });

  it("keeps the reader's region on the upset and method links", () => {
    render(
      <MarchMadnessClient initialState={{ view: "bracket", region: "west", analytics: "rankings" }} />
    );

    expect(screen.getByRole("link", { name: "Open upset board" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=picks&region=west#analysis-workspace"
    );
    expect(screen.getByRole("link", { name: "View S-curve" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=analytics&region=west&analytics=s-curve#analysis-workspace"
    );
    expect(screen.getByRole("link", { name: "View time zones" })).toHaveAttribute(
      "href",
      "/march-madness-2026?view=time-zones&region=west#analysis-workspace"
    );
  });

  it("names the whole city on the other time zone impacts", () => {
    render(
      <MarchMadnessClient initialState={{ view: "time-zones", region: "east", analytics: "rankings" }} />
    );
    const workspace = screen.getByRole("region", { name: "The analysis workspace" });
    const row = (team: string) => within(workspace).getByText(team).closest("li");

    expect(row("Idaho")).toHaveTextContent("PT to Oklahoma City Doesn't affect outcome");
    expect(row("Purdue")).toHaveTextContent("ET to San Jose Regional Sweet 16.");
    expect(row("Santa Clara")).toHaveTextContent("PT to St. Louis Doesn't matter");
    expect(row("Alabama")).toHaveTextContent("CT to Tampa Compounds");
  });
});
