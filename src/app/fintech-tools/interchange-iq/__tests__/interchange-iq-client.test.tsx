import { fireEvent, render, screen, within } from "@testing-library/react";
import { InterchangeIQClient } from "../interchange-iq-client";

describe("InterchangeIQClient", () => {
  it("renders the default fee model with Stripe IC+ as the recommended processor", () => {
    render(<InterchangeIQClient />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Interchange IQ" })
    ).toBeVisible();
    expect(screen.getByText("Stripe IC+ wins")).toBeVisible();
    expect(screen.getByText("Monthly fee breakdown")).toBeVisible();
    expect(screen.getByText("7 options · sorted cheapest first")).toBeVisible();
    expect(screen.getAllByText("Cheapest")).toHaveLength(1);
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
});
