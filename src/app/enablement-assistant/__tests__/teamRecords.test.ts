import { parseTeamRecords, saveTeamRecord, setTeamProgress } from "../teamRecords";
import { DEFAULT_TEAM_INTAKE } from "../enablement-data";

const team = {
  id: "one",
  name: "Payments",
  intake: DEFAULT_TEAM_INTAKE,
  standardStatus: "partial" as const,
  resolvedQuestions: 2,
  escalatedQuestions: 1,
  completedSteps: ["scope"],
};

it("applies the requested checkbox state once and refuses an outdated plan", () => {
  expect(setTeamProgress([team], team.id, team.intake, "scope", true)[0].completedSteps).toEqual(["scope"]);
  expect(setTeamProgress([team], team.id, team.intake, "scope", false)[0].completedSteps).toEqual([]);
  expect(setTeamProgress([team], team.id, { ...team.intake, ci: "gitlab" }, "scope", false)[0].completedSteps).toEqual(["scope"]);
});
it("rejects unsafe restored labels and counts", () => {
  expect(
    parseTeamRecords(
      JSON.stringify([
        { ...team, resolvedQuestions: -1 },
        { ...team, intake: { ...DEFAULT_TEAM_INTAKE, surface: "constructor" } },
        team,
      ]),
    ),
  ).toHaveLength(1);
  expect(parseTeamRecords("null")).toEqual([]);
});
it("preserves progress on ordinary edits and resets it when the intake changes", () => {
  expect(
    saveTeamRecord([team], { ...team, name: "New name" })[0].completedSteps,
  ).toEqual(["scope"]);
  expect(
    saveTeamRecord([team], {
      ...team,
      intake: { ...DEFAULT_TEAM_INTAKE, language: "python" },
    })[0].completedSteps,
  ).toEqual([]);
});
it("preserves another team's progress and removes unknown step ids", () => {
  const records = parseTeamRecords(
    JSON.stringify([{ ...team, completedSteps: ["scope", "unknown"] }]),
  );
  expect(records[0].completedSteps).toEqual(["scope"]);
  expect(
    saveTeamRecord(records, { ...team, id: "two", completedSteps: [] }),
  ).toHaveLength(2);
});

it("merges only fields edited in this tab and never restores a removed team", () => {
  const newer = {
    ...team,
    name: "Renamed elsewhere",
    intake: { ...team.intake, ci: "gitlab" as const },
  };
  const staleEdit = { ...team, resolvedQuestions: 8 };
  const saved = saveTeamRecord([newer], staleEdit, team)[0];
  expect(saved.name).toBe("Renamed elsewhere");
  expect(saved.intake.ci).toBe("gitlab");
  expect(saved.resolvedQuestions).toBe(8);
  expect(saveTeamRecord([], staleEdit, team)).toEqual([]);
});
