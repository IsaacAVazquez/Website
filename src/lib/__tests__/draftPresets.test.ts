import {
  MAX_DRAFT_PRESETS,
  decodeDraftPresets,
  describeDraftPreset,
  toDraftPresetSettings,
  type DraftPreset,
} from "@/lib/draftPresets";
import { DEFAULT_REDRAFT_LINEUP } from "@/lib/redraftLineup";
import type { DraftSettings } from "@/types";

const settings: DraftSettings = {
  totalTeams: 10,
  userTeam: 7,
  scoringFormat: "HALF_PPR",
  draftType: "snake",
  rounds: 16,
  lineup: { ...DEFAULT_REDRAFT_LINEUP },
  timerSeconds: 60,
  leagueName: "Home league",
  draftDate: new Date("2026-08-31T00:00:00.000Z"),
};

function preset(overrides: Partial<DraftPreset> = {}): DraftPreset {
  return {
    id: "preset_1",
    name: "Home league",
    savedAt: "2026-08-31T00:00:00.000Z",
    settings: toDraftPresetSettings(settings),
    ...overrides,
  };
}

describe("draft presets", () => {
  it("round-trips a preset through encode and decode without the draft date", () => {
    const decoded = decodeDraftPresets(JSON.parse(JSON.stringify([preset()])));
    expect(decoded).toHaveLength(1);
    expect(decoded[0].settings).toEqual(toDraftPresetSettings(settings));
    expect("draftDate" in decoded[0].settings).toBe(false);
  });

  it("drops presets whose room shape is outside the setup screen's menus", () => {
    const badTeams = preset({ id: "p2", settings: { ...toDraftPresetSettings(settings), totalTeams: 7 } });
    const badScoring = preset({
      id: "p3",
      settings: { ...toDraftPresetSettings(settings), scoringFormat: "TE_PREMIUM" as never },
    });
    expect(decodeDraftPresets([badTeams, badScoring, preset()])).toHaveLength(1);
  });

  it("clamps the draft slot into the room and defaults an off-menu clock", () => {
    const decoded = decodeDraftPresets([
      preset({
        settings: { ...toDraftPresetSettings(settings), userTeam: 40, timerSeconds: 7 },
      }),
    ]);
    expect(decoded[0].settings.userTeam).toBe(10);
    expect(decoded[0].settings.timerSeconds).toBe(90);
  });

  it("caps the list and ignores duplicate ids", () => {
    const many = Array.from({ length: MAX_DRAFT_PRESETS + 4 }, (_, index) =>
      preset({ id: `p-${index}`, name: `League ${index}` })
    );
    expect(decodeDraftPresets(many)).toHaveLength(MAX_DRAFT_PRESETS);
    expect(decodeDraftPresets([preset(), preset()])).toHaveLength(1);
    expect(decodeDraftPresets("junk")).toEqual([]);
  });

  it("describes a preset with the room shape a drafter would recognize", () => {
    expect(describeDraftPreset(preset())).toContain("10-team snake · slot 7 · 16 rounds · Half PPR");
    expect(describeDraftPreset(preset())).toContain("saved 2026-08-31");
  });
});
