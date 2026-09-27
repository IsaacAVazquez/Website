import type { FantasyFormula1Asset, FantasyFormula1LineupSummary } from "@/types/fantasyFormula1";
import { garageSlots, normaliseTeamColor } from "../garage";

function asset(kind: "driver" | "constructor", id: string, name: string, teamColor: string | null): FantasyFormula1Asset {
  return {
    id,
    kind,
    name,
    shortName: name,
    teamName: kind === "driver" ? "Team" : null,
    teamColor,
    headshotUrl: null,
    standingPosition: 1,
    seasonPoints: 0,
    lastRacePoints: 0,
    price: 10,
    projectedPoints: 20,
    valueRating: 20,
    formScore: 5,
    risk: "low",
    riskReason: "",
  };
}

function summary(overrides: Partial<FantasyFormula1LineupSummary> = {}): FantasyFormula1LineupSummary {
  return {
    drivers: [],
    constructors: [],
    assets: [],
    totalPrice: 0,
    projectedPoints: 0,
    valueRating: 0,
    budgetRemaining: 100,
    isComplete: false,
    isOverBudget: false,
    ...overrides,
  };
}

describe("garageSlots", () => {
  it("returns seven empty boxes and an empty budget bar for an empty lineup", () => {
    const layout = garageSlots(summary(), 100);

    expect(layout.driverSlots).toHaveLength(5);
    expect(layout.constructorSlots).toHaveLength(2);
    expect(layout.driverSlots.every((slot) => slot.asset === null)).toBe(true);
    expect(layout.constructorSlots.every((slot) => slot.asset === null)).toBe(true);
    expect(layout.budget).toEqual({
      spentWidth: 0,
      overWidth: 0,
      budgetLineAt: 1,
      isOver: false,
    });
  });

  it("fills every box in a full lineup under budget", () => {
    const drivers = [
      asset("driver", "d1", "Driver One", "#111111"),
      asset("driver", "d2", "Driver Two", null),
      asset("driver", "d3", "Driver Three", null),
      asset("driver", "d4", "Driver Four", null),
      asset("driver", "d5", "Driver Five", null),
    ];
    const constructors = [
      asset("constructor", "c1", "Team One", "#222222"),
      asset("constructor", "c2", "Team Two", null),
    ];
    const layout = garageSlots(summary({ drivers, constructors, totalPrice: 80 }), 100);

    expect(layout.driverSlots.map((slot) => slot.asset?.id)).toEqual(["d1", "d2", "d3", "d4", "d5"]);
    expect(layout.constructorSlots.map((slot) => slot.asset?.id)).toEqual(["c1", "c2"]);
    expect(layout.budget).toEqual({
      spentWidth: 0.8,
      overWidth: 0,
      budgetLineAt: 1,
      isOver: false,
    });
  });

  it("stretches the track past the budget line for a lineup that runs over", () => {
    const layout = garageSlots(summary({ totalPrice: 120 }), 100);

    // The track stretches to the lineup's cost, so the budget line moves in
    // to 100 / 120 of the way along and the overspend fills the rest.
    expect(layout.budget).toEqual({
      spentWidth: 0.833,
      overWidth: 0.167,
      budgetLineAt: 0.833,
      isOver: true,
    });
  });

  it("leaves the second constructor box empty when only one is picked", () => {
    const drivers = [
      asset("driver", "d1", "Driver One", null),
      asset("driver", "d2", "Driver Two", null),
      asset("driver", "d3", "Driver Three", null),
      asset("driver", "d4", "Driver Four", null),
      asset("driver", "d5", "Driver Five", null),
    ];
    const constructors = [asset("constructor", "c1", "Team One", null)];
    const layout = garageSlots(summary({ drivers, constructors, totalPrice: 60 }), 100);

    expect(layout.driverSlots.every((slot) => slot.asset !== null)).toBe(true);
    expect(layout.constructorSlots[0].asset?.id).toBe("c1");
    expect(layout.constructorSlots[1].asset).toBeNull();
  });
});

describe("normaliseTeamColor", () => {
  it("passes through a color that already has a leading #", () => {
    expect(normaliseTeamColor("#F5A623")).toBe("#F5A623");
  });

  it("adds a leading # to a bare hex string", () => {
    expect(normaliseTeamColor("F5A623")).toBe("#F5A623");
  });

  it("treats null as no colour", () => {
    expect(normaliseTeamColor(null)).toBeNull();
  });
});
