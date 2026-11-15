import {
  parseToolComparisons,
  requirementChecks,
  DEFAULT_TOOL_REQUIREMENTS,
} from "../toolComparisons";
import { aiDevTools } from "../ai-dev-tools-data";

it("restores bounded named shortlists and preserves a removed tool id", () => {
  const saved = {
    id: "list-one",
    name: "Team shortlist",
    toolIds: ["aider", "retired-tool"],
    requirements: DEFAULT_TOOL_REQUIREMENTS,
  };
  expect(
    parseToolComparisons(
      JSON.stringify([saved, { ...saved, id: "bad", name: "" }]),
    ),
  ).toEqual([saved]);
  expect(
    parseToolComparisons(
      JSON.stringify([{ ...saved, toolIds: ["constructor", "<script>"] }]),
    ),
  ).toEqual([]);
});
it("checks explicit facts and leaves an unconfirmed capability unknown", () => {
  const aider = aiDevTools.find((tool) => tool.id === "aider")!;
  const checks = requirementChecks(aider, {
    ...DEFAULT_TOOL_REQUIREMENTS,
    environment: "terminal",
    localModels: true,
    teamAdmin: true,
  });
  expect(checks.find((check) => check.label === "Terminal")?.result).toBe(
    "yes",
  );
  expect(checks.find((check) => check.label === "Local models")?.result).toBe(
    "yes",
  );
  expect(
    checks.find((check) => check.label === "Team administration")?.result,
  ).toBe("unknown");
});
