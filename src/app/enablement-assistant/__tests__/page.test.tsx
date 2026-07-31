import { render, screen } from "@testing-library/react";
import EnablementAssistantPage from "../page";

jest.mock("@/components/StructuredData", () => ({
  StructuredData: () => null,
}));

describe("EnablementAssistantPage", () => {
  it("renders one h1, no nested main landmark, and the program feedback loop", () => {
    const { container } = render(<EnablementAssistantPage />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Automation Enablement Assistant",
      })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "The failure log becomes the documentation roadmap.",
      })
    ).toBeVisible();
    expect(screen.getByText(/invented, committed seed data/i)).toBeVisible();
  });
});
