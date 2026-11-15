import type { AiDevTool } from "./ai-dev-tools-data";
import { isRecord } from "@/lib/utils";
import { isFollowingId, readRecordArray } from "@/lib/personalFollowing";

export const TOOL_COMPARISONS_KEY = "dev-tool-comparisons-v1";
export const TOOL_PRICING_CHECKED_AT = "2026-10-25";
export const TOOL_ENVIRONMENTS = {
  any: "Any environment",
  vscode: "VS Code",
  jetbrains: "JetBrains",
  terminal: "Terminal",
  standalone: "Standalone editor",
  cloud: "Cloud workspace",
} as const;
export interface ToolRequirements {
  environment: keyof typeof TOOL_ENVIRONMENTS;
  ownKeys: boolean;
  localModels: boolean;
  teamAdmin: boolean;
  openSource: boolean;
}
export const DEFAULT_TOOL_REQUIREMENTS: ToolRequirements = {
  environment: "any",
  ownKeys: false,
  localModels: false,
  teamAdmin: false,
  openSource: false,
};
export interface SavedToolComparison {
  id: string;
  name: string;
  toolIds: string[];
  requirements: ToolRequirements;
}

export function parseToolComparisons(raw: string): SavedToolComparison[] {
  const seen = new Set<string>();
  return readRecordArray(raw)
    .flatMap((row): SavedToolComparison[] => {
      const r = row.requirements;
      if (
        !isFollowingId(row.id) ||
        seen.has(row.id) ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        row.name.length > 80 ||
        !Array.isArray(row.toolIds) ||
        !row.toolIds.length ||
        row.toolIds.length > 4 ||
        !row.toolIds.every(isFollowingId) ||
        !isRecord(r) ||
        typeof r.environment !== "string" ||
        !Object.hasOwn(TOOL_ENVIRONMENTS, r.environment) ||
        ![r.ownKeys, r.localModels, r.teamAdmin, r.openSource].every(
          (v) => typeof v === "boolean",
        )
      )
        return [];
      seen.add(row.id);
      return [
        {
          id: row.id,
          name: row.name.trim(),
          toolIds: [...new Set(row.toolIds as string[])],
          requirements: {
            environment: r.environment as ToolRequirements["environment"],
            ownKeys: r.ownKeys as boolean,
            localModels: r.localModels as boolean,
            teamAdmin: r.teamAdmin as boolean,
            openSource: r.openSource as boolean,
          },
        },
      ];
    })
    .slice(0, 20);
}

const teamAdministration = new Set([
  "cursor",
  "claude-code",
  "github-copilot",
  "openai-codex",
  "devin",
  "windsurf",
  "cline",
  "augment-code",
  "kilo-code",
  "jetbrains-ai-assistant",
  "zed-ai",
]);
const localModels = new Set([
  "cline",
  "opencode",
  "kilo-code",
  "aider",
  "jetbrains-ai-assistant",
]);
const ownKeys = new Set([
  "claude-code",
  "openai-codex",
  "cline",
  "opencode",
  "kilo-code",
  "aider",
  "jetbrains-ai-assistant",
  "zed-ai",
]);

export function requirementChecks(
  tool: AiDevTool,
  requirements: ToolRequirements,
) {
  const checks: { label: string; result: "yes" | "no" | "unknown" }[] = [];
  const surfaces = tool.surfaces.join(" ");
  const tests = {
    vscode: /VS Code/i,
    jetbrains: /JetBrains/i,
    terminal: /CLI/i,
    standalone: /Desktop IDE|Zed editor/i,
    cloud: /Cloud/i,
  };
  if (requirements.environment !== "any")
    checks.push({
      label: TOOL_ENVIRONMENTS[requirements.environment],
      result: tests[requirements.environment].test(surfaces)
        ? "yes"
        : "unknown",
    });
  if (requirements.ownKeys)
    checks.push({
      label: "Own provider keys",
      result: ownKeys.has(tool.id) ? "yes" : "unknown",
    });
  if (requirements.localModels)
    checks.push({
      label: "Local models",
      result: localModels.has(tool.id) ? "yes" : "unknown",
    });
  if (requirements.teamAdmin)
    checks.push({
      label: "Team administration",
      result: teamAdministration.has(tool.id) ? "yes" : "unknown",
    });
  if (requirements.openSource)
    checks.push({
      label: "Open source",
      result:
        tool.sourceStatus === "open-source"
          ? "yes"
          : tool.sourceStatus === "proprietary"
            ? "no"
            : "unknown",
    });
  return checks;
}
