import {
  detectAutoDraftProvider,
  isCandidateEligible,
  normalizeAutoDraftName,
  pageSaysUserIsOnClock,
  readCurrentRound,
  rowMatchesCandidate,
  startAutoDraftController as startController,
  type AutoDraftStatus,
} from "../autodraft-controller";

const ROOM_URLS = {
  espn: "https://fantasy.espn.com/football/draft?leagueId=1&seasonId=2026",
  sleeper: "https://sleeper.com/draft/nfl/111111111111",
};

// DOM fixtures run at localhost, so supply the provider URL separately.
function startAutoDraftController(
  provider: "espn" | "sleeper",
  publish: Parameters<typeof startController>[1],
  options: Parameters<typeof startController>[2] = {},
) {
  const controller = startController(provider, publish, {
    getHref: () => ROOM_URLS[provider], ...options,
  });
  return {
    ...controller,
    handleCommand: (command: Parameters<typeof controller.handleCommand>[0]) =>
      controller.handleCommand({ teams: 12, userTeam: 1, draftOrder: "snake", ...command, roomUrl: command.roomUrl ?? ROOM_URLS[provider] }),
  };
}


describe("autodraft controller", () => {
  it("detects the two supported provider hosts", () => {
    expect(detectAutoDraftProvider("fantasy.espn.com")).toBe("espn");
    expect(detectAutoDraftProvider("sleeper.com")).toBe("sleeper");
    expect(detectAutoDraftProvider("api.sleeper.app")).toBeNull();
  });

  it("normalizes punctuation, accents, and suffixes for exact player matching", () => {
    expect(normalizeAutoDraftName("Brian Thomas Jr.")).toBe("brian thomas");
    expect(normalizeAutoDraftName("Amon-Ra St. Brown")).toBe(
      "amon ra st brown"
    );
  });

  it("requires explicit user-turn language", () => {
    expect(pageSaysUserIsOnClock("You are on the clock")).toBe(true);
    expect(pageSaysUserIsOnClock("It's your turn to pick")).toBe(true);
    expect(pageSaysUserIsOnClock("Team 4 is on the clock")).toBe(false);
    expect(pageSaysUserIsOnClock("Your picks and roster")).toBe(false);
  });

  describe("armed controller", () => {
    const visibleRect = {
      x: 0,
      y: 0,
      width: 240,
      height: 40,
      top: 0,
      right: 240,
      bottom: 40,
      left: 0,
      toJSON: () => ({}),
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest
        .spyOn(HTMLElement.prototype, "getBoundingClientRect")
        .mockReturnValue(visibleRect);
      document.body.innerHTML = `
        <p>You are on the clock</p>
        <input type="search" aria-label="Search players" />
        <div role="row">
          <span>Amon-Ra St. Brown</span>
          <span>DET WR</span>
          <button type="button" aria-label="Draft Amon-Ra St. Brown">Draft</button>
        </div>
      `;
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
      document.body.innerHTML = "";
    });

    it("reports a dry-run candidate without clicking the provider", async () => {
      const statuses: AutoDraftStatus[] = [];
      const button = document.querySelector("button") as HTMLButtonElement;
      const click = jest.spyOn(button, "click");
      const controller = startAutoDraftController("espn", (status) =>
        statuses.push(status)
      );

      await controller.handleCommand({
        type: "FANTASY_AUTODRAFT_ARM",
        provider: "espn",
        live: false,
        pickDelayMs: 1000,
        queue: [
          {
            name: "Amon-Ra St. Brown",
            team: "DET",
            position: "WR",
            rank: 1,
          },
        ],
      });
      await jest.advanceTimersByTimeAsync(5000);

      expect(click).not.toHaveBeenCalled();
      expect(statuses.at(-1)).toMatchObject({
        phase: "dry-run",
        candidate: { name: "Amon-Ra St. Brown" },
      });
      controller.stop();
    });

    it("submits one live pick and does not act twice on the same turn", async () => {
      const statuses: AutoDraftStatus[] = [];
      const button = document.querySelector("button") as HTMLButtonElement;
      const click = jest.spyOn(button, "click");
      const controller = startAutoDraftController("sleeper", (status) =>
        statuses.push(status)
      );

      await controller.handleCommand({
        type: "FANTASY_AUTODRAFT_ARM",
        provider: "sleeper",
        live: true,
        pickDelayMs: 1000,
        queue: [
          {
            name: "Amon-Ra St. Brown",
            team: "DET",
            position: "WR",
            rank: 1,
          },
        ],
      });
      await jest.advanceTimersByTimeAsync(8000);

      expect(click).toHaveBeenCalledTimes(1);
      expect(statuses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ phase: "submitted" }),
        ])
      );
      controller.stop();
    });
  });
});

