import { fireEvent, render, screen } from "@testing-library/react";
import { FoodMapClient } from "../food-map-client";
import { DEFAULT_FOOD_MAP_STATE } from "../food-map-state";

let currentSearchParams = new URLSearchParams();
// The page writes its state with the native history API, which the router
// syncs into useSearchParams; here the mock is fed by hand where a test needs it.
let replaceState: jest.SpyInstance;
const lastHref = () => String(replaceState.mock.calls.at(-1)?.[2]);

jest.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}));

// The Leaflet map loads from a CDN at runtime; mock it so tests stay
// deterministic and don't touch the network.
jest.mock("../food-map-leaflet", () => ({
  FoodMapLeaflet: () => <div data-testid="food-map-leaflet" />,
}));

describe("FoodMapClient", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    replaceState = jest.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });
  afterEach(() => {
    replaceState.mockRestore();
  });

  it("renders the default Austin surface with the curator legend", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /^food map$/i })
    ).toBeVisible();
    expect(screen.getByText(/Showing 12 of 12 in Austin/i)).toBeVisible();
    expect(screen.getByText(/Reviewed 2026-04-28/i)).toBeVisible();
    expect(
      screen.getByText(/Pins are colored by who recommends them\./i)
    ).toBeVisible();
    // "Anthony Bourdain" appears both as a filter chip and in the legend.
    expect(screen.getAllByText(/Anthony Bourdain/i).length).toBeGreaterThan(0);
  });

  it("switches the city into the URL", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    fireEvent.click(screen.getByRole("radio", { name: /tokyo/i }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "/food-map?city=tokyo");
  });

  it("moves and selects city radios with arrow keys, including wrapping", () => {
    const view = render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);
    const austin = screen.getByRole("radio", { name: /austin/i });
    expect(austin).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: /tokyo/i })).toHaveAttribute("tabindex", "-1");
    austin.focus();
    fireEvent.keyDown(austin, { key: "ArrowRight" });
    expect(screen.getByRole("radio", { name: /san francisco/i })).toHaveFocus();
    expect(lastHref()).toBe("/food-map?city=sf");

    currentSearchParams = new URLSearchParams("city=sf");
    view.rerender(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);
    expect(screen.getByRole("radio", { name: /san francisco/i })).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(austin, { key: "ArrowLeft" });
    expect(screen.getByRole("radio", { name: /san sebastián/i })).toHaveFocus();
    expect(lastHref()).toBe("/food-map?city=san-sebastian");
  });

  it("focuses the chosen stop and returns to the index when cleared", () => {
    replaceState.mockImplementation((_state: unknown, _title: string, href?: string | URL | null) => {
      currentSearchParams = new URLSearchParams(String(href).split("?")[1] ?? "");
    });
    const ui = () => <FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />;
    const view = render(ui());
    fireEvent.click(screen.getByRole("button", { name: /barbecue franklin barbecue/i }));
    view.rerender(ui());
    expect(screen.getByRole("heading", { name: "Franklin Barbecue" })).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    fireEvent.click(screen.getByRole("button", { name: /clear pick/i }));
    view.rerender(ui());
    expect(screen.getByRole("heading", { name: "The stops" })).toHaveFocus();
  });

  it("puts the city choice ahead of the map and offers a direct path to the list", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);
    const cities = screen.getByRole("radiogroup", { name: "Choose a city" });
    const map = screen.getByTestId("food-map-leaflet");
    expect(cities.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Go to the list of stops" }));
    expect(screen.getByRole("heading", { name: "The stops" })).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });
    // Jumping to the list is a scroll, so the URL and the selection stay as they were.
    expect(replaceState).not.toHaveBeenCalled();
  });

  it("toggles a curator chip into the URL", () => {
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    fireEvent.click(screen.getByRole("button", { name: /anthony bourdain/i }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "/food-map?curator=bourdain");
  });

  it("rewrites a non-canonical query in place without a navigation", () => {
    currentSearchParams = new URLSearchParams("city=austin&curator=bourdain,bourdain");
    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(replaceState).toHaveBeenCalledWith(null, "", "/food-map?curator=bourdain");
  });

  it("selects a place from the URL and clears it again", () => {
    currentSearchParams = new URLSearchParams("pick=franklin-barbecue");

    render(<FoodMapClient initialState={DEFAULT_FOOD_MAP_STATE} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Franklin Barbecue" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /clear pick/i }));

    expect(lastHref()).toBe("/food-map");
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
