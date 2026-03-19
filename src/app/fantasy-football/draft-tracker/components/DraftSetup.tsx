"use client";

import { useEffect, useState } from "react";
import { DraftSettings, ScoringFormat } from "@/types";

interface DraftSetupProps {
  settings: DraftSettings;
  onSaveSettings: (settings: Partial<DraftSettings>) => void;
  onStartDraft: () => void;
}

const SCORING_OPTIONS: { value: ScoringFormat; label: string; description: string }[] = [
  { value: "PPR", label: "PPR", description: "Best for reception-heavy leagues." },
  { value: "HALF_PPR", label: "Half PPR", description: "Balanced default for most home leagues." },
  { value: "STANDARD", label: "Standard", description: "Use when receptions do not score." },
];

export function DraftSetup({ settings, onSaveSettings, onStartDraft }: DraftSetupProps) {
  const [formState, setFormState] = useState<DraftSettings>(settings);

  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  function updateField<Key extends keyof DraftSettings>(field: Key, value: DraftSettings[Key]) {
    setFormState((current) => {
      const nextState = { ...current, [field]: value };
      if (field === "totalTeams" && nextState.userTeam > Number(value)) {
        nextState.userTeam = Number(value);
      }

      return nextState;
    });
  }

  function handleStartDraft() {
    onSaveSettings(formState);
    onStartDraft();
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#08111f]/90 p-5 sm:p-6">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Draft Setup</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Configure the room before picks start.</h2>
        <p className="mt-2 text-sm leading-7 text-slate-300">
          Save your league settings once, then use the published snapshot board to log every pick as the room moves.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">League name</span>
          <input
            value={formState.leagueName ?? ""}
            onChange={(event) => updateField("leagueName", event.target.value)}
            className="min-h-[48px] rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-slate-500 focus:border-sky-300/40"
            placeholder="Home league"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Teams</span>
          <select
            value={formState.totalTeams}
            onChange={(event) => updateField("totalTeams", Number(event.target.value))}
            className="min-h-[48px] rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-sky-300/40"
          >
            {[8, 10, 12, 14, 16].map((teamCount) => (
              <option key={teamCount} value={teamCount} className="bg-slate-950">
                {teamCount} teams
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Your draft slot</span>
          <select
            value={formState.userTeam}
            onChange={(event) => updateField("userTeam", Number(event.target.value))}
            className="min-h-[48px] rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-sky-300/40"
          >
            {Array.from({ length: formState.totalTeams }, (_, index) => index + 1).map((slot) => (
              <option key={slot} value={slot} className="bg-slate-950">
                Pick {slot}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Rounds</span>
          <select
            value={formState.rounds}
            onChange={(event) => updateField("rounds", Number(event.target.value))}
            className="min-h-[48px] rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-sky-300/40"
          >
            {[13, 14, 15, 16, 17, 18].map((roundCount) => (
              <option key={roundCount} value={roundCount} className="bg-slate-950">
                {roundCount} rounds
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Draft order</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { value: "snake" as const, label: "Snake", description: "Reverse order each round." },
              { value: "linear" as const, label: "Linear", description: "Same order every round." },
            ].map((option) => {
              const active = formState.draftType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("draftType", option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-sky-300/40 bg-sky-300/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 text-sm">
          <span className="font-medium text-slate-200">Scoring</span>
          <div className="grid gap-2">
            {SCORING_OPTIONS.map((option) => {
              const active = formState.scoringFormat === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("scoringFormat", option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-emerald-300/40 bg-emerald-300/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4">
        <p className="text-sm text-slate-300">
          The board will track {formState.totalTeams} teams, {formState.rounds} rounds, and highlight your turns from slot {formState.userTeam}.
        </p>
        <button
          type="button"
          onClick={handleStartDraft}
          className="min-h-[48px] rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          Start draft assistant
        </button>
      </div>
    </div>
  );
}