describe("autodraft eligibility", () => {
  const limits = [{ position: "QB", maximum: 2 }];
  const rules = [
    { round: 14, position: "DST" },
    { round: 15, position: "K" },
  ];
  const qb = { name: "A", team: "X", position: "QB", rank: 1 };
  const kicker = { name: "B", team: "X", position: "K", rank: 2 };
  const wr = { name: "C", team: "X", position: "WR", rank: 3 };

  it("caps a position by the controller's own picks", () => {
    expect(isCandidateEligible(qb, 3, [], limits, rules)).toBe(true);
    expect(isCandidateEligible(qb, 3, [qb, qb], limits, rules)).toBe(false);
  });

  it("holds K and DST for their rounds and blocks everyone else there", () => {
    expect(isCandidateEligible(kicker, 3, [], limits, rules)).toBe(false);
    expect(isCandidateEligible(kicker, 15, [], limits, rules)).toBe(true);
    expect(isCandidateEligible(kicker, 15, [kicker], limits, rules)).toBe(false);
    expect(isCandidateEligible(wr, 15, [], limits, rules)).toBe(false);
    expect(isCandidateEligible(wr, 3, [], limits, rules)).toBe(true);
  });

  it("reads the round from the page and falls back to the pick count", () => {
    expect(readCurrentRound("Round 14 Pick 3", 1, 15)).toBe(14);
    expect(readCurrentRound("no header", 6, 15)).toBe(6);
    expect(readCurrentRound("Round 99", 6, 15)).toBe(6);
  });

  it("requires name, team, and position as whole words and accepts defense nicknames", () => {
    const wrCandidate = { name: "Amon-Ra St. Brown", team: "DET", position: "WR", rank: 1 };
    expect(rowMatchesCandidate("amon ra st brown det wr draft", wrCandidate)).toBe(true);
    expect(rowMatchesCandidate("amon ra st brown detroit wr", wrCandidate)).toBe(false);
    const dst = { name: "Houston Texans", team: "HOU", position: "DST", rank: 2 };
    expect(rowMatchesCandidate("texans d st hou draft", dst)).toBe(true);
    expect(rowMatchesCandidate("pick 4 03 texans hou", dst)).toBe(false);
  });
});

