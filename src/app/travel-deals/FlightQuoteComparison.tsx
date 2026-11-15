"use client";

import { useState } from "react";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import {
  FLIGHT_QUOTES_KEY,
  parseFlightQuotes,
  flightQuoteCost,
  type FlightQuote,
} from "@/lib/flightQuotes";
import { prefixedId } from "@/lib/utils";
import "@/components/project-workflows.css";

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
const EMPTY = {
  label: "",
  origin: "",
  destination: "",
  departure: "",
  returnDate: "",
  travelers: 1,
  stops: 0,
  payment: "cash" as FlightQuote["payment"],
  fare: 0,
  fees: 0,
  baggage: 0,
  points: 0,
};
export function FlightQuoteComparison() {
  const store = useBrowserRecord(FLIGHT_QUOTES_KEY, parseFlightQuotes);
  const [draft, setDraft] = useState(EMPTY);
  const [valuation, setValuation] = useState(1.4);
  const [message, setMessage] = useState("");
  const patch = (key: keyof typeof EMPTY, value: string | number) =>
    setDraft((current) => ({ ...current, [key]: value }));
  function save() {
    const quote = parseFlightQuotes(
      JSON.stringify([{ ...draft, id: prefixedId("flight") }]),
    )[0];
    if (!quote) {
      setMessage(
        "Enter a route, valid travel dates, and nonnegative costs. A points booking needs a points amount.",
      );
      return;
    }
    let saved = false;
    store.update((latest) => {
      if (latest.length >= 30) return latest;
      saved = true;
      return [...latest, quote];
    });
    setMessage(
      saved
        ? `Saved ${quote.label}.`
        : "The limit is 30 quotes. Remove one to save another.",
    );
    if (saved) setDraft((current) => ({ ...current, label: "" }));
  }
  return (
    <details className="project-workflow">
      <summary>Save and compare flight quotes</summary>
      <p>
        Enter prices you found for the entire party and the full itinerary. Keep
        the base fare, taxes and booking fees, and baggage separate so each cost
        is counted once.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="project-workflow-fields">
          {(
            [
              ["label", "Quote name or airline"],
              ["origin", "Origin airport or city"],
              ["destination", "Destination airport or city"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required
                className="c97-field"
                maxLength={100}
                value={draft[key]}
                onChange={(event) => patch(key, event.target.value)}
              />
            </label>
          ))}
          <label>
            Outbound date
            <input
              required
              className="c97-field"
              type="date"
              value={draft.departure}
              onChange={(event) => patch("departure", event.target.value)}
            />
          </label>
          <label>
            Return date, if any
            <input
              className="c97-field"
              type="date"
              min={draft.departure || undefined}
              value={draft.returnDate}
              onChange={(event) => patch("returnDate", event.target.value)}
            />
          </label>
          <label>
            People in quote
            <input
              required
              className="c97-field"
              type="number"
              min={1}
              max={12}
              step={1}
              value={draft.travelers}
              onChange={(event) =>
                patch("travelers", Number(event.target.value))
              }
            />
          </label>
          <label>
            Stops each way, most stops
            <input
              required
              className="c97-field"
              type="number"
              min={0}
              max={5}
              step={1}
              value={draft.stops}
              onChange={(event) => patch("stops", Number(event.target.value))}
            />
          </label>
          <label>
            Payment method
            <select
              className="c97-field"
              value={draft.payment}
              onChange={(event) => patch("payment", event.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="points">Points plus cash fees</option>
            </select>
          </label>
          {draft.payment === "cash" ? (
            <label>
              Base fare for party, USD
              <input
                required
                className="c97-field"
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                value={draft.fare}
                onChange={(event) => patch("fare", Number(event.target.value))}
              />
            </label>
          ) : (
            <label>
              Points for party
              <input
                required
                className="c97-field"
                type="number"
                min={1}
                max={100000000}
                step={1}
                value={draft.points}
                onChange={(event) =>
                  patch("points", Number(event.target.value))
                }
              />
            </label>
          )}
          <label>
            Taxes and booking fees for party, USD
            <input
              required
              className="c97-field"
              type="number"
              min={0}
              max={1000000}
              step="0.01"
              value={draft.fees}
              onChange={(event) => patch("fees", Number(event.target.value))}
            />
          </label>
          <label>
            Baggage for party, USD
            <input
              required
              className="c97-field"
              type="number"
              min={0}
              max={1000000}
              step="0.01"
              value={draft.baggage}
              onChange={(event) => patch("baggage", Number(event.target.value))}
            />
          </label>
        </div>
        <button
          className="c97-btn"
          disabled={store.value.length >= 30}
          type="submit"
        >
          Save flight quote
        </button>
      </form>
      <div className="project-workflow-fields">
        <label>
          Your value per point, cents
          <input
            className="c97-field"
            type="number"
            min={0}
            max={20}
            step="0.1"
            value={valuation}
            onChange={(event) =>
              setValuation(
                Math.min(20, Math.max(0, Number(event.target.value))),
              )
            }
          />
        </label>
      </div>
      <p>
        The starting 1.4 cents per point is the tool’s estimate. Enter your own
        value. Cash outlay is the amount paid; the comparison cost adds your
        value of the points used. Compare quotes for matching routes, dates, and
        party sizes.
      </p>
      {!store.value.length ? (
        <p>No saved flight quotes yet.</p>
      ) : (
        <div
          className="project-workflow-scroll"
          tabIndex={0}
          role="region"
          aria-label="Flight quote comparison"
        >
          <table>
            <caption>Saved flight options, totals for the whole party</caption>
            <thead>
              <tr>
                <th scope="col">Quote</th>
                <th scope="col">Route and dates</th>
                <th scope="col">People / stops</th>
                <th scope="col">Payment</th>
                <th scope="col">Cash outlay</th>
                <th scope="col">Comparison cost</th>
                <th scope="col">Manage</th>
              </tr>
            </thead>
            <tbody>
              {store.value.map((quote) => {
                const cost = flightQuoteCost(quote, valuation);
                return (
                  <tr key={quote.id}>
                    <th scope="row">{quote.label}</th>
                    <td>
                      {quote.origin} to {quote.destination}
                      <small>
                        {quote.departure}
                        {quote.returnDate
                          ? ` to ${quote.returnDate}`
                          : " · one way"}
                      </small>
                    </td>
                    <td>
                      {quote.travelers} / {quote.stops}
                    </td>
                    <td>
                      {quote.payment === "points"
                        ? `${quote.points.toLocaleString("en-US")} points`
                        : "Cash"}
                      <small>
                        {money(quote.fees)} fees + {money(quote.baggage)}{" "}
                        baggage
                      </small>
                    </td>
                    <td>{money(cost.cash)}</td>
                    <td>{money(cost.valuedTotal)}</td>
                    <td>
                      <button
                        className="c97-btn-ghost"
                        type="button"
                        onClick={() => {
                          setDraft(quote);
                          setMessage(
                            `Loaded ${quote.label}. Saving creates another quote.`,
                          );
                        }}
                      >
                        Copy {quote.label}
                      </button>
                      <button
                        className="c97-btn-ghost"
                        type="button"
                        onClick={() =>
                          store.update((latest) =>
                            latest.filter((item) => item.id !== quote.id),
                          )
                        }
                      >
                        Remove {quote.label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {store.status === "memory-only" && (
        <p role="status">
          Browser storage is unavailable. Quotes last only while this tab is
          open.
        </p>
      )}
    </details>
  );
}
