import { fireEvent, render, screen, within } from "@testing-library/react";
import { WINE_CELLAR_STORAGE_KEY } from "@/lib/wineCellar";
import { WineCellarClient } from "../wine-cellar-client";

describe("WineCellarClient", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the empty cellar and logs a new bottle", () => {
    render(<WineCellarClient />);

    expect(screen.getByRole("heading", { level: 1, name: "Wine Cellar" })).toBeVisible();
    expect(screen.getByText("Log your first bottle")).toBeVisible();
    // An empty cellar has nothing to search or sort, so the form leads and the filters wait.
    expect(screen.queryByRole("searchbox", { name: "Search wines" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Filter by wine type")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Wine cellar side panel")).toHaveClass("order-first");

    fireEvent.change(screen.getByLabelText("Wine name"), {
      target: { value: "Barolo" },
    });
    fireEvent.change(screen.getByLabelText("Producer"), {
      target: { value: "Producer A" },
    });
    fireEvent.change(screen.getByLabelText("Region"), {
      target: { value: "Piedmont" },
    });
    fireEvent.change(screen.getByLabelText("Varietal / grape"), {
      target: { value: "Nebbiolo" },
    });
    fireEvent.change(screen.getByLabelText("Price (USD)"), {
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
    // The first bottle brings the filters in and puts the log back ahead of the form.
    expect(screen.getByRole("searchbox", { name: "Search wines" })).toBeVisible();
    expect(screen.getByLabelText("Wine cellar side panel")).not.toHaveClass("order-first");
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

    // A saved return visit opens on the log with its filters.
    expect(screen.getByLabelText("Filter by wine type")).toBeVisible();
    expect(screen.getByLabelText("Wine cellar side panel")).not.toHaveClass("order-first");

    fireEvent.change(screen.getByRole("searchbox", { name: "Search wines" }), {
      target: { value: "burgundy" },
    });
    const tastingLog = screen.getByRole("region", { name: "Tasting log" });
    expect(within(tastingLog).getByText("Chablis")).toBeVisible();
    expect(within(tastingLog).queryByText("Barolo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));
    expect(within(tastingLog).getByText("Barolo")).toBeVisible();

    fireEvent.click(within(tastingLog).getByRole("button", { name: "Edit Barolo" }));
    expect(screen.getByLabelText("Wine name")).toHaveFocus();
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
  it("explains a missing name inline instead of disabling the button", () => {
    render(<WineCellarClient />);

    const name = screen.getByLabelText("Wine name");
    fireEvent.click(screen.getByRole("button", { name: /add tasting/i }));
    expect(name).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent("Give the bottle a name to log it.");

    fireEvent.change(name, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /add tasting/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Give the bottle a name to log it.");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveFocus();

    fireEvent.change(name, { target: { value: "Chinon" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
