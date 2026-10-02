import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DecisionLabClient } from "@/app/decision-lab/decision-lab-client";
import { DEFAULT_DECISION_LAB_STATE } from "@/app/decision-lab/decision-lab-state";
import { BudgetPlannerClient } from "@/app/fintech-tools/budget-planner/budget-planner-client";
import { RentVsBuyClient } from "@/app/fintech-tools/rent-vs-buy/rent-vs-buy-client";
import { TravelPlannerClient } from "@/app/travel/travel-planner-client";
import { MBAJobsClient } from "@/app/mba-internship-notifications/mba-jobs-client";
import { DEFAULT_MBA_JOBS_STATE } from "@/app/mba-internship-notifications/mba-jobs-state";
import { FoodMapClient } from "@/app/food-map/food-map-client";
import { DEFAULT_FOOD_MAP_STATE } from "@/app/food-map/food-map-state";
import { SpaceXMissionControlClient } from "@/app/spacex-mission-control/spacex-mission-control-client";
import { DEFAULT_MISSION_CONTROL_STATE } from "@/app/spacex-mission-control/spacex-mission-control-state";

// Guards against a page-wide entrance that server-renders the page at
// opacity 0, which the route tests, with motion mocked away, once missed.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// The Leaflet map loads from a CDN at runtime; mock it so this test stays
// deterministic and doesn't touch the network (matches food-map-client.test.tsx).
jest.mock("@/app/food-map/food-map-leaflet", () => ({
  FoodMapLeaflet: () => null,
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
    ["Job Search", <MBAJobsClient key="j" initialState={DEFAULT_MBA_JOBS_STATE} />],
    ["Food Map", <FoodMapClient key="f" initialState={DEFAULT_FOOD_MAP_STATE} />],
  ])("%s ships its headline visible before any script runs", (_name, element) => {
    expect(serverRenderedHeadingOpacity(element)).toBe(1);
  });

  // The headline check cannot see a wrapper that sits beside the h1. Mission
  // Control had one on the hero card, the tape, the stats, the tabs, and the
  // board, so everything below the headline waited for the script.
  it("Mission Control ships no section at opacity 0", () => {
    const markup = renderToStaticMarkup(
      <SpaceXMissionControlClient initialState={DEFAULT_MISSION_CONTROL_STATE} renderedAtMs={0} />,
    );
    expect(markup.match(/opacity:\s*0[;"]/g) ?? []).toEqual([]);
  });
});
