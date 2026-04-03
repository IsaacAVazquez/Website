import { render, screen } from "@testing-library/react";
import { SectionIntro } from "../SectionIntro";

describe("SectionIntro", () => {
  it("renders an h1 by default", () => {
    render(<SectionIntro title="Default Title" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Default Title" })
    ).toBeVisible();
  });

  it("renders the requested heading level", () => {
    render(<SectionIntro title="Section Title" headingLevel={2} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Section Title" })
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { level: 1, name: "Section Title" })
    ).not.toBeInTheDocument();
  });
});
