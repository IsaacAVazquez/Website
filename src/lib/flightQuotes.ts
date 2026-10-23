import { isRecord } from "./utils";
import { isLocalDateKey } from "./date-formatters";

export const FLIGHT_QUOTES_KEY = "travel-flight-quotes-v1";
export interface FlightQuote {
  id: string;
  label: string;
  origin: string;
  destination: string;
  departure: string;
  returnDate: string;
  travelers: number;
  stops: number;
  payment: "cash" | "points";
  fare: number;
  fees: number;
  baggage: number;
  points: number;
}
const validNumber = (value: unknown, max: number, min = 0): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;
export function parseFlightQuotes(raw: string): FlightQuote[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const ids = new Set<string>();
    return data
      .flatMap((item): FlightQuote[] => {
        if (
          !isRecord(item) ||
          typeof item.id !== "string" ||
          !item.id ||
          item.id.length > 100 ||
          ids.has(item.id)
        )
          return [];
        for (const key of ["label", "origin", "destination"] as const)
          if (
            typeof item[key] !== "string" ||
            !item[key].trim() ||
            item[key].length > 100
          )
            return [];
        if (
          typeof item.departure !== "string" ||
          !isLocalDateKey(item.departure) ||
          typeof item.returnDate !== "string" ||
          (item.returnDate &&
            (!isLocalDateKey(item.returnDate) ||
              item.returnDate < item.departure))
        )
          return [];
        if (
          !validNumber(item.travelers, 12, 1) ||
          !Number.isInteger(item.travelers) ||
          !validNumber(item.stops, 5) ||
          !Number.isInteger(item.stops)
        )
          return [];
        if (item.payment !== "cash" && item.payment !== "points") return [];
        if (
          !validNumber(item.fare, 1_000_000) ||
          !validNumber(item.fees, 1_000_000) ||
          !validNumber(item.baggage, 1_000_000) ||
          !validNumber(item.points, 100_000_000) ||
          !Number.isInteger(item.points) ||
          (item.payment === "points" && item.points === 0)
        )
          return [];
        ids.add(item.id);
        return [
          {
            id: item.id,
            label: (item.label as string).trim(),
            origin: (item.origin as string).trim(),
            destination: (item.destination as string).trim(),
            departure: item.departure,
            returnDate: item.returnDate,
            travelers: item.travelers,
            stops: item.stops,
            payment: item.payment,
            fare: item.fare,
            fees: item.fees,
            baggage: item.baggage,
            points: item.points,
          },
        ];
      })
      .slice(0, 30);
  } catch {
    return [];
  }
}
export function flightQuoteCost(quote: FlightQuote, centsPerPoint: number) {
  const cash =
    Math.round(
      ((quote.payment === "cash" ? quote.fare : 0) +
        quote.fees +
        quote.baggage) *
        100,
    ) / 100;
  const value = validNumber(centsPerPoint, 20) ? centsPerPoint : 0;
  return {
    cash,
    valuedTotal:
      Math.round(
        (cash +
          (quote.payment === "points" ? (quote.points * value) / 100 : 0)) *
          100,
      ) / 100,
  };
}
