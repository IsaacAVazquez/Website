import { createDefaultInput } from "../defaults";
import { parseRentScenarios, rentSensitivity } from "../scenarios";

it("rejects malformed saved scenarios and bounds restored inputs", () => {
  expect(parseRentScenarios("null")).toEqual([]);
  const saved = parseRentScenarios(
    JSON.stringify([
      {
        id: "one",
        name: " Home ",
        input: { ...createDefaultInput(), mortgageRatePercent: 100 },
      },
    ]),
  );
  expect(saved[0].name).toBe("Home");
  expect(saved[0].input.mortgageRatePercent).toBe(25);
});

it("varies one assumption at a time without changing the source input", () => {
  const input = createDefaultInput();
  const rows = rentSensitivity(input);
  expect(rows).toHaveLength(9);
  expect(
    rows
      .filter((row) => row.field === "mortgageRatePercent")
      .map((row) => row.value),
  ).toEqual([6.4, 7.4, 8.4]);
  expect(input.mortgageRatePercent).toBe(7.4);
  expect(rows.every((row) => Number.isFinite(row.delta))).toBe(true);
});
