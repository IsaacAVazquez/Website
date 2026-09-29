import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ArcadeClient from "../ArcadeClient";
import { KONAMI_SEQUENCE } from "@/components/catalog97/konami";

const HISCORE_KEY = "arcade-reactor-hiscore-v1";

function pressKonami() {
  act(() => {
    KONAMI_SEQUENCE.forEach((key) => fireEvent.keyDown(window, { key }));
  });
}

/** Renders the cabinet and lets the boot text type itself out. */
function boot() {
  render(<ArcadeClient />);
  act(() => jest.advanceTimersByTime(5000));
}

function start() {
  fireEvent.click(screen.getByRole("button", { name: /START GAME|RETRY/ }));
}

/** The first round lights 400ms after the start, and this hits its target. */
function scoreOnce() {
  act(() => jest.advanceTimersByTime(400));
  fireEvent.pointerDown(screen.getByRole("button", { name: /target live/ }));
}

/** Lets every round time out until the lives are gone. */
function runOutTheClock() {
  act(() => jest.advanceTimersByTime(90_000));
}

const lives = () => screen.getByText("LIVES").nextElementSibling;
const gameOver = () => screen.getByText("GAME OVER").nextElementSibling;

describe("ArcadeClient", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
  });

  it("plays a normal run on three lives and saves its score", () => {
    boot();
    start();
    expect(lives()).toHaveTextContent("♥♥♥");

    scoreOnce();
    runOutTheClock();

    expect(gameOver()).toHaveTextContent("You scored 10. New high score, and the cabinet remembers.");
    expect(window.localStorage.getItem(HISCORE_KEY)).toBe("10");
  });

  it("gives 30 lives when the code lands before the run starts", () => {
    boot();
    pressKonami();
    expect(screen.getByRole("status")).toHaveTextContent("> cheat accepted. 30 lives.");

    start();
    expect(lives()).toHaveTextContent("♥ x30");
  });

  it("gives 30 lives when the code lands in the middle of a run", () => {
    boot();
    start();
    act(() => jest.advanceTimersByTime(400));

    pressKonami();
    expect(lives()).toHaveTextContent("♥ x30");
    expect(screen.getByRole("status")).toHaveTextContent("> cheat accepted. 30 lives.");
  });

  it("keeps a 30 life run off the saved high score", () => {
    window.localStorage.setItem(HISCORE_KEY, "5");
    boot();
    pressKonami();
    start();

    scoreOnce();
    runOutTheClock();

    expect(gameOver()).toHaveTextContent(
      "You scored 10 with 30 lives, so the cabinet isn't counting it. High score to beat: 5.",
    );
    expect(window.localStorage.getItem(HISCORE_KEY)).toBe("5");
  });

  it("goes back to three lives on the run after", () => {
    boot();
    pressKonami();
    start();
    runOutTheClock();

    start();
    expect(lives()).toHaveTextContent("♥♥♥");
    expect(screen.getByRole("status")).not.toHaveTextContent("cheat accepted");
  });

  it("leaves the code alone while someone is typing in a field", () => {
    boot();
    const input = document.body.appendChild(document.createElement("input"));
    act(() => {
      KONAMI_SEQUENCE.forEach((key) => fireEvent.keyDown(input, { key }));
    });
    input.remove();

    start();
    expect(lives()).toHaveTextContent("♥♥♥");
  });
});
