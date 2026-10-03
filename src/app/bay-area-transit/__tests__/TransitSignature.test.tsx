import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { TransitStationBoard } from "@/types/bayAreaTransit";
import { TransitSignature, upcomingDepartures } from "../TransitSignature";

const station = (id: string, abbr: string, lat: number, lon: number) =>
  ({ id, abbr, name: `${abbr} station`, latitude: lat, longitude: lon, city: "SF", lines: ["Yellow"] }) as never;
const stations = [station("s1", "EMBR", 37.79, -122.39), station("s2", "MONT", 37.78, -122.4)];
const lines = [{ id: "y", colorName: "Yellow", hexColor: "#ffe800", originAbbr: "EMBR", destinationAbbr: "MONT", stationCount: 2 }] as never;
const board = (delay: number, status = "fresh") =>
  ({
    station: stations[0],
    departures: [{ destination: "Antioch", minutes: 4, delaySeconds: delay, colorName: "Yellow", hexColor: "#ffe800", platform: "2", direction: "North", cars: 8, bikesAllowed: true }],
    status,
  }) as never;

function renderSignature(props: Partial<Parameters<typeof TransitSignature>[0]> = {}) {
  return render(
    <TransitSignature
      stations={stations}
      lines={lines}
      selectedStation={stations[0]}
      stationBoard={board(0)}
      isLoading={false}
      error={null}
      onSelect={() => {}}
      onRetry={() => {}}
      {...props}
    />,
  );
}

it("keeps the station dots out of the tab order, since the station list is the keyboard path", () => {
  const { container } = renderSignature();
  const svg = container.querySelector('svg[role="img"]')!;
  expect(svg.querySelectorAll("[tabindex]")).toHaveLength(0);
});

it("still selects a station from a pointer click on its dot", () => {
  const onSelect = jest.fn();
  const { container } = renderSignature({ onSelect });
  fireEvent.click(container.querySelectorAll('svg[role="img"] g')[1]);
  expect(onSelect).toHaveBeenCalledWith("s2");
});

it("shows a late train's delay on the platform board", () => {
  renderSignature({ stationBoard: board(180) });
  expect(screen.getByText(/3 min late/i)).toBeInTheDocument();
});

it("warns on the board when departures come from the last good snapshot", () => {
  renderSignature({ departuresStatus: "stale-fallback" });
  expect(screen.getByText(/last good snapshot/i)).toBeInTheDocument();
});

it("says so on the board when BART has no departures to give", () => {
  renderSignature({ departuresStatus: "unavailable" });
  expect(screen.getByText(/departures are unavailable/i)).toBeInTheDocument();
});

/** A board in the shape the station route serves. */
function servedBoard(
  minutes: Array<number | null>,
  generatedAt: string
): TransitStationBoard {
  return {
    id: "embr",
    abbr: "EMBR",
    name: "Embarcadero",
    departures: minutes.map((value) => ({
      destination: "Antioch",
      destinationAbbr: "ANTC",
      minutes: value,
      platform: "2",
      direction: "North",
      length: 8,
      colorName: "YELLOW",
      hexColor: "#ffff33",
      delaySeconds: 0,
      bikesAllowed: true,
    })),
    generatedAt,
    status: "fresh",
  };
}

const READ_AT = "2026-09-27T17:14:27.469Z";
const minutesAfterRead = (minutes: number, seconds = 0) =>
  Date.parse(READ_AT) + minutes * 60_000 + seconds * 1_000;

describe("upcomingDepartures", () => {
  it("counts the minutes from now instead of from when the board was read", () => {
    const board = servedBoard([4, 12, 31], READ_AT);

    expect(
      upcomingDepartures(board, minutesAfterRead(3, 59)).map((d) => d.minutes)
    ).toEqual([1, 9, 28]);
  });

  it("drops a train whose time has passed and keeps one that is due now", () => {
    const board = servedBoard([null, 2, 5, 12], READ_AT);

    expect(
      upcomingDepartures(board, minutesAfterRead(5)).map((d) => d.minutes)
    ).toEqual([0, 7]);
  });

  it("empties a board that is older than its last train", () => {
    // The committed 10:14 AM board as the page served it at 12:23 PM.
    const board = servedBoard([null, 7, 27, 47], READ_AT);

    expect(upcomingDepartures(board, minutesAfterRead(129))).toEqual([]);
  });

  it("leaves the board alone inside the first minute", () => {
    const board = servedBoard([null, 4], READ_AT);

    expect(upcomingDepartures(board, minutesAfterRead(0, 59))).toBe(
      board.departures
    );
  });

  it("leaves the board alone when the age cannot be trusted", () => {
    const behind = servedBoard([4], READ_AT);
    const unreadable = servedBoard([4], "");

    expect(upcomingDepartures(behind, minutesAfterRead(-10))).toBe(
      behind.departures
    );
    expect(upcomingDepartures(unreadable, minutesAfterRead(10))).toBe(
      unreadable.departures
    );
  });
});

