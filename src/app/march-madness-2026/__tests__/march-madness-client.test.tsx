import { fireEvent, render, screen, within } from "@testing-library/react";
import { MarchMadnessClient } from "../march-madness-client";
import { DEFAULT_MARCH_MADNESS_STATE } from "../march-madness-state";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe("MarchMadnessClient", () => {
  beforeEach(() => {
    mockReplace.mockReset();
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
    const replaceState = jest.spyOn(window.history, "replaceState");
    const picks = { view: "picks" as const, region: "east" as const, analytics: "rankings" as const };
    const { rerender } = render(<MarchMadnessClient initialState={picks} />);

    const [first] = screen.getAllByRole("button", { expanded: false });
    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(replaceState).toHaveBeenLastCalledWith(null, "", "/march-madness-2026?view=picks&pick=tz-0");

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
    rerender(<MarchMadnessClient initialState={{ ...picks, region: "west" }} initialPick="tz-0" />);
    rerender(<MarchMadnessClient initialState={picks} initialPick="tz-1" />);
    const toggles = screen.getAllByRole("button", { expanded: true });
    expect(toggles).toHaveLength(1);
    expect(toggles[0]).toHaveAttribute("aria-controls", "pick-body-tz-1");
    replaceState.mockRestore();
  });
});
