import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { DraftValuePanel } from "./DraftValuePanel";
import type { ExpectedReturnFormState } from "./DraftValuePanel";
import type { DraftValueReport } from "@/lib/fantasyTeamValue";

const REPORT: DraftValueReport = {
  modelVersion: "draft-outlook-v2",
  mode: "best-ball",
  teamNumber: 12,
  picksDrafted: 6,
  rosterSize: 18,
  compositeScore: 72,
  roomRank: 3,
  roomSize: 12,
  roomPercentile: 82,
  roomTieCount: 1,
  confidence: "developing",
  slotContext: {
    slot: 12,
    teams: 12,
    rounds: 18,
    draftType: "snake",
    firstPick: 12,
    minimumTurnGap: 1,
    maximumTurnGap: 23,
  },
  market: {
    judgedPicks: 6,
    adpPicks: 5,
    formatRankPicks: 0,
    consensusRankPicks: 1,
    totalDelta: 18,
    averageDelta: 3,
  },
  components: [
    {
      id: "market",
      label: "Market price",
      score: 70,
      weight: 0.5,
      detail: "+3.0 slots per judged pick · 5 ADP · 1 consensus",
    },
    {
      id: "roster",
      label: "Roster shape",
      score: 68,
      weight: 0.3,
      detail: "Current target 2 QB · 6 RB · 8 WR · 2 TE",
    },
  ],
};

function SharedCalculatorPanels() {
  const [value, setValue] = useState<ExpectedReturnFormState>({
    entryCost: "",
    payoutProbability: "",
    averagePayout: "",
  });
  return (
    <>
      <DraftValuePanel
        report={REPORT}
        headingId="shared-desktop-heading"
        calculatorValue={value}
        onCalculatorChange={setValue}
      />
      <DraftValuePanel
        report={REPORT}
        headingId="shared-mobile-heading"
        calculatorValue={value}
        onCalculatorChange={setValue}
      />
    </>
  );
}

