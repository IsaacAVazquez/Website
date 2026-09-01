import { FANTASY_SCORING_LABELS, scoringFormatToRouteScoring } from "@/lib/fantasy";
import { normalizeRedraftLineup, redraftLineupSummary } from "@/lib/redraftLineup";
import type { DraftSettings, ScoringFormat } from "@/types";

/**
 * Named league presets for the redraft tracker's setup screen: the whole room
 * configuration except the draft date, stored on this device so a drafter with
 * several leagues stops re-entering the same settings each August.
 */

export const DRAFT_PRESETS_STORAGE_KEY = "fantasy-draft-presets-v1";
export const MAX_DRAFT_PRESETS = 12;

export type DraftPresetSettings = Omit<DraftSettings, "draftDate">;

export interface DraftPreset {
  id: string;
  name: string;
  savedAt: string;
  settings: DraftPresetSettings;
}

const PRESET_TEAM_COUNTS = [8, 10, 12, 14, 16];
const PRESET_ROUND_COUNTS = [13, 14, 15, 16, 17, 18];
const PRESET_TIMER_SECONDS = [0, 45, 60, 90, 120, 180];
const PRESET_SCORING: readonly ScoringFormat[] = ["PPR", "HALF_PPR", "STANDARD"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function toDraftPresetSettings(settings: DraftSettings): DraftPresetSettings {
  return {
    totalTeams: settings.totalTeams,
    userTeam: settings.userTeam,
    scoringFormat: settings.scoringFormat,
    draftType: settings.draftType,
    rounds: settings.rounds,
    lineup: { ...settings.lineup },
    timerSeconds: settings.timerSeconds,
    leagueName: settings.leagueName,
  };
}

/** One-line description for a preset chip's hover text. */
export function describeDraftPreset(preset: DraftPreset): string {
  const { settings } = preset;
  // The saved date is what tells two same-named presets apart, since saving
  // over a name replaces it.
  const savedDate = preset.savedAt.slice(0, 10);
  const saved = Number.isNaN(Date.parse(savedDate)) ? "" : ` · saved ${savedDate}`;
  const scoringLabel = FANTASY_SCORING_LABELS[scoringFormatToRouteScoring(settings.scoringFormat)];
  return `${settings.totalTeams}-team ${settings.draftType} · slot ${settings.userTeam} · ${settings.rounds} rounds · ${scoringLabel} · ${redraftLineupSummary(settings.lineup)}${saved}`;
}

/**
 * Defensive reader for the persisted list. Anything outside the setup screen's
 * own menus drops rather than clamps, because a preset that silently changed
 * shape would misconfigure a room the drafter thought they knew.
 */
export function decodeDraftPresets(value: unknown): DraftPreset[] {
  if (!Array.isArray(value)) return [];
  const presets: DraftPreset[] = [];
  const seenIds = new Set<string>();
  for (const entry of value) {
    if (presets.length >= MAX_DRAFT_PRESETS) break;
    if (!isRecord(entry)) continue;
    const id = typeof entry.id === "string" ? entry.id.trim().slice(0, 100) : "";
    const name = typeof entry.name === "string" ? entry.name.trim().slice(0, 40) : "";
    const settings = entry.settings;
    if (!id || !name || seenIds.has(id) || !isRecord(settings)) continue;

    const totalTeams = settings.totalTeams;
    const rounds = settings.rounds;
    const scoringFormat = settings.scoringFormat;
    const draftType = settings.draftType;
    if (
      !PRESET_TEAM_COUNTS.includes(totalTeams as number) ||
      !PRESET_ROUND_COUNTS.includes(rounds as number) ||
      !PRESET_SCORING.includes(scoringFormat as ScoringFormat) ||
      (draftType !== "snake" && draftType !== "linear")
    ) {
      continue;
    }

    const userTeam = settings.userTeam;
    presets.push({
      id,
      name,
      savedAt: typeof entry.savedAt === "string" ? entry.savedAt : "",
      settings: {
        totalTeams: totalTeams as number,
        rounds: rounds as number,
        scoringFormat: scoringFormat as ScoringFormat,
        draftType,
        userTeam: Number.isInteger(userTeam)
          ? Math.min(Math.max(1, userTeam as number), totalTeams as number)
          : 1,
        timerSeconds: PRESET_TIMER_SECONDS.includes(settings.timerSeconds as number)
          ? (settings.timerSeconds as number)
          : 90,
        leagueName:
          typeof settings.leagueName === "string"
            ? settings.leagueName.slice(0, 60)
            : "",
        lineup: normalizeRedraftLineup(
          isRecord(settings.lineup)
            ? (settings.lineup as Partial<DraftSettings["lineup"]>)
            : undefined
        ),
      },
    });
    seenIds.add(id);
  }
  return presets;
}
