import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DecisionLabClient } from "@/app/decision-lab/decision-lab-client";
import { DEFAULT_DECISION_LAB_STATE } from "@/app/decision-lab/decision-lab-state";
import { BudgetPlannerClient } from "@/app/fintech-tools/budget-planner/budget-planner-client";
import { RentVsBuyClient } from "@/app/fintech-tools/rent-vs-buy/rent-vs-buy-client";
import { TravelPlannerClient } from "@/app/travel/travel-planner-client";

// Real framer-motion on purpose. The route tests mock it, which is how a
// page-wide fade that server-rendered every page at opacity 0 went unseen.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

/** The h1's server-rendered opacity, walking up through inline styles. */
function serverRenderedHeadingOpacity(element: ReactElement): number {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(element);
  const heading = host.querySelector("h1");
  if (!heading) throw new Error("no h1 in the server render");
  let opacity = 1;
  for (let node: HTMLElement | null = heading; node && node !== host; node = node.parentElement) {
    const value = node.style.opacity;
    if (value !== "") opacity *= Number(value);
  }
  return opacity;
}

describe("server-rendered first paint", () => {
  it.each([
    ["Decision Lab", <DecisionLabClient key="d" initialState={DEFAULT_DECISION_LAB_STATE} />],
    ["Budget Planner", <BudgetPlannerClient key="b" />],
    ["Rent vs. Buy", <RentVsBuyClient key="r" />],
    ["Travel Planner", <TravelPlannerClient key="t" />],
  ])("%s ships its headline visible before any script runs", (_name, element) => {
    expect(serverRenderedHeadingOpacity(element)).toBe(1);
  });
});
