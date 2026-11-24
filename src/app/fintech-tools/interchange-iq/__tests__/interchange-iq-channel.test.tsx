import { fireEvent, render, screen, within } from "@testing-library/react";
import { InterchangeIQClient } from "../interchange-iq-client";

describe("InterchangeIQClient payment channel", () => {
  const options = (count: number) => screen.getByText(new RegExp(`^${count} options · `));
  const squareRow = () =>
    screen.getAllByRole("listitem").find((row) => within(row).queryByText("Square") !== null)!;

  it("prices assumed contracts online only and says so in person", () => {
    render(<InterchangeIQClient />);

    fireEvent.click(screen.getByLabelText("Include assumed custom contracts"));
    expect(options(7)).toBeInTheDocument();
    expect(screen.getByText(/Custom markups are illustrative assumptions/)).toBeInTheDocument();
    expect(screen.getByText(/under these assumptions$/)).toBeInTheDocument();
    expect(within(squareRow()).getByText(/online checkout/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Payment channel"), { target: { value: "in-person" } });
    expect(options(4)).toBeInTheDocument();
    expect(screen.getByText(/Assumed contracts are priced for online checkout only/)).toBeInTheDocument();
    expect(screen.getByText(/on published rates$/)).toBeInTheDocument();
    // 2.6% of $50,000 plus $0.15 on each of 588.24 transactions.
    expect(within(squareRow()).getByText("$1,388.24")).toBeInTheDocument();
    expect(within(squareRow()).getByText(/with the card present/)).toBeInTheDocument();
    expect(within(squareRow()).queryByText(/online checkout/)).toBeNull();

    fireEvent.change(screen.getByLabelText("Payment channel"), { target: { value: "online" } });
    expect(options(7)).toBeInTheDocument();
  });

  it("reads any value but in-person as online checkout", () => {
    render(<InterchangeIQClient />);
    const channel = screen.getByLabelText("Payment channel");
    fireEvent.change(channel, { target: { value: "in-person" } });
    expect(channel).toHaveValue("in-person");
    fireEvent.change(channel, { target: { value: "online" } });
    expect(channel).toHaveValue("online");
    // 3.3% of $50,000 plus $0.30 on each of 588.24 transactions.
    expect(within(squareRow()).getByText("$1,826.47")).toBeInTheDocument();
  });
});
