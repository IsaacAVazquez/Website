import {
  parseF1Prices,
  applyF1Prices,
  parseF1Results,
} from "../fantasyFormula1Records";
import type { FantasyFormula1Asset } from "@/types/fantasyFormula1";

it("uses valid entered prices and recomputes value without changing the model asset", () => {
  const prices = parseF1Prices(
    '{"driver-1":12.5,"driver-2":-1,"constructor-red-bull":25,"constructor":0}',
  );
  expect(prices).toEqual({ "driver-1": 12.5, "constructor-red-bull": 25 });
  const asset = {
    id: "driver-1",
    price: 20,
    projectedPoints: 25,
    valueRating: 12.5,
  } as FantasyFormula1Asset;
  expect(applyF1Prices([asset], prices)[0]).toMatchObject({
    price: 12.5,
    valueRating: 20,
  });
  expect(asset.price).toBe(20);
});
it("rejects invalid race records and keeps an unknown result distinct from zero", () => {
  expect(parseF1Results("null")).toEqual([]);
  const row = {
    id: "one",
    race: "Austin",
    date: "2026-10-25",
    savedAt: "2026-10-23T12:00:00Z",
    sourceAt: "2026-10-23T00:00:00Z",
    assets: Array.from({ length: 7 }, (_, index) => ({
      id: `${index < 5 ? "driver" : "constructor"}-${index}`,
      name: `Pick ${index}`,
      price: 10,
      estimate: 20,
      entered: false,
    })),
    actual: null,
  };
  expect(parseF1Results(JSON.stringify([row]))[0].actual).toBeNull();
  expect(
    parseF1Results(JSON.stringify([{ ...row, actual: 0 }]))[0].actual,
  ).toBe(0);
  expect(
    parseF1Results(JSON.stringify([{ ...row, date: "2026-02-30" }])),
  ).toEqual([]);
  expect(parseF1Results(JSON.stringify([{ ...row, assets: [] }]))).toEqual([]);
});
