import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { premierLeagueSnapshot } from "@/data/premierLeagueSnapshot";
import { PremierLeagueClient } from "../premier-league-client";
import { DEFAULT_PREMIER_LEAGUE_STATE } from "../premier-league-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function flushPromises() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("PremierLeagueClient", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("hydrates from URL params and preserves the selected club across tab switches", async () => {
    currentSearchParams = new URLSearchParams("view=team&team=57");

    await act(async () => {
      root.render(
        <PremierLeagueClient
          initialState={DEFAULT_PREMIER_LEAGUE_STATE}
          snapshot={premierLeagueSnapshot}
        />
      );
    });
    await flushPromises();

    expect(container.querySelector('[data-testid="premier-league-selected-team"]')?.textContent).toBe(
      "Arsenal FC"
    );

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find((tab) =>
        tab.textContent?.includes("Fixtures")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith("/premier-league?view=fixtures&team=57", {
      scroll: false,
    });
  });

  it("canonicalizes invalid query params back to the default route", async () => {
    currentSearchParams = new URLSearchParams("view=bad&team=invalid");

    await act(async () => {
      root.render(
        <PremierLeagueClient
          initialState={DEFAULT_PREMIER_LEAGUE_STATE}
          snapshot={premierLeagueSnapshot}
        />
      );
    });
    await flushPromises();

    expect(mockReplace).toHaveBeenCalledWith("/premier-league", { scroll: false });
  });

  it("renders the selected club immediately after a team picker change", async () => {
    await act(async () => {
      root.render(
        <PremierLeagueClient
          initialState={DEFAULT_PREMIER_LEAGUE_STATE}
          snapshot={premierLeagueSnapshot}
        />
      );
    });
    await flushPromises();

    await act(async () => {
      const button = Array.from(container.querySelectorAll('button[role="tab"]')).find((tab) =>
        tab.textContent?.includes("Club View")
      ) as HTMLButtonElement | undefined;
      button?.click();
    });

    expect(mockPush).toHaveBeenCalledWith("/premier-league?view=team", {
      scroll: false,
    });

    currentSearchParams = new URLSearchParams("view=team");
    await act(async () => {
      root.render(
        <PremierLeagueClient
          initialState={DEFAULT_PREMIER_LEAGUE_STATE}
          snapshot={premierLeagueSnapshot}
        />
      );
    });
    await flushPromises();

    await act(async () => {
      const select = container.querySelector(
        '[data-testid="premier-league-team-select"]'
      ) as HTMLSelectElement | null;
      if (!select) {
        throw new Error("Missing team select");
      }

      select.value = "57";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(mockPush).toHaveBeenCalledWith("/premier-league?view=team&team=57", {
      scroll: false,
    });

    currentSearchParams = new URLSearchParams("view=team&team=57");
    await act(async () => {
      root.render(
        <PremierLeagueClient
          initialState={DEFAULT_PREMIER_LEAGUE_STATE}
          snapshot={premierLeagueSnapshot}
        />
      );
    });

    expect(container.querySelector('[data-testid="premier-league-selected-team"]')?.textContent).toBe(
      "Arsenal FC"
    );
  });

  it("removes unknown team ids from the route and shows the empty club state", async () => {
    currentSearchParams = new URLSearchParams("view=team&team=999");

    await act(async () => {
      root.render(
        <PremierLeagueClient
          initialState={DEFAULT_PREMIER_LEAGUE_STATE}
          snapshot={premierLeagueSnapshot}
        />
      );
    });
    await flushPromises();

    expect(mockReplace).toHaveBeenCalledWith("/premier-league?view=team", {
      scroll: false,
    });
    expect(container.textContent).toContain("Select a club to open the drilldown.");
  });
});
