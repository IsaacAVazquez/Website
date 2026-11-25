import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { ScorePoolsClient } from "../score-pools-client";
import { league, resetStore } from "./fixtures/scorePoolsTestData";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SERVER_NOW = new Date("2026-08-01T12:00:00.000Z");

function makeElement() {
  return (
    <ScorePoolsClient
      snapshot={{ generatedAt: "2026-08-01T11:30:00.000Z", leagues: [league()] }}
      initialFixtureId={null}
    />
  );
}

describe("ScorePoolsClient hydration", () => {
  beforeEach(resetStore);
  afterEach(() => {
    jest.useRealTimers();
    resetStore();
  });

  it("keeps the data age out of the server HTML, so a later browser clock hydrates cleanly", async () => {
    jest.useFakeTimers().setSystemTime(SERVER_NOW);
    const html = renderToString(makeElement());
    expect(html).toContain("August 1, 2026");
    expect(html).not.toContain("30m ago");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    // The browser hydrates a minute later, where the age reads 31m and not 30m.
    jest.setSystemTime(SERVER_NOW.getTime() + 60_000);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const recoverable: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, makeElement(), {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });

    expect(recoverable).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Data as of 31m ago");

    errorSpy.mockRestore();
    container.remove();
  });
});