describe("DraftValuePanel", () => {
  it("withholds modeled output when its source capability is unavailable", () => {
    render(
      <DraftValuePanel
        report={REPORT}
        headingId="paused-draft-outlook"
        unavailableReason="The ranking source is stale. Draft Outlook will return after the board refreshes."
      />
    );

    expect(screen.getByRole("heading", { name: "Draft Outlook paused" })).toBeVisible();
    expect(screen.getByText(/The ranking source is stale/i)).toBeVisible();
    expect(screen.queryByText("Calculated market value")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("keeps the room outlook separate from payout probability", () => {
    render(<DraftValuePanel report={REPORT} headingId="draft-value-heading" />);

    expect(screen.getByText("3 of 12")).toBeInTheDocument();
    expect(screen.getByText("82nd percentile among same-progress teams")).toBeInTheDocument();
    expect(screen.getByText("+3.0")).toBeInTheDocument();
    expect(screen.getByText("Calculated market value")).toBeInTheDocument();
    expect(screen.getByText("Market price")).toBeInTheDocument();
    expect(
      screen.getByText(/Projected points, win probability, and roster-specific dollar EV require a separate simulation/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Slot 12 has 1 to 23 pick gaps/i)).toBeInTheDocument();
    expect(screen.getByText("Model v2")).toBeInTheDocument();
  });

  it("keeps the market labels for an ADP-backed read", () => {
    render(
      <DraftValuePanel
        report={{
          ...REPORT,
          market: {
            ...REPORT.market,
            adpPicks: REPORT.market.judgedPicks,
            consensusRankPicks: 0,
          },
        }}
        headingId="adp-only-heading"
      />
    );

    expect(screen.getByText("Calculated market value")).toBeInTheDocument();
    expect(screen.getByText("Market price")).toBeInTheDocument();
    expect(screen.getByText(/the price the market put on each player/i)).toBeInTheDocument();
  });

  it("does not describe a consensus-only read as market price", () => {
    render(
      <DraftValuePanel
        report={{
          ...REPORT,
          market: {
            ...REPORT.market,
            adpPicks: 0,
            consensusRankPicks: REPORT.market.judgedPicks,
          },
        }}
        headingId="consensus-only-heading"
      />
    );

    expect(screen.getByText("Calculated consensus value")).toBeInTheDocument();
    expect(screen.getByText("Consensus rank")).toBeInTheDocument();
    expect(screen.queryByText("Market price")).not.toBeInTheDocument();
    expect(screen.getByText(/Market price requires usable ADP/i)).toBeInTheDocument();
    expect(screen.getByText(/no usable ADP evidence for these picks/i)).toBeInTheDocument();
  });

  it("holds the room rank until the sample is big enough to mean anything", () => {
    render(
      <DraftValuePanel
        report={{ ...REPORT, picksDrafted: 3, roomRank: 3, roomSize: 3, roomPercentile: 0 }}
        headingId="early-room-rank-heading"
      />
    );

    expect(screen.queryByText("3 of 3")).not.toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText(/Held until you have 4 picks/i)).toBeInTheDocument();
  });

  it("does not turn a one-team comparison into a first-place claim", () => {
    render(
      <DraftValuePanel
        report={{ ...REPORT, roomRank: 1, roomSize: 1, roomPercentile: 50 }}
        headingId="one-team-room-heading"
      />
    );

    expect(screen.queryByText("1 of 1")).not.toBeInTheDocument();
    expect(screen.getByText("Waiting for another team at the same pick count")).toBeInTheDocument();
  });

  it("describes an exact room tie as a midpoint percentile", () => {
    render(
      <DraftValuePanel
        report={{ ...REPORT, roomRank: 1.5, roomSize: 2, roomPercentile: 50, roomTieCount: 2 }}
        headingId="tied-room-heading"
      />
    );

    expect(screen.getByText("T1.5 of 2")).toBeInTheDocument();
    expect(screen.getByText("50th percentile among same-progress teams")).toBeInTheDocument();
  });

  it("calculates expected return only from the entered payout assumptions", () => {
    render(<DraftValuePanel report={REPORT} headingId="draft-return-heading" />);

    fireEvent.click(screen.getByText("Expected return calculator"));
    fireEvent.change(screen.getByLabelText(/Entry cost/), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText(/Chance of any payout/), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText(/Average total payout if paid/), {
      target: { value: "300" },
    });

    expect(screen.getByText("$30.00")).toBeInTheDocument();
    expect(screen.getByText("+$5.00")).toBeInTheDocument();
    expect(screen.getByText("20.0%")).toBeInTheDocument();
    expect(screen.getByText("8.3%")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Average total payout if paid/), {
      target: { value: "10" },
    });
    expect(screen.getByText("Not possible")).toBeInTheDocument();
  });

  it("shows the exact published field baseline when contest economics are supplied", () => {
    render(
      <DraftValuePanel
        report={REPORT}
        headingId="bbm-value-heading"
        economics={{
          entryFee: 25,
          fieldEntries: 672_336,
          prizePool: 15_000_000,
          firstAdvanceRate: 2 / 12,
        }}
        economicsSourceUrl="https://help.underdogsports.com/en/articles/14785343-best-ball-mania-vii"
        defaultEntryCost={25}
      />
    );

    expect(screen.getByText("Best Ball Mania VII field baseline")).toBeInTheDocument();
    expect(screen.getByText("$22.31")).toBeInTheDocument();
    expect(screen.getByText("-$2.69")).toBeInTheDocument();
    expect(screen.getByText("16.7%")).toBeInTheDocument();
    expect(screen.getByText("+12.1%")).toBeInTheDocument();
  });

  it("reports invalid payout assumptions without silently clearing the output", () => {
    render(<DraftValuePanel report={REPORT} headingId="invalid-return-heading" />);

    fireEvent.click(screen.getByText("Expected return calculator"));
    const chanceInput = screen.getByLabelText(/Chance of any payout/);
    fireEvent.change(chanceInput, { target: { value: "101" } });

    expect(chanceInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Use a payout chance from 0% to 100%.");
  });

  it("keeps calculator assumptions synchronized across responsive presentations", () => {
    render(<SharedCalculatorPanels />);

    const entryInputs = screen.getAllByLabelText(/Entry cost/);
    fireEvent.change(entryInputs[0], { target: { value: "75" } });

    expect(entryInputs[0]).toHaveValue(75);
    expect(entryInputs[1]).toHaveValue(75);
  });
});
