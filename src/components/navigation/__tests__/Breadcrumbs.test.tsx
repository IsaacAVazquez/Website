import { render } from "@testing-library/react";
import { Breadcrumbs, createBreadcrumbItems } from "../Breadcrumbs";

jest.mock("next/navigation", () => ({
  usePathname: () => "/fantasy-football/trade-calculator",
}));

describe("Breadcrumbs", () => {
  // Every page that renders this trail already emits its own BreadcrumbList
  // from page.tsx. A second copy from here duplicated it, and on the best ball
  // draft tracker the two copies disagreed about whether Home was in the trail.
  it("renders the visible trail without a second BreadcrumbList", () => {
    const { container } = render(
      <Breadcrumbs
        customItems={createBreadcrumbItems([
          { label: "Home", href: "/" },
          { label: "Fantasy Football", href: "/fantasy-football" },
          { label: "Trade Calculator", href: "/fantasy-football/trade-calculator" },
        ])}
      />
    );

    expect(container.querySelector('nav[aria-label="Breadcrumb"]')).not.toBeNull();
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
