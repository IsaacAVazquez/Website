import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FixtureAnalysis } from "@/lib/scorePools";
import { analyzePoolFixtures } from "@/lib/scorePools/poolAnalysis";
import type { StoredPool } from "@/lib/scorePools/persistence";
import type { SnapshotFixture } from "@/types/scorePools";
import { FixtureDetailDrawer } from "../fixture-detail-drawer";
import { formatPercent, formatPoints, formatScoreline } from "../score-pools-ui";
import { HOUR, fixture, isoFromNow, league, odds, pool } from "./fixtures/scorePoolsTestData";

const NOW = new Date().toISOString();

function analyze(fx: SnapshotFixture, p: StoredPool = pool()): FixtureAnalysis {
  const result = analyzePoolFixtures([fx], league({ fixtures: [fx] }), p, NOW);
  return result.analyzed[0].analysis;
}

function renderDrawer(
  overrides: Partial<React.ComponentProps<typeof FixtureDetailDrawer>> = {},
) {
  const fx = overrides.fixture ?? fixture();
  const p = overrides.pool ?? pool();
  const props: React.ComponentProps<typeof FixtureDetailDrawer> = {
    fixture: fx,
    analysis: overrides.analysis === undefined ? analyze(fx, p) : overrides.analysis,
    pool: p,
    now: NOW,
    myPick: null,
    onClose: jest.fn(),
    onSetPick: jest.fn(),
    onClearPick: jest.fn(),
    onSetFlags: jest.fn(),
    onSaveManualOdds: jest.fn(),
    ...overrides,
  };
  render(<FixtureDetailDrawer {...props} />);
  return props;
}

