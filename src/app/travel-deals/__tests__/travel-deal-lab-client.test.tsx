import { fireEvent, render, screen } from "@testing-library/react";
import { TravelDealLabClient } from "../travel-deal-lab-client";

describe("TravelDealLabClient number fields", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lets a field go blank while retyping and says when it clamps", () => {
    render(<TravelDealLabClient />);
    const travelers = screen.getByLabelText("Travelers");

    fireEvent.change(travelers, { target: { value: "" } });
    expect(travelers).toHaveValue(null);

    fireEvent.change(travelers, { target: { value: "40" } });
    expect(screen.getByText(/runs from 1 to 12, so I.m using 12/)).toBeVisible();

    fireEvent.blur(travelers);
    expect(travelers).toHaveValue(12);
    expect(screen.queryByText(/runs from 1 to 12/)).not.toBeInTheDocument();
  });
});