describe("the platform board's clock", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("adjusts the minutes for the board's age once it has mounted", () => {
    jest.useFakeTimers({ now: minutesAfterRead(5) });
    renderSignature({ stationBoard: servedBoard([4, 12], READ_AT) });

    expect(screen.getByText("7 min")).toBeInTheDocument();
    expect(screen.queryByText("4 min")).not.toBeInTheDocument();
    expect(screen.queryByText("12 min")).not.toBeInTheDocument();
  });

  it("keeps counting down while the page stays open", () => {
    jest.useFakeTimers({ now: minutesAfterRead(0) });
    renderSignature({ stationBoard: servedBoard([3], READ_AT) });
    expect(screen.getByText("3 min")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
    });

    expect(screen.getByText("1 min")).toBeInTheDocument();
  });

  // The server has no viewer clock to read, so it prints the board as it was
  // read, and the first client render has to print the same thing.
  it("prints the same minutes on the server whatever the time is", () => {
    const signature = (
      <TransitSignature
        stations={stations}
        lines={lines}
        selectedStation={stations[0]}
        stationBoard={servedBoard([4, 12], READ_AT)}
        isLoading={false}
        error={null}
        onSelect={() => {}}
        onRetry={() => {}}
      />
    );

    jest.useFakeTimers({ now: minutesAfterRead(0) });
    const early = renderToString(signature);
    jest.setSystemTime(minutesAfterRead(90));
    const late = renderToString(signature);

    expect(late).toBe(early);
    expect(early).toContain("4 min");
    expect(early).toContain("12 min");
  });
});

describe("an empty platform board", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("says no trains are scheduled when BART's live answer has none", () => {
    renderSignature({ stationBoard: servedBoard([], READ_AT) });

    expect(
      screen.getByText("No trains are scheduled at EMBR station right now.")
    ).toBeInTheDocument();
  });

  it("keeps the snapshot wording when the empty board is the fallback copy", () => {
    renderSignature({
      stationBoard: servedBoard([], READ_AT),
      departuresStatus: "stale-fallback",
    });

    expect(
      screen.getByText("No upcoming departures in this snapshot for EMBR station.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/no trains are scheduled/i)).not.toBeInTheDocument();
  });

  it("keeps the snapshot wording when every train on an old board has left", () => {
    jest.useFakeTimers({ now: minutesAfterRead(129) });
    renderSignature({ stationBoard: servedBoard([null, 7, 47], READ_AT) });

    expect(
      screen.getByText("No upcoming departures in this snapshot for EMBR station.")
    ).toBeInTheDocument();
  });
});

describe("the drawn map's lines", () => {
  const sequenced = [
    { id: "y", colorName: "Yellow", hexColor: "#ffe800", stationSequence: ["EMBR", "MONT"] },
    { id: "r", colorName: "Red", hexColor: "#ff0000", stationSequence: ["MONT", "EMBR"] },
  ] as never;
  const stroke = (container: HTMLElement, hex: string) =>
    container.querySelector(`svg[role="img"] line[stroke="${hex}"]`)!;

  it("sets lines that share track side by side over one ink casing", () => {
    const { container } = renderSignature({ lines: sequenced });
    expect(container.querySelectorAll("line.c97-transit-casing")).toHaveLength(1);
    const yellow = stroke(container, "#ffe800");
    const red = stroke(container, "#ff0000");
    expect(yellow).toBeInTheDocument();
    expect(red).toBeInTheDocument();
    expect(yellow.getAttribute("x1")).not.toBe(red.getAttribute("x1"));
  });

  it("dims the other lines when a line button is pressed, and undoes it on a second press", () => {
    const { container } = renderSignature({ lines: sequenced });
    const yellow = screen.getByRole("button", { name: "Yellow" });
    fireEvent.click(yellow);
    expect(yellow).toHaveAttribute("aria-pressed", "true");
    expect(stroke(container, "#ff0000")).toHaveAttribute("opacity", "0.2");
    expect(stroke(container, "#ffe800")).toHaveAttribute("opacity", "1");
    fireEvent.click(yellow);
    fireEvent.mouseLeave(yellow);
    expect(stroke(container, "#ff0000")).toHaveAttribute("opacity", "1");
  });

  it("shows a departure's line from its row on the board", () => {
    const { container } = renderSignature({ lines: sequenced });
    fireEvent.click(screen.getByRole("button", { name: /antioch/i }));
    expect(stroke(container, "#ff0000")).toHaveAttribute("opacity", "0.2");
  });
});

describe("the board's rows", () => {
  it("print the line, platform, and car count under the destination", () => {
    renderSignature({ stationBoard: servedBoard([5], new Date().toISOString()) });
    expect(screen.getByText("Yellow line · Platform 2 · 8 cars")).toBeInTheDocument();
  });

  it("read as one sentence to a screen reader, line and platform included", () => {
    renderSignature({ stationBoard: servedBoard([5], new Date().toISOString()) });
    expect(
      screen.getByRole("button", {
        name: "Yellow line to Antioch, in 5 min, platform 2, 8 cars. Show this line on the map.",
      })
    ).toBeInTheDocument();
  });

  it("say when BART's times were read", () => {
    renderSignature({ stationBoard: servedBoard([5], "2026-10-03T21:18:00Z") });
    expect(screen.getByText(/read from bart oct 3, 2:18/i)).toBeInTheDocument();
  });
});

it("names a line button by its route as well as its colour", () => {
  renderSignature({
    lines: [{ id: "y", colorName: "Yellow", hexColor: "#ffe800", name: "Antioch to SFO/Millbrae" }] as never,
  });
  expect(
    screen.getByRole("button", { name: "Yellow line, Antioch to SFO/Millbrae" })
  ).toBeInTheDocument();
});
