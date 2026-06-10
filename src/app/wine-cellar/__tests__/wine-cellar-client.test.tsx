import type { HTMLAttributes } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { WINE_CELLAR_STORAGE_KEY } from "@/lib/wineCellar";
import { WineCellarClient } from "../wine-cellar-client";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => true,
}));

describe("WineCellarClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = jest.fn();
  });

  it("renders the empty cellar and logs a new bottle", () => {
    render(<WineCellarClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Wine Cellar" })).toBeVisible();
    expect(screen.getByText("Your cellar is empty")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Wine name"), {
      target: { value: "Barolo" },
    });
    fireEvent.change(screen.getByLabelText("Producer"), {
      target: { value: "Producer A" },
    });
    fireEvent.change(screen.getByLabelText("Region"), {
      target: { value: "Piedmont" },
    });
    fireEvent.change(screen.getByLabelText("Varietal"), {
      target: { value: "Nebbiolo" },
    });
    fireEvent.change(screen.getByLabelText("Price"), {
      target: { value: "70" },
    });
    fireEvent.change(screen.getByLabelText("Rating"), {
      target: { value: "4.5" },
    });
    fireEvent.change(screen.getByLabelText("Tasting notes"), {
      target: { value: "Cherry and tar." },
    });

    fireEvent.click(screen.getByRole("button", { name: /add tasting/i }));

    expect(screen.getAllByText("Barolo")[0]).toBeVisible();
    expect(screen.getAllByText("Piedmont")[0]).toBeVisible();
    expect(window.localStorage.getItem(WINE_CELLAR_STORAGE_KEY)).toContain("Barolo");
  });

  it("filters, resets, edits, and deletes an existing bottle", () => {
    window.localStorage.setItem(
      WINE_CELLAR_STORAGE_KEY,
      JSON.stringify([
        {
          id: "wine-1",
          name: "Barolo",
          producer: "Producer A",
          vintage: 2019,
          region: "Piedmont",
          varietal: "Nebbiolo",
          type: "red",
          price: 70,
          rating: 4.5,
          notes: "Cherry",
          tastedOn: "2026-06-01",
          createdAt: "2026-06-01T12:00:00.000Z",
        },
        {
          id: "wine-2",
          name: "Chablis",
          producer: "Producer B",
          vintage: 2021,
          region: "Burgundy",
          varietal: "Chardonnay",
          type: "white",
          price: 42,
          rating: 4,
          notes: "Lemon",
          tastedOn: "2026-06-07",
          createdAt: "2026-06-07T12:00:00.000Z",
        },
      ])
    );

    render(<WineCellarClient />);

    fireEvent.change(within(screen.getByLabelText("Search wines")).getByRole("searchbox"), {
      target: { value: "burgundy" },
    });
    const tastingLog = screen.getByRole("region", { name: "Tasting log" });
    expect(within(tastingLog).getByText("Chablis")).toBeVisible();
    expect(within(tastingLog).queryByText("Barolo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));
    expect(within(tastingLog).getByText("Barolo")).toBeVisible();

    fireEvent.click(within(tastingLog).getByRole("button", { name: "Edit Barolo" }));
    fireEvent.change(screen.getByLabelText("Wine name"), {
      target: { value: "Updated Barolo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save tasting/i }));
    expect(screen.getAllByText("Updated Barolo")[0]).toBeVisible();

    fireEvent.click(
      within(tastingLog).getByRole("button", { name: "Delete Updated Barolo" })
    );
    expect(screen.queryByText("Updated Barolo")).not.toBeInTheDocument();
  });
});
