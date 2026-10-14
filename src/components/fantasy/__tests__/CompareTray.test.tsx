import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { useCompareTray } from "@/hooks/useCompareTray";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { FANTASY_COMPARE_STORAGE_KEY } from "@/lib/fantasyLocal";
import type { Player } from "@/types";

import { CompareTray } from "../CompareTray";

const currentPlayer: Player = {
  id: "current-player",
  name: "Current Player",
  team: "ATL",
  position: "RB",
  averageRank: 1,
  standardDeviation: 1,
};

const resolvePlayer = (id: string) => (id === currentPlayer.id ? currentPlayer : undefined);

function CompareCapacityHarness({ playerDataReady }: { playerDataReady: boolean }) {
  const compare = useCompareTray();
  const selected = compare.inCompare(currentPlayer.id);

  return (
    <>
      <button
        type="button"
        disabled={!selected && compare.isFull}
        onClick={() => compare.toggle(currentPlayer.id)}
      >
        Pin current player
      </button>
      <CompareTray
        resolvePlayer={resolvePlayer}
        playerDataReady={playerDataReady}
      />
    </>
  );
}

describe("CompareTray persisted IDs", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("waits for player data, then prunes stale IDs and releases compare capacity", async () => {
    const staleIds = ["old-1", "old-2", "old-3"];
    window.localStorage.setItem(FANTASY_COMPARE_STORAGE_KEY, JSON.stringify(staleIds));

    const { rerender } = render(<CompareCapacityHarness playerDataReady={false} />);
    expect(screen.getByRole("button", { name: "Pin current player" })).toBeDisabled();
    expect(JSON.parse(window.localStorage.getItem(FANTASY_COMPARE_STORAGE_KEY) ?? "[]"))
      .toEqual(staleIds);

    rerender(<CompareCapacityHarness playerDataReady />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Pin current player" })).toBeEnabled()
    );
    expect(JSON.parse(window.localStorage.getItem(FANTASY_COMPARE_STORAGE_KEY) ?? "[]"))
      .toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Pin current player" }));
    expect(screen.getByText("Current Player")).toBeInTheDocument();
  });
});

const pinned: Player[] = [
  { id: "wr-1", name: "Alpha Receiver", team: "CIN", position: "WR", averageRank: 1, rankEcr: 1, standardDeviation: 1 },
  { id: "rb-1", name: "Bravo Back", team: "DET", position: "RB", averageRank: 2, rankEcr: 2, standardDeviation: 1 },
  { id: "te-1", name: "Charlie End", team: "LV", position: "TE", averageRank: 3, rankEcr: 3, standardDeviation: 1 },
];
const resolvePinned = (id: string) => pinned.find((player) => player.id === id);

function pin(count: number) {
  window.localStorage.setItem(
    FANTASY_COMPARE_STORAGE_KEY,
    JSON.stringify(pinned.slice(0, count).map((player) => player.id))
  );
  return render(<CompareTray resolvePlayer={resolvePinned} playerDataReady />);
}

const removeButton = (name: string) => screen.getByRole("button", { name: `Remove ${name} from compare` });

