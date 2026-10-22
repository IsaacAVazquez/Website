import { parseCommute, commuteDepartures, commuteAdvisories } from "../commute";
import type { TransitDeparture } from "@/types/bayAreaTransit";

it("rejects unknown stations and unsupported saved direction values", () => {
  expect(
    parseCommute(
      JSON.stringify({
        saved: ["embr", "unknown", "embr"],
        from: "embr",
        to: "unknown",
        direction: "constructor",
      }),
      ["embr", "mont"],
    ),
  ).toEqual({ saved: ["embr"], from: "embr", to: "", direction: "" });
});
it("filters the actual departure direction and keeps unscoped alerts", () => {
  const departures = [
    { direction: "North" },
    { direction: "South" },
  ] as TransitDeparture[];
  expect(commuteDepartures(departures, "North")).toEqual([departures[0]]);
  expect(commuteDepartures(departures, "")).toHaveLength(2);
  const alerts = [
    { station: "EMBR" },
    { station: "BART" },
    { station: null },
    { station: "MONT" },
  ];
  expect(commuteAdvisories(alerts, ["EMBR"], ["EMBR", "MONT"])).toHaveLength(3);
});
