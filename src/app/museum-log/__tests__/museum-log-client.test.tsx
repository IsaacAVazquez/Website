import { fireEvent, render, screen, within } from "@testing-library/react";
import { museumSnapshot } from "@/data/museumSnapshot";
import { MuseumLogClient } from "../museum-log-client";
import { DEFAULT_MUSEUM_STATE } from "../museum-log-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

describe("MuseumLogClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
    window.localStorage.clear();
  });

  it("renders the catalog and navigates section/filter changes", async () => {
    render(
      <MuseumLogClient
        initialState={DEFAULT_MUSEUM_STATE}
        snapshot={museumSnapshot}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Museum Log" })).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Section navigation" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /journal/i }));
    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?view=journal", {
      scroll: false,
    });

    expect(screen.getAllByText("0")[0]).toBeVisible();

    const search = within(screen.getByLabelText("Filter museums")).getByRole("searchbox");
    fireEvent.change(search, { target: { value: "moma" } });
    expect(screen.getByText("Museum of Modern Art")).toBeVisible();
  });

  it("opens a museum detail route from the catalog", () => {
    render(
      <MuseumLogClient
        initialState={DEFAULT_MUSEUM_STATE}
        snapshot={museumSnapshot}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /open museum of modern art detail/i })
    );

    expect(mockPush).toHaveBeenLastCalledWith("/museum-log?museum=moma", {
      scroll: false,
    });
  });
});
