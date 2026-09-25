import { crossedScheduledT0, LIFTOFF_GRACE_MS } from "../liftoff";

const NET = Date.parse("2026-09-26T11:56:00Z");

describe("crossedScheduledT0", () => {
  it("fires on the tick that crosses T-0", () => {
    expect(crossedScheduledT0(NET - 400, NET + 600, NET)).toBe(true);
  });

  it("counts landing exactly on T-0 as a crossing", () => {
    expect(crossedScheduledT0(NET - 1000, NET, NET)).toBe(true);
  });

  it("does not fire while still counting down", () => {
    expect(crossedScheduledT0(NET - 2000, NET - 1000, NET)).toBe(false);
  });

  it("does not fire again on later ticks", () => {
    expect(crossedScheduledT0(NET, NET + 1000, NET)).toBe(false);
    expect(crossedScheduledT0(NET + 1000, NET + 2000, NET)).toBe(false);
  });

  it("fires once across a whole run of one-second ticks", () => {
    let fired = 0;
    for (let t = NET - 10_000; t < NET + 10_000; t += 1000) {
      if (crossedScheduledT0(t, t + 1000, NET)) fired += 1;
    }
    expect(fired).toBe(1);
  });

  it("does not fire when the crossing is noticed long after T-0", () => {
    expect(crossedScheduledT0(NET - 1000, NET + LIFTOFF_GRACE_MS + 1, NET)).toBe(false);
  });

  it("does not fire for an unparseable schedule", () => {
    expect(crossedScheduledT0(NET - 1000, NET + 1000, Number.NaN)).toBe(false);
  });
});