describe("FixtureDetailDrawer", () => {
  it("opens as a named modal dialog with focus on Close", () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog", { name: "Harbor City vs Ironvale detail" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("closes on Escape, on the Close button, and on the scrim", async () => {
    const user = userEvent.setup();
    const props = renderDrawer();
    await user.keyboard("{Escape}");
    expect(props.onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(props.onClose).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole("button", { name: "Close match detail" }));
    expect(props.onClose).toHaveBeenCalledTimes(3);
  });

  it("keeps Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    renderDrawer();
    const dialog = screen.getByRole("dialog");
    // Shift+Tab from the first control wraps to the last one inside the panel.
    screen.getByRole("button", { name: "Close match detail" }).focus();
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "Close match detail" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Close match detail" })).toHaveFocus();
  });

  it("shows the recommendation with its expected points and floor", async () => {
    const user = userEvent.setup();
    const fx = fixture();
    const analysis = analyze(fx);
    const props = renderDrawer({ fixture: fx, analysis });
    const rec = analysis.recommendation;
    const section = screen.getByRole("region", { name: "Recommendation" });

    const recommendedCard = within(section).getByText("Recommended").parentElement as HTMLElement;
    expect(within(recommendedCard).getByText(formatScoreline(rec.recommended.score))).toBeInTheDocument();
    expect(
      within(recommendedCard).getByText(
        `${formatPoints(rec.recommended.expectedPoints)} exp pts · floor ${formatPercent(rec.recommended.pAnyPoints)}`,
      ),
    ).toBeInTheDocument();
    expect(within(section).getByText("Higher floor")).toBeInTheDocument();
    expect(within(section).getByText(rec.reason)).toBeInTheDocument();
    expect(within(section).getByText(rec.risk.explanation)).toBeInTheDocument();

    await user.click(within(recommendedCard).getByRole("button", { name: "Use as my pick" }));
    expect(props.onSetPick).toHaveBeenCalledWith(fx.id, rec.recommended.score);
  });

  it("lists up to ten candidates with exact, floor, and field shares", async () => {
    const user = userEvent.setup();
    const fx = fixture();
    const analysis = analyze(fx);
    const props = renderDrawer({ fixture: fx, analysis });
    const table = screen.getByRole("table", { name: "Top candidate picks by expected points" });
    const rows = within(table).getAllByRole("row").slice(1);
    const candidates = analysis.recommendation.candidates.slice(0, 10);
    expect(rows).toHaveLength(candidates.length);

    const first = candidates[0];
    const cells = within(rows[0]).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent(formatScoreline(first.score));
    expect(cells[1]).toHaveTextContent(formatPoints(first.expectedPoints));
    expect(cells[2]).toHaveTextContent(formatPercent(first.pExact, 1));
    expect(cells[3]).toHaveTextContent(formatPercent(first.pAnyPoints));
    expect(cells[4]).toHaveTextContent(formatPercent(first.fieldShare));

    await user.click(within(rows[1]).getByRole("button", { name: "Use" }));
    expect(props.onSetPick).toHaveBeenCalledWith(fx.id, candidates[1].score);
  });

  it("prints the scoreline grid as percentages with sub-2% cells blank", () => {
    const fx = fixture();
    const analysis = analyze(fx);
    renderDrawer({ fixture: fx, analysis });
    const grid = screen.getByRole("table", { name: "Scoreline probabilities: home goals by away goals" });
    const p11 = analysis.distribution.grid[1][1];
    expect(within(grid).getByTitle(`1-1: ${formatPercent(p11, 1)}`)).toHaveTextContent(String(Math.round(p11 * 100)));
    const p77 = analysis.distribution.grid[7][7];
    expect(p77).toBeLessThan(0.02);
    expect(within(grid).getByTitle(`7-7: ${formatPercent(p77, 1)}`)).toHaveTextContent("");
    expect(
      screen.getByText(
        new RegExp(`Expected goals ${analysis.distribution.lambdaHome.toFixed(2)} vs ${analysis.distribution.lambdaAway.toFixed(2)}`),
      ),
    ).toBeInTheDocument();
  });

  it("shows the market prices, source, age, margin, and fair probabilities", () => {
    const fx = fixture();
    const analysis = analyze(fx);
    renderDrawer({ fixture: fx, analysis });
    const market = screen.getByRole("region", { name: "Market" });
    expect(within(market).getByText(/2\.10 \/ 3\.40 \/ 3\.60/)).toBeInTheDocument();
    expect(within(market).getByText(/O\/U 2\.5 \(1\.95\/1\.90\)/)).toBeInTheDocument();
    expect(
      within(market).getByText(`pinnacle · 2h ago · margin ${formatPercent(analysis.market.overround, 1)}`),
    ).toBeInTheDocument();
    const p = analysis.market.probabilities;
    expect(
      within(market).getByText(
        `Fair probabilities after the de-vig: home ${formatPercent(p.home, 1)}, draw ${formatPercent(p.draw as number, 1)}, away ${formatPercent(p.away, 1)}.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Analysis as of just now from odds 2h ago\./)).toBeInTheDocument();
  });

  it("summarizes line movement across odds snapshots", () => {
    const fx = fixture({
      odds: [
        odds({ fetchedAt: isoFromNow(-10 * HOUR), moneyline: { home: 2.4, draw: 3.4, away: 3.0 }, totals: { line: 2.5, over: 1.9, under: 1.9 } }),
        odds({ fetchedAt: isoFromNow(-2 * HOUR), moneyline: { home: 2.0, draw: 3.5, away: 3.9 }, totals: { line: 3, over: 1.9, under: 1.9 } }),
      ],
    });
    renderDrawer({ fixture: fx });
    expect(screen.getByText(/Movement over 2 snapshots: home up \d+\.\d%, draw down \d+\.\d%, total line \+0\.5\./)).toBeInTheDocument();
  });

  it("validates the pick before setting it, then clears the inputs", async () => {
    const user = userEvent.setup();
    const props = renderDrawer();
    const home = screen.getByLabelText("Home goals");
    const away = screen.getByLabelText("Away goals");

    await user.click(screen.getByRole("button", { name: "Set" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Both scores need whole numbers from 0 to 15.");
    expect(props.onSetPick).not.toHaveBeenCalled();

    await user.type(home, "16");
    await user.type(away, "0");
    await user.click(screen.getByRole("button", { name: "Set" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(props.onSetPick).not.toHaveBeenCalled();

    await user.clear(home);
    await user.type(home, "2");
    await user.clear(away);
    await user.type(away, "1");
    await user.click(screen.getByRole("button", { name: "Set" }));
    expect(props.onSetPick).toHaveBeenCalledWith("fx-1", { home: 2, away: 1 });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(home).toHaveValue(null);
    expect(away).toHaveValue(null);
  });

  it("shows the saved pick with a Clear action", async () => {
    const user = userEvent.setup();
    const props = renderDrawer({ myPick: { home: 3, away: 1 } });
    const section = screen.getByRole("region", { name: "My pick" });
    expect(within(section).getByText("3-1")).toBeInTheDocument();
    await user.click(within(section).getByRole("button", { name: "Clear" }));
    expect(props.onClearPick).toHaveBeenCalledWith("fx-1");
  });

  it("disables Set and shows Locked once the lock time passes", () => {
    // Kickoff in 30 minutes with the default 60-minute lock offset.
    renderDrawer({ fixture: fixture({ kickoff: isoFromNow(30 * 60 * 1000) }) });
    expect(screen.getByRole("button", { name: "Set" })).toBeDisabled();
    expect(within(screen.getByRole("dialog")).getAllByText("Locked").length).toBeGreaterThan(0);
  });

  it("toggles context flags and applies a suggested one", async () => {
    const user = userEvent.setup();
    const fx = fixture();
    const analysis: FixtureAnalysis = {
      ...analyze(fx),
      suggestedFlags: [{ flag: "deadRubber", reason: "Ironvale are already eliminated.", source: "standings" }],
    };
    const props = renderDrawer({ fixture: fx, analysis });

    await user.click(screen.getByRole("checkbox", { name: /Must-win \(home\)/ }));
    expect(props.onSetFlags).toHaveBeenLastCalledWith("fx-1", { mustWinHome: true });

    expect(screen.getByText("Ironvale are already eliminated.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(props.onSetFlags).toHaveBeenLastCalledWith("fx-1", { deadRubber: true });
  });

  it("clears the last flag to null and marks an applied suggestion", async () => {
    const user = userEvent.setup();
    const fx = fixture();
    const p = pool({ flags: { "fx-1": { deadRubber: true } } });
    const analysis: FixtureAnalysis = {
      ...analyze(fx, p),
      suggestedFlags: [{ flag: "deadRubber", reason: "Nothing left to play for.", source: "standings" }],
    };
    const props = renderDrawer({ fixture: fx, pool: p, analysis });
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    const box = screen.getByRole("checkbox", { name: /Dead rubber/ });
    expect(box).toBeChecked();
    await user.click(box);
    expect(props.onSetFlags).toHaveBeenLastCalledWith("fx-1", null);
  });

  it("rejects bad hand-entered odds with a specific message", async () => {
    const user = userEvent.setup();
    const props = renderDrawer();
    const market = screen.getByRole("region", { name: "Market" });
    const field = (name: string) => within(market).getByRole("textbox", { name });
    const save = within(market).getByRole("button", { name: "Save odds" });

    await user.click(save);
    expect(within(market).getByRole("alert")).toHaveTextContent("Home and away prices are required.");

    await user.type(field("Home"), "0.9");
    await user.type(field("Away"), "3.1");
    await user.click(save);
    expect(within(market).getByRole("alert")).toHaveTextContent(
      "Prices are decimal odds and have to be greater than 1, like 2.45.",
    );

    await user.clear(field("Home"));
    await user.type(field("Home"), "2.2");
    await user.type(field("Draw"), "abc");
    await user.click(save);
    expect(within(market).getByRole("alert")).toHaveTextContent(/greater than 1/);

    await user.clear(field("Draw"));
    await user.type(field("Total line"), "-1");
    await user.click(save);
    expect(within(market).getByRole("alert")).toHaveTextContent(
      "The totals line has to be a positive number, like 2.5.",
    );
    expect(props.onSaveManualOdds).not.toHaveBeenCalled();
  });

  it("saves valid hand-entered odds stamped with now", async () => {
    const user = userEvent.setup();
    const props = renderDrawer();
    const market = screen.getByRole("region", { name: "Market" });
    const field = (name: string) => within(market).getByRole("textbox", { name });
    expect(within(market).getByText("Enter odds by hand")).toBeInTheDocument();
    await user.type(field("Home"), "2.2");
    await user.type(field("Away"), "3.3");
    await user.type(field("Total line"), "2.5");
    await user.type(field("Over"), "1.9");
    await user.click(within(market).getByRole("button", { name: "Save odds" }));
    expect(props.onSaveManualOdds).toHaveBeenCalledWith("fx-1", {
      home: 2.2,
      draw: null,
      away: 3.3,
      line: 2.5,
      over: 1.9,
      under: null,
      enteredAt: NOW,
    });
    expect(within(market).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("prices from hand-entered odds and labels them, with a remove action", async () => {
    const user = userEvent.setup();
    const fx = fixture();
    const p = pool({
      manualOdds: {
        "fx-1": { home: 1.8, draw: null, away: 4.5, line: null, over: null, under: null, enteredAt: isoFromNow(-30 * 60 * 1000) },
      },
    });
    const props = renderDrawer({ fixture: fx, pool: p, analysis: analyze(fx, p) });
    const market = screen.getByRole("region", { name: "Market" });
    expect(within(market).getByText("1.80 / 4.50")).toBeInTheDocument();
    expect(within(market).getByText(/^Hand-entered · 30m ago · margin/)).toBeInTheDocument();
    expect(within(market).getByText("Edit hand-entered odds")).toBeInTheDocument();
    expect(within(market).getByRole("textbox", { name: "Home" })).toHaveValue("1.8");
    expect(within(market).getByRole("textbox", { name: "Draw" })).toHaveValue("");
    await user.click(within(market).getByRole("button", { name: "Remove hand-entered odds" }));
    expect(props.onSaveManualOdds).toHaveBeenCalledWith("fx-1", null);
  });

  it("asks for odds when the game has none", () => {
    renderDrawer({ fixture: fixture({ odds: [] }), analysis: null });
    expect(screen.getByText(/No odds yet for this game\./)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Recommendation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Scoreline model" })).not.toBeInTheDocument();
  });

  it("shows knockout odds of extra time, injury notes, and the recheck list", () => {
    const fx = fixture({
      knockout: true,
      stage: null,
      round: "Quarterfinal",
      injuryNotes: ["Harbor City keeper doubtful"],
      lineupsConfirmed: false,
      odds: [odds({ fetchedAt: isoFromNow(-20 * HOUR), totals: null })],
    });
    const analysis = analyze(fx);
    renderDrawer({ fixture: fx, analysis });
    expect(screen.getByText("Quarterfinal")).toBeInTheDocument();
    expect(screen.getByText(/· knockout/)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`P\\(extra time\\) ${formatPercent(analysis.comparison.pExtraTime)}`)),
    ).toBeInTheDocument();
    expect(screen.getByText("Harbor City keeper doubtful")).toBeInTheDocument();
    expect(analysis.recheck.length).toBeGreaterThan(0);
    const recheck = screen.getByRole("region", { name: "Before it locks" });
    for (const item of analysis.recheck) {
      expect(within(recheck).getByText(item)).toBeInTheDocument();
    }
  });
});
