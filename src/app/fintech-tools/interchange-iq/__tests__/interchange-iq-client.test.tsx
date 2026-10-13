import { fireEvent, render, screen, within } from "@testing-library/react";
import { InterchangeIQClient } from "../interchange-iq-client";

describe("InterchangeIQClient", () => {
  it("renders the default fee model with Stripe IC+ and Checkout.com tied cheapest", () => {
    render(<InterchangeIQClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Interchange IQ" })
    ).toBeVisible();
    // Stripe IC+ and Checkout.com share the same interchange-plus markup, so
    // they tie for cheapest at the default inputs and both get marked.
    expect(screen.getByText("Stripe IC+ and Checkout.com tie")).toBeVisible();
    expect(screen.getByText("Monthly fee breakdown")).toBeVisible();
    expect(screen.getByText("7 options · 588 transactions a month · sorted cheapest first")).toBeVisible();
    expect(screen.getAllByText("Cheapest")).toHaveLength(2);
    // The breakdown is the statement itself, one expandable row per processor.
    const statement = screen.getByRole("list");
    expect(within(statement).getAllByRole("listitem")).toHaveLength(7);
    expect(within(statement).getAllByText("Effective rate")).toHaveLength(7);
  });

  it("updates the live summary and processor ranking when inputs change", () => {
    render(<InterchangeIQClient />);

    fireEvent.change(screen.getByLabelText("Monthly volume"), {
      target: { value: "100000" },
    });
    fireEvent.change(screen.getByLabelText("Avg ticket"), {
      target: { value: "25" },
    });

    expect(screen.getByText("$100k")).toBeVisible();
    expect(screen.getAllByText("$25")[0]).toBeVisible();
    // The count is the same for every processor, so it prints once in the list's meta line.
    expect(screen.getByText("7 options · 4,000 transactions a month · sorted cheapest first")).toBeVisible();
    expect(screen.queryByText(/tx\/mo/)).toBeNull();
  });

  // The in-page nav and its view filter were cut in the 2026-10-12 redesign, since
  // its three filter links all pointed at one anchor; the statement shows every processor.
  it("expands card-mix help and resets inputs", () => {
    render(<InterchangeIQClient />);

    fireEvent.click(screen.getByRole("button", { name: /learn about card mix/i }));
    expect(screen.getByText(/different card types carry different interchange rates/i)).toBeVisible();

    fireEvent.change(screen.getByLabelText("Monthly volume"), {
      target: { value: "125000" },
    });
    expect(screen.getByText("$125k")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /reset all inputs/i }));

    expect(screen.getByText("$50k")).toBeVisible();
    expect(screen.getByLabelText("Monthly volume")).toHaveValue("50000");
  });

  it("takes an exact typed amount beside each slider and ignores one outside the range", () => {
    render(<InterchangeIQClient />);
    const slider = screen.getByLabelText("Monthly volume");
    const exact = screen.getByLabelText("Volume per month in dollars");

    fireEvent.change(exact, { target: { value: "52318" } });
    expect(slider).toHaveAttribute("aria-valuenow", "52318");
    // 52,318 at the default $85 ticket is 615.5 transactions, shown rounded.
    expect(screen.getByText("7 options · 616 transactions a month · sorted cheapest first")).toBeVisible();

    fireEvent.change(exact, { target: { value: "5" } });
    expect(slider).toHaveAttribute("aria-valuenow", "52318");
    expect(exact).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a value between $1.0k and $500k.")).toBeVisible();

    fireEvent.blur(exact);
    expect(exact).toHaveValue(52318);

    fireEvent.change(screen.getByLabelText("Ticket size in dollars"), { target: { value: "12.5" } });
    expect(screen.getAllByText("$12.50")[0]).toBeVisible();
  });

  it("counts six processors in the title sentence, since Stripe is two of the seven options", () => {
    render(<InterchangeIQClient />);

    expect(screen.getByText(/six card processors/)).toBeVisible();
    expect(screen.queryByText(/seven card processors/)).toBeNull();
  });

  it("prints the breakeven under the track to the cent, as the sentence above it does", () => {
    const { container } = render(<InterchangeIQClient />);

    fireEvent.change(screen.getByLabelText("Credit share in percent"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Amex share of credit in percent"), { target: { value: "0" } });

    expect(container.querySelector(".iq-breakeven .iq-fig")).toHaveTextContent("$0.35");
    expect(container.querySelector(".iq-track-figure figcaption")).toHaveTextContent("Breakeven $0.35");
  });

  it("opens every statement row for a print and closes the ones it opened afterwards", () => {
    const { container } = render(<InterchangeIQClient />);
    const rows = [...container.querySelectorAll<HTMLDetailsElement>(".iq-statement details")];
    // A row the visitor opened is theirs, so it stays open after the print.
    rows[0].open = true;

    fireEvent(window, new Event("beforeprint"));
    expect(rows.map((row) => row.open)).toEqual(rows.map(() => true));

    fireEvent(window, new Event("afterprint"));
    expect(rows.map((row) => row.open)).toEqual(rows.map((_, index) => index === 0));
  });

  it("puts the four inputs ahead of the verdict and the fee statement", () => {
    const { container } = render(<InterchangeIQClient />);
    const lastInput = screen.getByLabelText("Amex share of credit in percent");
    const follows = (node: Element | null) =>
      Boolean(node && lastInput.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(follows(screen.getByLabelText("Monthly volume"))).toBe(false);
    expect(follows(container.querySelector(".iq-verdict"))).toBe(true);
    expect(follows(container.querySelector(".iq-statement"))).toBe(true);
  });
});
