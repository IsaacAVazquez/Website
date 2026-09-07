import {
  detectAutoDraftProvider,
  isCandidateEligible,
  normalizeAutoDraftName,
  pageSaysUserIsOnClock,
  readCurrentRound,
  rowMatchesCandidate,
  startAutoDraftController,
  type AutoDraftStatus,
} from "../autodraft-controller";

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
});
