import { act, renderHook, waitFor } from "@testing-library/react";
import {
  calculateDraftOrder,
  FANTASY_DRAFT_STORAGE_KEY,
  useDraftState,
} from "./useDraftState";

const SAMPLE_PLAYER = {
  id: "player-1",
  name: "Bijan Robinson",
  team: "ATL",
  position: "RB" as const,
  averageRank: 1,
  projectedPoints: 275,
  standardDeviation: 1.2,
  expertRanks: [1],
};

describe("useDraftState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calculates snake order correctly", () => {
    expect(calculateDraftOrder(1, 4, "snake")).toBe(1);
    expect(calculateDraftOrder(4, 4, "snake")).toBe(4);
    expect(calculateDraftOrder(5, 4, "snake")).toBe(4);
    expect(calculateDraftOrder(8, 4, "snake")).toBe(1);
    expect(calculateDraftOrder(9, 4, "snake")).toBe(1);
  });

  it("advances picks as players are logged", () => {
    const { result } = renderHook(() => useDraftState());

    act(() => {
      result.current.updateSettings({
        totalTeams: 4,
        rounds: 3,
        userTeam: 2,
      });
    });

    act(() => {
      result.current.draftPlayer(SAMPLE_PLAYER);
    });

    expect(result.current.draftState.picks).toHaveLength(1);
    expect(result.current.draftState.picks[0].teamNumber).toBe(1);
    expect(result.current.draftState.currentPick).toBe(2);
    expect(result.current.currentTeamNumber).toBe(2);
  });

  it("quotes CSV fields that contain commas", async () => {
    // Capture the CSV payload from the Blob constructor — jsdom's Blob here
    // does not implement text(), and the download path (createObjectURL/click)
    // needs stubbing in the test DOM.
    const csvParts: string[] = [];
    const OriginalBlob = global.Blob;
    class MockBlob {
      constructor(parts: BlobPart[]) {
        csvParts.push(parts.map(String).join(""));
      }
    }
    global.Blob = MockBlob as unknown as typeof Blob;
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = jest.fn() as unknown as typeof URL.revokeObjectURL;
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    try {
      const { result } = renderHook(() => useDraftState());
      await waitFor(() => expect(result.current.isLoaded).toBe(true));

      act(() => {
        result.current.draftPlayer({
          ...SAMPLE_PLAYER,
          id: "player-comma",
          name: "Smith, Jr.",
          tier: 2,
          minRank: 1,
          maxRank: 3,
          rankEcr: 1,
        });
      });

      act(() => {
        result.current.exportDraftResults("csv");
      });

      const csvText = csvParts[0];

      // UTF-8 BOM so Excel on Windows reads accented names correctly.
      expect(csvText.startsWith("\uFEFF")).toBe(true);
      expect(csvText).toContain('"Smith, Jr."');
      // RFC 4180 CRLF row endings, and the comma inside the quoted name must
      // not create an extra column.
      const dataRow = csvText.split("\r\n")[1];
      expect(dataRow.startsWith("1,1,Team 1,\"Smith, Jr.\",RB,ATL,1,Tier 2,1-3")).toBe(true);
    } finally {
      global.Blob = OriginalBlob;
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      clickSpy.mockRestore();
    }
  });

  it("persists the draft to localStorage", async () => {
    const { result, unmount } = renderHook(() => useDraftState());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.draftPlayer(SAMPLE_PLAYER);
    });

    expect(JSON.parse(localStorage.getItem(FANTASY_DRAFT_STORAGE_KEY) || "{}").picks).toHaveLength(1);

    unmount();

    const { result: restoredResult } = renderHook(() => useDraftState());
    await waitFor(() => expect(restoredResult.current.isLoaded).toBe(true));

    expect(restoredResult.current.draftState.picks).toHaveLength(1);
    expect(restoredResult.current.draftState.picks[0].player.name).toBe("Bijan Robinson");
  });
});
