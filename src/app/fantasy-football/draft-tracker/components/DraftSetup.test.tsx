import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { DraftSetup } from "./DraftSetup";
import { REDRAFT_LINEUP_PRESETS } from "@/lib/redraftLineup";
import type { DraftSettings } from "@/types";

const SETTINGS: DraftSettings = {
  totalTeams: 10,
  userTeam: 1,
  scoringFormat: "PPR",
  draftType: "snake",
  rounds: 15,
  timerSeconds: 90,
  lineup: { ...REDRAFT_LINEUP_PRESETS[0].lineup },
};

function renderSetup(parkedPickCount: number) {
  const onStartDraft = jest.fn();
  render(
    <DraftSetup
      settings={SETTINGS}
      onSaveSettings={jest.fn()}
      onStartDraft={onStartDraft}
      rankingsStatus="ready"
      rankingsError={null}
      onRetryRankings={jest.fn()}
      canResume={parkedPickCount > 0}
      onResume={jest.fn()}
      parkedPickCount={parkedPickCount}
    />
  );
  return onStartDraft;
}

describe("DraftSetup start guard", () => {
  it("starts on the first press when no room is parked", () => {
    const onStartDraft = renderSetup(0);

    fireEvent.click(screen.getByRole("button", { name: "Start draft" }));

    expect(onStartDraft).toHaveBeenCalledTimes(1);
  });

  it("arms before wiping a parked room, and says what would be lost", () => {
    const onStartDraft = renderSetup(23);

    fireEvent.click(
      screen.getByRole("button", { name: "Start draft, which clears the parked room" })
    );

    expect(onStartDraft).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Starting clears the 23 picks already logged in the parked room/)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm new draft and clear the parked room" })
    );

    expect(onStartDraft).toHaveBeenCalledTimes(1);
  });
});
