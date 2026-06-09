import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Duke Blue Devils")).toBeVisible();
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
});