describe("CompareTray names and focus", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("names the band and every control in it", () => {
    pin(3);

    const band = screen.getByRole("group", { name: "Compare" });
    expect(
      within(band)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label") ?? button.textContent)
    ).toEqual([
      "Remove Alpha Receiver from compare",
      "Remove Bravo Back from compare",
      "Remove Charlie End from compare",
      "Clear compare",
      "Compare 3",
      "Minimize the compare tray",
    ]);
    // The visible word stays inside the name a screen reader hears.
    expect(within(band).getByRole("button", { name: "Clear compare" })).toHaveTextContent("Clear");
  });

  it("moves focus to the pin that takes a removed pin's place", async () => {
    pin(3);

    fireEvent.click(removeButton("Bravo Back"));
    await waitFor(() => expect(removeButton("Charlie End")).toHaveFocus());
    expect(screen.queryByText("Bravo Back")).not.toBeInTheDocument();
  });

  it("moves focus to the pin before it when the last pin is removed", async () => {
    pin(3);

    fireEvent.click(removeButton("Charlie End"));
    await waitFor(() => expect(removeButton("Bravo Back")).toHaveFocus());
  });

  it("moves focus to the pill on minimize and to the Compare button on expand", async () => {
    pin(3);

    fireEvent.click(screen.getByRole("button", { name: "Minimize the compare tray" }));
    const pill = await screen.findByRole("button", { name: "Compare 3, show the tray" });
    await waitFor(() => expect(pill).toHaveFocus());
    expect(screen.queryByRole("group", { name: "Compare" })).not.toBeInTheDocument();

    fireEvent.click(pill);
    await waitFor(() => expect(screen.getByRole("button", { name: "Compare 3" })).toHaveFocus());
  });

  it("moves focus to Clear on expand when Compare is disabled at one pin", async () => {
    pin(1);

    fireEvent.click(screen.getByRole("button", { name: "Minimize the compare tray" }));
    fireEvent.click(await screen.findByRole("button", { name: "Compare 1, show the tray" }));

    expect(screen.getByRole("button", { name: "Compare 1" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Clear compare" })).toHaveFocus());
  });

  it("moves focus to the pin that is left when a remove in the modal closes it", async () => {
    pin(2);

    fireEvent.click(screen.getByRole("button", { name: "Compare 2" }));
    const dialog = screen.getByRole("dialog", { name: "Compare players" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove Alpha Receiver from compare" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(removeButton("Bravo Back")).toHaveFocus());
  });

  it("keeps focus inside the modal on the next player's remove button at three players", async () => {
    pin(3);

    fireEvent.click(screen.getByRole("button", { name: "Compare 3" }));
    const dialog = screen.getByRole("dialog", { name: "Compare players" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove Alpha Receiver from compare" }));

    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Remove Bravo Back from compare" })).toHaveFocus()
    );
    expect(screen.getByRole("dialog", { name: "Compare players" })).toBeInTheDocument();
  });
});

/**
 * A page around the tray: a row's button the user was on before coming down
 * to the tray, and the site's main, which takes focus for the skip link.
 */
function Page({ row = "enabled" }: { row?: "enabled" | "disabled" | "gone" }) {
  return (
    <main id="main-content" tabIndex={-1}>
      {row === "gone" ? null : (
        <button type="button" disabled={row === "disabled"}>
          Open Alpha Receiver details
        </button>
      )}
      <CompareTray resolvePlayer={resolvePinned} playerDataReady pruneUnresolvedIds={false} />
    </main>
  );
}

function pinIds(ids: string[]) {
  window.localStorage.setItem(FANTASY_COMPARE_STORAGE_KEY, JSON.stringify(ids));
}

describe("CompareTray hands focus back when it empties itself", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  afterEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  const rowButton = () => screen.getByRole("button", { name: "Open Alpha Receiver details" });

  it("returns focus to the element the user was on before the tray after Clear compare", async () => {
    pinIds(["wr-1", "rb-1"]);
    render(<Page />);
    rowButton().focus();

    const clear = screen.getByRole("button", { name: "Clear compare" });
    clear.focus();
    fireEvent.click(clear);

    await waitFor(() => expect(screen.queryByRole("group", { name: "Compare" })).not.toBeInTheDocument());
    await waitFor(() => expect(rowButton()).toHaveFocus());
  });

  it("returns focus there after the last pin is removed", async () => {
    pinIds(["wr-1"]);
    render(<Page />);
    rowButton().focus();

    const remove = removeButton("Alpha Receiver");
    remove.focus();
    fireEvent.click(remove);

    await waitFor(() => expect(screen.queryByRole("group", { name: "Compare" })).not.toBeInTheDocument());
    await waitFor(() => expect(rowButton()).toHaveFocus());
  });

  it("returns focus there after Clear compare on pins that belong to another board", async () => {
    pinIds(["other-1", "other-2"]);
    render(<Page />);
    rowButton().focus();

    expect(screen.getByRole("status")).toHaveTextContent("2 players are pinned on another fantasy board.");
    fireEvent.click(screen.getByRole("button", { name: "Clear compare" }));

    await waitFor(() => expect(rowButton()).toHaveFocus());
  });

  it("does not count the tray's own controls, or the modal it opens, as where the user was", async () => {
    pinIds(["wr-1", "rb-1"]);
    render(<Page />);
    rowButton().focus();

    // Through the tray and the modal and back, then Clear.
    const open = screen.getByRole("button", { name: "Compare 2" });
    open.focus();
    fireEvent.click(open);
    within(screen.getByRole("dialog", { name: "Compare players" })).getByRole("button", { name: "Close" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    screen.getByRole("button", { name: "Minimize the compare tray" }).focus();
    fireEvent.click(screen.getByRole("button", { name: "Clear compare" }));

    await waitFor(() => expect(rowButton()).toHaveFocus());
  });

  it("falls back to the page's main when that element has left the document", async () => {
    pinIds(["wr-1", "rb-1"]);
    const { rerender } = render(<Page />);
    rowButton().focus();
    rerender(<Page row="gone" />);

    fireEvent.click(screen.getByRole("button", { name: "Clear compare" }));

    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
  });

  it("falls back to the page's main when that element can no longer take focus", async () => {
    pinIds(["wr-1", "rb-1"]);
    const { rerender } = render(<Page />);
    rowButton().focus();
    rerender(<Page row="disabled" />);

    fireEvent.click(screen.getByRole("button", { name: "Clear compare" }));

    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
    expect(document.body).not.toHaveFocus();
  });

  it("falls back to the page's main when nothing outside the tray ever held focus", async () => {
    pinIds(["wr-1"]);
    render(<Page row="gone" />);

    fireEvent.click(removeButton("Alpha Receiver"));

    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
  });
});
