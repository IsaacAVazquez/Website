import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RentVsBuyClient } from "../rent-vs-buy-client";
import { RENT_VS_BUY_STORAGE_KEY } from "@/lib/rentVsBuy/persistence";

describe("RentVsBuyClient", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the calculator with default inputs and a verdict", () => {
    render(<RentVsBuyClient />);

    expect(
      screen.getByRole("heading", { name: "Rent vs. Buy Calculator" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Home price")).toHaveValue(450000);
    // A verdict status is always shown.
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("recomputes and persists when an input changes", async () => {
    render(<RentVsBuyClient />);

    const rent = screen.getByLabelText("Monthly rent");
    fireEvent.change(rent, { target: { value: "5000" } });

    await waitFor(() => {
      expect(screen.getByLabelText("Monthly rent")).toHaveValue(5000);
      const stored = localStorage.getItem(RENT_VS_BUY_STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored as string).monthlyRent).toBe(5000);
    });

    // High rent should tip the verdict toward buying (shown in the meta chip
    // and the result rail).
    expect(screen.getAllByText("Buying comes out ahead").length).toBeGreaterThan(0);
  });

  it("hydrates a saved input from localStorage", () => {
    localStorage.setItem(
      RENT_VS_BUY_STORAGE_KEY,
      JSON.stringify({ homePrice: 600000, monthlyRent: 900, yearsStaying: 10 }),
    );

    render(<RentVsBuyClient />);
    expect(screen.getByLabelText("Home price")).toHaveValue(600000);
  });

  it("resets inputs back to the defaults", async () => {
    render(<RentVsBuyClient />);

    fireEvent.change(screen.getByLabelText("Home price"), { target: { value: "999000" } });
    await waitFor(() => expect(screen.getByLabelText("Home price")).toHaveValue(999000));

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(screen.getByLabelText("Home price")).toHaveValue(450000));
  });

  it("puts the five main inputs ahead of the result and keeps the full disclosure one link away", () => {
    render(<RentVsBuyClient />);
    const verdict = screen.getByRole("status");
    for (const label of ["Home price", "Monthly rent", "Years staying", "Down payment", "Mortgage rate"]) {
      expect(screen.getByLabelText(label).compareDocumentPosition(verdict) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(verdict.compareDocumentPosition(screen.getByLabelText("Loan term")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const link = screen.getByRole("link", { name: "Assumptions and limits" });
    expect(link).toHaveAttribute("href", "#assumptions-and-limits");
    const disclosure = document.getElementById("assumptions-and-limits");
    expect(disclosure).toHaveTextContent("Educational only, not financial or tax advice.");
    expect(disclosure).toHaveTextContent(/Tax figures are for tax year \d{4}/);
    expect(disclosure).toHaveTextContent(/Freddie Mac 30 year fixed average as of/);
  });
});
