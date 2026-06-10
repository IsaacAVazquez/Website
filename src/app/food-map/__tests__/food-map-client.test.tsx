import type { HTMLAttributes } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FoodMapClient } from "../food-map-client";
import { DEFAULT_FOOD_MAP_STATE } from "../food-map-state";

const mockReplace = jest.fn();
const mockPush = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => true,
}));

// The Leaflet map loads from a CDN at runtime; mock it so tests stay
// deterministic and don't touch the network.
jest.mock("../food-map-leaflet", () => ({
  FoodMapLeaflet: () => <div data-testid="food-map-leaflet" />,
}));

describe("FoodMapClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockReplace.mockReset();
    mockPush.mockReset();
  });

  it("renders the default Austin surface with the curator legend", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /^food map$/i })
    ).toBeVisible();
    expect(screen.getByText(/Showing 12 of 12 in Austin\./i)).toBeVisible();
    expect(
      screen.getByText(/Pins are colored by who recommends them\./i)
    ).toBeVisible();
    // "Anthony Bourdain" appears both as a filter chip and in the legend.
    expect(screen.getAllByText(/Anthony Bourdain/i).length).toBeGreaterThan(0);
  });

  it("switches the city into the URL", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    fireEvent.click(screen.getByRole("radio", { name: /tokyo/i }));

    expect(mockReplace).toHaveBeenCalledWith("/food-map?city=tokyo", {
      scroll: false,
    });
  });

  it("toggles a curator chip into the URL", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    fireEvent.click(screen.getByRole("button", { name: /anthony bourdain/i }));

    expect(mockReplace).toHaveBeenCalledWith("/food-map?curator=bourdain", {
      scroll: false,
    });
  });

  it("selects a place from the URL and clears it again", () => {
    currentSearchParams = new URLSearchParams("pick=franklin-barbecue");

    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Franklin Barbecue" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /clear pick/i }));

    expect(mockReplace).toHaveBeenLastCalledWith("/food-map", { scroll: false });
  });

  it("shows the empty-state copy when filters exclude every spot", () => {
    // Austin has no sushi spots.
    currentSearchParams = new URLSearchParams("cuisine=sushi");

    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByText(/Nothing matches that combination yet\./i)
    ).toBeVisible();
  });
});
