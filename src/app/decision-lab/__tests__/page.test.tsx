import type { HTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import DecisionLabPage from "../page";

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

describe("DecisionLabPage", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
  });

  it("keeps the page free of nested main landmarks and renders one h1", async () => {
    const page = await DecisionLabPage({ searchParams: Promise.resolve({}) });
    const { container } = render(page);

    expect(container.querySelectorAll("main")).toHaveLength(0);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /^Decision Lab$/i,
      })
    ).toBeVisible();
    expect(
      screen.getByText(/i built this to pressure-test product bets/i)
    ).toBeVisible();
    expect(
      screen.getByText(/Decision Lab keeps those axes separate, then forces a plain call\./i)
    ).toBeVisible();
  });
});
