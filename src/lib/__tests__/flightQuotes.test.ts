import { parseFlightQuotes, flightQuoteCost } from "../flightQuotes";

const quote = {
  id: "one",
  label: "Direct",
  origin: "SFO",
  destination: "JFK",
  departure: "2026-11-01",
  returnDate: "2026-11-05",
  travelers: 2,
  stops: 0,
  payment: "cash",
  fare: 600,
  fees: 80,
  baggage: 60,
  points: 0,
};
it("keeps dates, party size and payment inputs valid on restore", () => {
  expect(parseFlightQuotes("null")).toEqual([]);
  expect(parseFlightQuotes(JSON.stringify([quote]))).toHaveLength(1);
  expect(
    parseFlightQuotes(JSON.stringify([{ ...quote, departure: "2026-02-30" }])),
  ).toEqual([]);
  expect(
    parseFlightQuotes(JSON.stringify([{ ...quote, returnDate: "2026-10-01" }])),
  ).toEqual([]);
  expect(
    parseFlightQuotes(
      JSON.stringify([{ ...quote, payment: "points", points: 0 }]),
    ),
  ).toEqual([]);
});
it("adds baggage once and keeps points separate from cash outlay", () => {
  const cash = parseFlightQuotes(JSON.stringify([quote]))[0];
  expect(flightQuoteCost(cash, 1.4)).toEqual({ cash: 740, valuedTotal: 740 });
  expect(
    flightQuoteCost({ ...cash, payment: "points", points: 50000 }, 1.4),
  ).toEqual({ cash: 140, valuedTotal: 840 });
});
