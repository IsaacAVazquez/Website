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
    expect(screen.getByText("7 options · sorted cheapest first")).toBeVisible();
    expect(screen.getAllByText("Cheapest")).toHaveLength(2);
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
    expect(screen.getAllByText("4,000 tx/mo")[0]).toBeVisible();
  });

  it("switches in-page views, expands card-mix help, and resets inputs", () => {
    render(<InterchangeIQClient />);

    fireEvent.click(
      within(screen.getByRole("navigation", { name: "In-page sections" })).getByRole(
        "link",
        { name: /breakeven/i }
      )
    );
    expect(screen.getByText(/Interchange IQ \//)).toHaveTextContent("Breakeven");

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
    expect(screen.getAllByText("616 tx/mo")[0]).toBeVisible();

    fireEvent.change(exact, { target: { value: "5" } });
    expect(slider).toHaveAttribute("aria-valuenow", "52318");
    expect(exact).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a value between $1.0k and $500k.")).toBeVisible();

    fireEvent.blur(exact);
    expect(exact).toHaveValue(52318);

    fireEvent.change(screen.getByLabelText("Ticket size in dollars"), { target: { value: "12.5" } });
    expect(screen.getAllByText("$12.50")[0]).toBeVisible();
  });

  it("puts the four inputs ahead of the figures and the fee comparison", () => {
    const { container } = render(<InterchangeIQClient />);
    const lastInput = screen.getByLabelText("Amex share of credit in percent");
    const follows = (node: Element | null) =>
      Boolean(node && lastInput.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(follows(screen.getByLabelText("Monthly volume"))).toBe(false);
    expect(follows(container.querySelector(".c97-stat-value"))).toBe(true);
    expect(follows(container.querySelector(".c97-iq-statement"))).toBe(true);
  });
});
