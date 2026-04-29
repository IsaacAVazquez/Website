import {
  buildAiDevToolsHref,
  DEFAULT_AI_DEV_TOOLS_STATE,
  normalizeAiDevToolsState,
} from "../ai-dev-tools-state";

describe("ai-dev-tools-state", () => {
  it("returns the default state when params are empty", () => {
    expect(normalizeAiDevToolsState({})).toEqual(DEFAULT_AI_DEV_TOOLS_STATE);
  });

  it("drops invalid filters and selected tools", () => {
    expect(
      normalizeAiDevToolsState({
        category: "not-real",
        pricing: "expensive",
        model: "magic",
        source: "unknown",
        tool: "fake-tool",
        q: "  Cline  ",
      })
    ).toEqual({
      ...DEFAULT_AI_DEV_TOOLS_STATE,
      query: "Cline",
    });
  });

  it("accepts valid filters and tool ids", () => {
    expect(
      normalizeAiDevToolsState({
        category: "terminal-agent",
        pricing: "subscription",
        model: "single-provider",
        source: "open-source",
        tool: "openai-codex",
      })
    ).toEqual({
      category: "terminal-agent",
      pricing: "subscription",
      model: "single-provider",
      source: "open-source",
      query: "",
      selectedToolId: "openai-codex",
    });
  });

  it("omits default values when serializing the href", () => {
    expect(buildAiDevToolsHref(DEFAULT_AI_DEV_TOOLS_STATE)).toBe("/ai-dev-tools");
    expect(
      buildAiDevToolsHref({
        category: "editor-extension",
        pricing: "usage-based",
        model: "byok-multi-provider",
        source: "open-source",
        query: "cline",
        selectedToolId: "cline",
      })
    ).toBe(
      "/ai-dev-tools?category=editor-extension&pricing=usage-based&model=byok-multi-provider&source=open-source&q=cline&tool=cline"
    );
  });
});
