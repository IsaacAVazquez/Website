import type { HTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import FoodMapPage from "../page";

let currentSearchParams = new URLSearchParams();

jest.mock("@/components/StructuredData", () => ({
  StructuredData: () => null,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => true,
}));

describe("FoodMapPage", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
  });

  it("renders one h1 and no nested main landmark", async () => {
    const page = await FoodMapPage({ searchParams: Promise.resolve({}) });
    const { container } = render(page);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /^food map$/i,
      })
    ).toBeVisible();
    expect(
      screen.getByText(/Tap a pin or a card to see why it earns the spot\./i)
    ).toBeVisible();
  });
});
