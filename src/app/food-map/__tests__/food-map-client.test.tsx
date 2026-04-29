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

describe("FoodMapClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockReplace.mockReset();
    mockPush.mockReset();
  });

  it("renders the default surface with all 12 spots and the empty pick panel", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /the austin spots i send people to before they ask/i,
      })
    ).toBeVisible();
    expect(screen.getByText(/Showing 12 of 12 spots\./i)).toBeVisible();
    expect(
      screen.getByText(/Tap a pin or a card to see why it earns the spot\./i)
    ).toBeVisible();
  });

  it("toggles a cuisine chip into the URL", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    fireEvent.click(screen.getByRole("button", { name: /^barbecue$/i }));

    expect(mockReplace).toHaveBeenCalledWith("/food-map?cuisine=barbecue", {
      scroll: false,
    });
  });

  it("selects a place from the shortlist and clears it again", () => {
    currentSearchParams = new URLSearchParams("pick=franklin-barbecue");

    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Franklin Barbecue" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /clear pick/i }));

    expect(mockReplace).toHaveBeenLastCalledWith("/food-map", { scroll: false });
  });

  it("shows the empty-state copy when filters exclude every spot", () => {
    currentSearchParams = new URLSearchParams("cuisine=pizza&meal=breakfast");

    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByText(/Nothing matches that combination yet\./i)
    ).toBeVisible();
  });
});
