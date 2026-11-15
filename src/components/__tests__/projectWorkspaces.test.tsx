import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ToolComparison } from "@/app/ai-dev-tools/ToolComparison";
import { CompanyResearch } from "@/app/tech-startup-tracker/StartupResearchWorkspace";
import { FollowedRaces } from "@/app/polling-aggregator/FollowedRaces";
import { techStartupSnapshot } from "@/data/techStartupSnapshot";
import {
  resetBrowserStorageMemory,
  writeBrowserStorageJson,
} from "@/lib/browserStorage";
import {
  COMPANY_RESEARCH_KEY,
  FOLLOWED_COMPANIES_KEY,
} from "@/app/tech-startup-tracker/companyResearch";
import { FOLLOWED_RACES_KEY } from "@/app/polling-aggregator/raceFollowing";
import type { PollingSnapshot, Race } from "@/types/polling";

beforeEach(() => {
  resetBrowserStorageMemory();
  localStorage.clear();
});
afterEach(() => {
  jest.restoreAllMocks();
  resetBrowserStorageMemory();
  localStorage.clear();
});

it("restores a named shortlist and requirements and names each select independently of its options", () => {
  const ui = render(<ToolComparison />);
  fireEvent.change(screen.getByRole("combobox", { name: "Add a tool" }), {
    target: { value: "aider" },
  });
  fireEvent.click(screen.getByLabelText("Run local models"));
  fireEvent.change(screen.getByLabelText("Shortlist name"), {
    target: { value: "Terminal tools" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save shortlist" }));
  ui.unmount();
  render(<ToolComparison />);
  fireEvent.click(screen.getByRole("button", { name: "Load Terminal tools" }));
  expect(screen.getByLabelText("Run local models")).toBeChecked();
  expect(screen.getByRole("table")).toHaveTextContent("Local models · Listed");
});

it("keeps a shortlist usable and explains a failed durable save", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("full", "QuotaExceededError");
  });
  render(<ToolComparison />);
  fireEvent.change(screen.getByRole("combobox", { name: "Add a tool" }), {
    target: { value: "aider" },
  });
  fireEvent.change(screen.getByLabelText("Shortlist name"), {
    target: { value: "Memory shortlist" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save shortlist" }));
  expect(
    screen.getByRole("button", { name: "Load Memory shortlist" }),
  ).toBeVisible();
  expect(screen.getByText(/Browser storage is unavailable/)).toBeVisible();
});

it("restores notes after hydration and preserves a round added by another tab", () => {
  const company = techStartupSnapshot.startups[0];
  writeBrowserStorageJson(FOLLOWED_COMPANIES_KEY, [company.id]);
  writeBrowserStorageJson(COMPANY_RESEARCH_KEY, [
    { id: company.id, notes: "Saved research", rounds: [] },
  ]);
  render(<CompanyResearch snapshot={techStartupSnapshot} />);
  expect(screen.getByLabelText("Research notes")).toHaveValue("Saved research");
  const round = {
    id: "other-round",
    date: "2026-10-20",
    stage: "Other tab round",
    amount: null,
    sourceUrl: "https://example.com/round",
  };
  fireEvent.change(screen.getByLabelText("Research notes"), {
    target: { value: "Updated research" },
  });
  act(() => {
    writeBrowserStorageJson(COMPANY_RESEARCH_KEY, [
      { id: company.id, notes: "Saved research", rounds: [round] },
    ]);
  });
  fireEvent.click(screen.getByRole("button", { name: "Save notes" }));
  expect(screen.getByText(/Other tab round/)).toBeVisible();
  expect(JSON.parse(localStorage.getItem(COMPANY_RESEARCH_KEY)!)[0].notes).toBe(
    "Updated research",
  );
});

it("does not recreate research deleted while a note form is open", () => {
  const company = techStartupSnapshot.startups[0];
  writeBrowserStorageJson(FOLLOWED_COMPANIES_KEY, [company.id]);
  writeBrowserStorageJson(COMPANY_RESEARCH_KEY, [
    { id: company.id, notes: "Saved research", rounds: [] },
  ]);
  render(<CompanyResearch snapshot={techStartupSnapshot} />);
  fireEvent.change(screen.getByLabelText("Research notes"), {
    target: { value: "Draft" },
  });
  act(() => {
    writeBrowserStorageJson(COMPANY_RESEARCH_KEY, []);
  });
  fireEvent.click(screen.getByRole("button", { name: "Save notes" }));
  expect(JSON.parse(localStorage.getItem(COMPANY_RESEARCH_KEY)!)).toEqual([]);
  expect(screen.getByRole("status")).toHaveTextContent("record was deleted");
});

it("compares a followed race by candidate identity across source snapshots", () => {
  const race = {
    id: "senate-mi",
    state: "Michigan",
    office: "Senate",
    year: 2026,
    candidates: [
      { name: "A", support: 49 },
      { name: "B", support: 47 },
    ],
    pollCount: 1,
    lastPolled: "2026-10-20",
    polls: [{ id: "one" }],
  } as Race;
  writeBrowserStorageJson(FOLLOWED_RACES_KEY, [race.id]);
  const snapshot = {
    generatedAt: "2026-10-21T00:00:00Z",
    senateRaces: [race],
    governorRaces: [],
  } as unknown as PollingSnapshot;
  const ui = render(<FollowedRaces snapshot={snapshot} onSelect={jest.fn()} />);
  expect(screen.getByText(/seeing this data for the first time/)).toBeVisible();
  ui.rerender(
    <FollowedRaces
      snapshot={{
        ...snapshot,
        generatedAt: "2026-10-25T00:00:00Z",
        senateRaces: [
          {
            ...race,
            candidates: [
              { name: "B", support: 50 },
              { name: "A", support: 48 },
            ],
          },
        ],
      }}
      onSelect={jest.fn()}
    />,
  );
  expect(
    within(screen.getByRole("region", { name: "Races you follow" })).getByText(
      /B's margin changed \+4.0 percentage points/,
    ),
  ).toBeVisible();
});
