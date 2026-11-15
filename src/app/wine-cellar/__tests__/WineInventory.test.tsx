import { fireEvent, render, screen } from "@testing-library/react";
import { WineInventory } from "../WineInventory";
import { WINE_INVENTORY_KEY } from "@/lib/wineInventory";

describe("WineInventory quantity field", () => {
  beforeEach(() => {
    localStorage.setItem(
      WINE_INVENTORY_KEY,
      JSON.stringify([
        {
          id: "stock-1",
          name: "Barolo",
          producer: "",
          region: "",
          varietal: "",
          type: "red",
          vintage: null,
          price: null,
          wishlist: false,
          quantity: 2,
        },
      ]),
    );
  });
  afterEach(() => localStorage.clear());

  it.each([
    ["1000", 999],
    ["1.5", 1],
    ["-3", 0],
    ["", 0],
  ])("keeps the bottle when %p is typed", (typed, stored) => {
    render(<WineInventory onOpen={() => {}} />);
    fireEvent.change(screen.getByLabelText("Quantity of Barolo"), { target: { value: typed } });
    const saved = JSON.parse(localStorage.getItem(WINE_INVENTORY_KEY) ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0].quantity).toBe(stored);
  });
});
