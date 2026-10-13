import { fitSpreadScale } from "../spreadScale";

const labels = (scale: ReturnType<typeof fitSpreadScale>) => scale.ticks.map((tick) => tick.label);

describe("fitSpreadScale", () => {
  it("fits ranks 1 to 7 to the three-round floor", () => {
    expect(fitSpreadScale(1, 7)).toEqual({
      min: 1,
      max: 36,
      ticks: [
        { at: 1, label: "R1" },
        { at: 13, label: "R2" },
        { at: 25, label: "R3" },
      ],
    });
  });

  it("fits ranks 19 to 80 with one division of padding to R1 through R8", () => {
    const scale = fitSpreadScale(19, 80, { pad: 1 });
    expect(scale.min).toBe(1);
    expect(scale.max).toBe(96);
    expect(labels(scale)).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"]);
  });

  it("ends a 32-team DST board at 36 and labels it in position ranks", () => {
    const scale = fitSpreadScale(1, 32, { label: (rank) => `DST${rank}` });
    expect(scale.max).toBe(36);
    expect(labels(scale)).toEqual(["DST1", "DST13", "DST25"]);
  });

  it("starts at the division the lowest rank sits in, with no padding below rank 1", () => {
    // Ranks 150 to 165 sit in divisions 12 and 13 (145 to 168). The floor of three adds one on the right.
    expect(fitSpreadScale(150, 165)).toEqual({
      min: 145,
      max: 180,
      ticks: [
        { at: 145, label: "R13" },
        { at: 157, label: "R14" },
        { at: 169, label: "R15" },
      ],
    });
    expect(fitSpreadScale(3, 14, { pad: 2 }).min).toBe(1);
  });

  it("doubles the tick spacing past sixteen divisions and keeps every tick the same width", () => {
    // 1 to 204 is seventeen rounds. Ticks every two rounds need eighteen, so the window ends at 216.
    const scale = fitSpreadScale(1, 204);
    expect(scale.max).toBe(216);
    expect(labels(scale)).toEqual(["R1", "R3", "R5", "R7", "R9", "R11", "R13", "R15", "R17"]);
    expect(scale.ticks.map((tick) => tick.at)).toEqual([1, 25, 49, 73, 97, 121, 145, 169, 193]);
    // Sixteen rounds exactly still print one tick a round.
    expect(fitSpreadScale(1, 192).ticks).toHaveLength(16);
  });

  it("takes the unit and the floor from its options", () => {
    const scale = fitSpreadScale(1, 9, { unit: 10, minDivisions: 4 });
    expect(scale).toEqual({
      min: 1,
      max: 40,
      ticks: [
        { at: 1, label: "R1" },
        { at: 11, label: "R2" },
        { at: 21, label: "R3" },
        { at: 31, label: "R4" },
      ],
    });
  });
});