describe("autodraft page matching", () => {
  const visibleRect = {
    x: 0, y: 0, width: 240, height: 40, top: 0, right: 240, bottom: 40, left: 0, toJSON: () => ({}),
  };
  const queue = [{ name: "Amon-Ra St. Brown", team: "DET", position: "WR", rank: 1 }];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(visibleRect);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  async function runLive(): Promise<AutoDraftStatus[]> {
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", (status) => statuses.push(status));
    await controller.handleCommand({
      type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue,
    });
    await jest.advanceTimersByTimeAsync(8000);
    controller.stop();
    return statuses;
  }

  it("never clicks a pick-log entry for a drafted player", async () => {
    document.body.innerHTML = `
      <p>You are on the clock</p>
      <ul><li aria-label="Pick 4.03 Amon-Ra St. Brown DET WR"><span>Amon-Ra St. Brown</span><span>DET WR</span></li></ul>
    `;
    const click = jest.spyOn(HTMLElement.prototype, "click");
    const statuses = await runLive();
    expect(click).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toMatchObject({ phase: "error" });
  });

  it("stops the turn when two rows both offer a draft button for the player", async () => {
    document.body.innerHTML = `
      <p>You are on the clock</p>
      <div role="row"><span>Amon-Ra St. Brown</span><span>DET WR</span><button>Draft</button></div>
      <div role="row"><span>Amon-Ra St. Brown</span><span>DET WR</span><button>Draft</button></div>
    `;
    const click = jest.spyOn(HTMLElement.prototype, "click");
    const statuses = await runLive();
    expect(click).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.message).toMatch(/more than one draft control/);
  });

  it("ignores a wrapper row and clicks only the player's own button", async () => {
    document.body.innerHTML = `
      <p>You are on the clock</p>
      <ul>
        <li><span>Jahmyr Gibbs</span><span>DET RB</span><button id="gibbs">Draft</button></li>
        <li><span>Amon-Ra St. Brown</span><span>DET WR</span><button id="amon">Draft</button></li>
      </ul>
    `;
    const gibbs = jest.spyOn(document.getElementById("gibbs") as HTMLElement, "click");
    const amon = jest.spyOn(document.getElementById("amon") as HTMLElement, "click");
    await runLive();
    expect(gibbs).not.toHaveBeenCalled();
    expect(amon).toHaveBeenCalledTimes(1);
  });

  it("does not turn a dry run into a live click when armed live mid-search", async () => {
    document.body.innerHTML = `
      <p>You are on the clock</p>
      <input type="search" aria-label="Search players" />
      <div role="row"><span>Amon-Ra St. Brown</span><span>DET WR</span><button>Draft</button></div>
    `;
    const click = jest.spyOn(HTMLElement.prototype, "click");
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", (status) => statuses.push(status));
    await controller.handleCommand({
      type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: false, pickDelayMs: 1000, queue,
    });
    // Ticks run every 900ms; the third tick (2700ms) clears the delay and
    // starts the search, which settles for 250ms before reading rows.
    await jest.advanceTimersByTimeAsync(2800);
    expect(statuses.at(-1)?.phase).toBe("searching");
    await controller.handleCommand({
      type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue,
    });
    await jest.advanceTimersByTimeAsync(400);
    expect(click).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.phase).toBe("armed");
    controller.stop();
  });

  it("does not confirm a pick after Stop during the confirmation delay", async () => {
    document.body.innerHTML = `
      <p>You are on the clock</p>
      <div role="row"><span>Amon-Ra St. Brown</span><span>DET WR</span><button>Draft</button></div>
    `;
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", status => statuses.push(status));
    const confirm = jest.fn();
    document.querySelector("button")!.addEventListener("click", () => {
      const dialog = document.createElement("div");
      dialog.setAttribute("role", "dialog");
      dialog.innerHTML = "<button>Confirm</button>";
      dialog.querySelector("button")!.addEventListener("click", confirm);
      document.body.append(dialog);
      void controller.handleCommand({ type: "FANTASY_AUTODRAFT_DISARM", provider: "espn" });
    });
    await controller.handleCommand({
      type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue,
    });
    await jest.advanceTimersByTimeAsync(5000);
    expect(confirm).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.phase).toBe("stopped");
    expect(statuses.some(status => status.phase === "submitted")).toBe(false);
    controller.stop();
  });

  it("searches for an unmounted preferred player before drafting a visible fallback", async () => {
    document.body.innerHTML = `
      <p>You are on the clock</p>
      <input type="search" />
      <div id="results"><div role="row"><span>Fallback Player</span><span>KC WR</span><button>Draft</button></div></div>
    `;
    const input = document.querySelector("input")!;
    const fallback = jest.spyOn(document.querySelector("button")!, "click");
    const preferred = jest.fn();
    input.addEventListener("input", () => {
      if (input.value !== queue[0].name) return;
      document.getElementById("results")!.innerHTML = '<div role="row"><span>Amon-Ra St. Brown</span><span>DET WR</span><button>Draft</button></div>';
      document.querySelector("button")!.addEventListener("click", preferred);
    });
    const controller = startAutoDraftController("espn", () => {});
    await controller.handleCommand({
      type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000,
      queue: [...queue, { name: "Fallback Player", team: "KC", position: "WR", rank: 2 }],
    });
    await jest.advanceTimersByTimeAsync(5000);
    expect(preferred).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
    controller.stop();
  });

  it("disarms after same-document navigation to another provider draft", async () => {
    let href = ROOM_URLS.sleeper;
    document.body.innerHTML = '<p>Waiting for your turn</p>';
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("sleeper", status => statuses.push(status), {getHref: () => href});
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "sleeper", live: true, pickDelayMs: 1000, queue});
    href = "https://sleeper.com/draft/nfl/222222222222";
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const click = jest.spyOn(HTMLElement.prototype, "click");
    await jest.advanceTimersByTimeAsync(5000);
    expect(click).not.toHaveBeenCalled();
    expect(statuses.at(-1)).toMatchObject({phase: "stopped", armed: false});
    controller.stop();
  });

  it("rechecks room identity after the search delay", async () => {
    let href = ROOM_URLS.espn;
    document.body.innerHTML = '<p>You are on the clock</p> <input type="search" /> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const click = jest.spyOn(HTMLElement.prototype, "click");
    const controller = startAutoDraftController("espn", () => {}, {getHref: () => href});
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue});
    await jest.advanceTimersByTimeAsync(2800);
    href = ROOM_URLS.espn.replace("leagueId=1", "leagueId=2");
    await jest.advanceTimersByTimeAsync(1000);
    expect(click).not.toHaveBeenCalled();
    controller.stop();
  });

  it.each(["another room", "lost turn"])("does not confirm after %s during the confirmation delay", async reason => {
    let href = ROOM_URLS.espn;
    document.body.innerHTML = '<p id="clock">You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const confirm = jest.fn();
    document.querySelector("button")!.addEventListener("click", () => {
      document.body.insertAdjacentHTML("beforeend", '<div role="dialog"><span>Amon-Ra St. Brown DET WR</span><button>Confirm</button></div>');
      document.querySelector("[role=dialog] button")!.addEventListener("click", confirm);
      if (reason === "another room") href = ROOM_URLS.espn.replace("leagueId=1", "leagueId=2");
      else document.getElementById("clock")!.textContent = "Team 2 is on the clock";
    });
    const controller = startAutoDraftController("espn", () => {}, {getHref: () => href});
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue});
    await jest.advanceTimersByTimeAsync(5000);
    expect(confirm).not.toHaveBeenCalled();
    controller.stop();
  });

  it.each([
    '<span>Different Player BUF RB</span><button>Confirm</button>',
    '<span>Amon-Ra St. Brown DET WR</span><button>Confirm</button><button>Draft</button>',
    '<span>Amon-Ra St. Brown DET WR</span><button>Cancel draft</button>',
  ])("rejects an uncertain confirmation dialog (%s)", async dialog => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const confirmationClick = jest.fn();
    document.querySelector("button")!.addEventListener("click", () => {
      document.body.insertAdjacentHTML("beforeend", `<div role="dialog">${dialog}</div>`);
      document.querySelectorAll("[role=dialog] button").forEach(button => button.addEventListener("click", confirmationClick));
    });
    const statuses = await runLive();
    expect(confirmationClick).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.phase).toBe("error");
  });

  it("confirms exactly one matching candidate dialog", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const confirm = jest.fn();
    document.querySelector("button")!.addEventListener("click", () => {
      document.body.insertAdjacentHTML("beforeend", '<div role="dialog"><span>Amon-Ra St. Brown DET WR</span><button>Cancel</button><button>Confirm</button></div>');
      document.querySelectorAll("[role=dialog] button")[1].addEventListener("click", confirm);
    });
    const statuses = await runLive();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(statuses.at(-1)?.phase).toBe("submitted");
  });

  it("rejects multiple dialogs even when one matches the selected player", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const confirm = jest.fn();
    document.querySelector("button")!.addEventListener("click", () => {
      document.body.insertAdjacentHTML("beforeend", '<div role="dialog"><span>Amon-Ra St. Brown DET WR</span><button>Confirm</button></div><div role="dialog"><span>Unrelated action</span><button>Confirm</button></div>');
      document.querySelectorAll("[role=dialog] button").forEach(button => button.addEventListener("click", confirm));
    });
    const statuses = await runLive();
    expect(confirm).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.phase).toBe("error");
  });

  it("rechecks the player when scrolling changes the draft row", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const button = document.querySelector("button")!;
    button.scrollIntoView = () => { document.querySelector("[role=row] span")!.textContent = "Different Player BUF RB"; };
    const click = jest.spyOn(button, "click");
    const statuses = await runLive();
    expect(click).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.phase).toBe("error");
  });

  it("does not draft behind a dialog that opens while the provider log read is pending", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const button = document.querySelector("button")!;
    const click = jest.spyOn(button, "click");
    const base = {type: "FANTASY_DRAFT_SYNC" as const, provider: "espn" as const, observedAt: "2026-10-02T12:00:00Z", roomUrl: ROOM_URLS.espn, readSucceeded: true, picks: []};
    let resolveRequest!: (value: typeof base) => void;
    const readPicks = jest.fn(() => new Promise<typeof base>(resolve => { resolveRequest = resolve; }));
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", status => statuses.push(status), {readPicks});
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue});
    await jest.advanceTimersByTimeAsync(3000);
    expect(readPicks).toHaveBeenCalledTimes(1);
    document.body.insertAdjacentHTML("beforeend", '<div role="dialog"><span>Unrelated manual action</span><button>Confirm</button></div>');
    resolveRequest(base);
    await jest.advanceTimersByTimeAsync(1000);
    expect(click).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.phase).toBe("error");
    controller.stop();
  });

  it("does not draft behind a dialog that opens while scrolling the draft button", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const button = document.querySelector("button")!;
    button.scrollIntoView = () => {
      document.body.insertAdjacentHTML("beforeend", '<div role="dialog"><span>Unrelated manual action</span><button>Confirm</button></div>');
    };
    const click = jest.spyOn(button, "click");
    const statuses = await runLive();
    expect(click).not.toHaveBeenCalled();
    expect(statuses.at(-1)?.phase).toBe("error");
  });

  it("keeps a direct no-dialog pick working when submission immediately ends the turn", async () => {
    document.body.innerHTML = '<p id="clock">You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const click = jest.spyOn(document.querySelector("button")!, "click");
    document.querySelector("button")!.addEventListener("click", () => {
      document.getElementById("clock")!.textContent = "Team 2 is on the clock";
    });
    const statuses = await runLive();
    expect(click).toHaveBeenCalledTimes(1);
    expect(statuses.some(status => status.phase === "submitted")).toBe(true);
  });

  it("claims confirmation only after a new provider pick matches the submitted player", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const base = {type: "FANTASY_DRAFT_SYNC" as const, provider: "espn" as const, observedAt: "2026-10-02T12:00:00Z", roomUrl: ROOM_URLS.espn, readSucceeded: true};
    const readPicks = jest.fn().mockResolvedValueOnce({...base, picks: []}).mockResolvedValueOnce({...base, picks: []}).mockResolvedValue({...base,
      picks: [{pickNumber: 1, name: "Amon-Ra St. Brown", team: "DET", position: "WR"}]});
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", status => statuses.push(status), {
      readPicks,
    });
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue});
    await jest.advanceTimersByTimeAsync(3200);
    expect(statuses.at(-1)?.phase).toBe("submitted");
    await jest.advanceTimersByTimeAsync(1500);
    expect(statuses.at(-1)?.phase).toBe("confirmed");
    expect(readPicks).toHaveBeenCalledTimes(3);
    controller.stop();
  });

  it("does not claim a submitted click is a pick when the provider log never records it", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const base = {type: "FANTASY_DRAFT_SYNC" as const, provider: "espn" as const, observedAt: "2026-10-02T12:00:00Z", roomUrl: ROOM_URLS.espn, picks: [], readSucceeded: true};
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", status => statuses.push(status), {
      readPicks: async () => base,
    });
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue});
    await jest.advanceTimersByTimeAsync(8000);
    expect(statuses.at(-1)?.phase).toBe("submitted");
    expect(statuses.some(status => status.phase === "confirmed")).toBe(false);
    controller.stop();
  });

  it.each(["failed baseline", "another slot", "later pick", "missing slot"])("does not count an unverified pick with %s", async reason => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const base = {type: "FANTASY_DRAFT_SYNC" as const, provider: "espn" as const, observedAt: "2026-10-02T12:00:00Z", roomUrl: ROOM_URLS.espn, readSucceeded: true};
    const laterPicks = reason === "later pick"
      ? [{pickNumber: 1, name: "Different Player", team: "BUF", position: "RB"}, {pickNumber: 2, name: "Amon-Ra St. Brown", team: "DET", position: "WR"}]
      : [{pickNumber: 1, name: "Amon-Ra St. Brown", team: "DET", position: "WR"}];
    const readPicks = jest.fn().mockResolvedValueOnce({...base, readSucceeded: reason !== "failed baseline", picks: []}).mockResolvedValue({...base, picks: laterPicks});
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", status => statuses.push(status), {readPicks});
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue,
      userTeam: reason === "missing slot" ? undefined : reason === "another slot" ? 2 : 1});
    await jest.advanceTimersByTimeAsync(8000);
    expect(statuses.at(-1)?.phase).toBe("submitted");
    expect(statuses.some(status => status.phase === "confirmed")).toBe(false);
    controller.stop();
  });

  it("rejects a stale mounted player already recorded in the fresh pre-click log", async () => {
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const click = jest.spyOn(document.querySelector("button")!, "click");
    const readPicks = jest.fn().mockResolvedValue({type: "FANTASY_DRAFT_SYNC", provider: "espn", roomUrl: ROOM_URLS.espn, readSucceeded: true,
      picks: [{pickNumber: 1, name: "Amon-Ra St. Brown", team: "DET", position: "WR"}]});
    const controller = startAutoDraftController("espn", () => {}, {readPicks});
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue});
    await jest.advanceTimersByTimeAsync(5000);
    expect(click).not.toHaveBeenCalled();
    controller.stop();
  });

  it("disarms while a provider log request is still pending after room navigation", async () => {
    let href = ROOM_URLS.espn;
    document.body.innerHTML = '<p>You are on the clock</p> <div role="row"><span>Amon-Ra St. Brown DET WR</span><button>Draft</button></div>';
    const base = {type: "FANTASY_DRAFT_SYNC" as const, provider: "espn" as const, observedAt: "2026-10-02T12:00:00Z", roomUrl: ROOM_URLS.espn, picks: [], readSucceeded: true};
    let resolveRequest!: (value: typeof base) => void;
    const readPicks = jest.fn(() => new Promise<typeof base>(resolve => { resolveRequest = resolve; }));
    const statuses: AutoDraftStatus[] = [];
    const controller = startAutoDraftController("espn", status => statuses.push(status), {
      getHref: () => href, readPicks,
    });
    await controller.handleCommand({type: "FANTASY_AUTODRAFT_ARM", provider: "espn", live: true, pickDelayMs: 1000, queue});
    await jest.advanceTimersByTimeAsync(3200);
    expect(readPicks).toHaveBeenCalledTimes(1);
    href = ROOM_URLS.espn.replace("leagueId=1", "leagueId=2");
    await jest.advanceTimersByTimeAsync(900);
    expect(statuses.at(-1)).toMatchObject({phase: "stopped", armed: false});
    resolveRequest(base);
    await jest.advanceTimersByTimeAsync(100);
    expect(statuses.some(status => status.phase === "confirmed")).toBe(false);
    controller.stop();
  });
});
