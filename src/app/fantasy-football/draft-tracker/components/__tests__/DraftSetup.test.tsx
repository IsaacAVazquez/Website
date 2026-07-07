import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { DraftSetup } from "../DraftSetup";
import type { DraftSettings } from "@/types";

function makeSettings(partial: Partial<DraftSettings> = {}): DraftSettings {
  return {
    totalTeams: 12,
    userTeam: 6,
    scoringFormat: "PPR",
    draftType: "snake",
    rounds: 15,
    timerSeconds: 90,
    leagueName: "Home league",
    ...partial,
  };
}

describe("DraftSetup", () => {
  it("clamps the draft slot down when the team count drops below it", () => {
    render(
      <DraftSetup
        settings={makeSettings({ totalTeams: 12, userTeam: 10 })}
        onSaveSettings={jest.fn()}
        onStartDraft={jest.fn()}
      />
    );

    const userTeamSelect = screen.getByLabelText("Your draft slot") as HTMLSelectElement;
    expect(userTeamSelect.value).toBe("10");

    // Lowering Teams to 8 must pull the slot (10) back into range.
    fireEvent.change(screen.getByLabelText("Teams"), { target: { value: "8" } });

    expect((screen.getByLabelText("Your draft slot") as HTMLSelectElement).value).toBe("8");
  });

  it("leaves the draft slot untouched when it still fits the new team count", () => {
    render(
      <DraftSetup
        settings={makeSettings({ totalTeams: 12, userTeam: 6 })}
        onSaveSettings={jest.fn()}
        onStartDraft={jest.fn()}
      />
    );

    // Slot 6 is still valid inside 10 teams, so the clamp must not fire.
    fireEvent.change(screen.getByLabelText("Teams"), { target: { value: "10" } });

    expect((screen.getByLabelText("Your draft slot") as HTMLSelectElement).value).toBe("6");
  });

  it("starts the draft only once when Start is clicked twice", () => {
    const onSaveSettings = jest.fn();
    const onStartDraft = jest.fn();
    render(
      <DraftSetup
        settings={makeSettings()}
        onSaveSettings={onSaveSettings}
        onStartDraft={onStartDraft}
      />
    );

    const startButton = screen.getByRole("button", { name: /Start draft assistant/i });
    fireEvent.click(startButton);
    fireEvent.click(startButton);

    expect(onStartDraft).toHaveBeenCalledTimes(1);
    expect(onSaveSettings).toHaveBeenCalledTimes(1);
    expect(onSaveSettings).toHaveBeenCalledWith(expect.objectContaining({ totalTeams: 12 }));
  });
});
