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
    lineup: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1 },
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

  it("saves the league's actual starting lineup", () => {
    const onSaveSettings = jest.fn();
    render(
      <DraftSetup
        settings={makeSettings()}
        onSaveSettings={onSaveSettings}
        onStartDraft={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /3 WR, no K\/DST/i }));
    fireEvent.change(screen.getByLabelText("Tight ends"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /Start draft assistant/i }));

    expect(onSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        lineup: { QB: 1, RB: 2, WR: 3, TE: 2, FLEX: 2, K: 0, DST: 0 },
      })
    );
  });

  it("exposes the selected state for every button option group", () => {
    render(
      <DraftSetup
        settings={makeSettings()}
        onSaveSettings={jest.fn()}
        onStartDraft={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /2 WR \+ flex/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: /3 WR, no K\/DST/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    const snake = screen.getByRole("button", { name: /Snake/i });
    const linear = screen.getByRole("button", { name: /Linear/i });
    expect(snake).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(linear);
    expect(linear).toHaveAttribute("aria-pressed", "true");
    expect(snake).toHaveAttribute("aria-pressed", "false");

    const ppr = screen.getByRole("button", { name: /^PPR/i });
    const standard = screen.getByRole("button", { name: /^Standard/i });
    expect(ppr).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(standard);
    expect(standard).toHaveAttribute("aria-pressed", "true");
    expect(ppr).toHaveAttribute("aria-pressed", "false");

    const timerOn = screen.getByRole("button", { name: /^On/i });
    const timerOff = screen.getByRole("button", { name: /^Off/i });
    expect(timerOn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(timerOff);
    expect(timerOff).toHaveAttribute("aria-pressed", "true");
    expect(timerOn).toHaveAttribute("aria-pressed", "false");
  });
});
