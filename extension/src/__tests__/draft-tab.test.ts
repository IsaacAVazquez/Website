import { acceptsDraftSync, createDraftCommandSession, draftRoomUrl } from "../draft-tab";

const roomA = "https://fantasy.espn.com/football/draft?leagueId=1&seasonId=2026";
const roomB = "https://fantasy.espn.com/football/draft?leagueId=2&seasonId=2026";

describe("draft tab binding", () => {
  it("sends Stop to the armed tab after the user switches tabs", async () => {
    const query = jest.fn().mockResolvedValue([{ id: 1, url: roomA }]);
    const sendMessage = jest.fn().mockResolvedValue({ armed: true });
    const tabs = { query, sendMessage } as unknown as Pick<typeof chrome.tabs, "query" | "sendMessage">;
    const session = createDraftCommandSession();
    await session.send({ type: "FANTASY_AUTODRAFT_ARM", provider: "espn" }, tabs);
    query.mockResolvedValue([{ id: 2, url: roomB }]);
    sendMessage.mockResolvedValue({ armed: false });
    await session.send({ type: "FANTASY_AUTODRAFT_DISARM", provider: "espn" }, tabs);
    expect(query).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenLastCalledWith(1, { type: "FANTASY_AUTODRAFT_DISARM", provider: "espn" });
    expect(session.getTarget()).toBeNull();
  });

  it("retains the armed target after a lost response and refuses a second room", async () => {
    const query = jest.fn().mockResolvedValue([{ id: 1, url: roomA }]);
    const sendMessage = jest.fn().mockRejectedValue(new Error("Lost response"));
    const tabs = { query, sendMessage } as unknown as Pick<typeof chrome.tabs, "query" | "sendMessage">;
    const session = createDraftCommandSession();
    const arm = { type: "FANTASY_AUTODRAFT_ARM", provider: "espn" } as const;
    await expect(session.send(arm, tabs)).rejects.toThrow("Lost response");
    query.mockResolvedValue([{ id: 2, url: roomB }]);
    await expect(session.send(arm, tabs)).rejects.toThrow("Stop the armed draft");
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(session.getTarget()?.tabId).toBe(1);
  });

  it("rejects background tabs and same-tab navigation to another draft", () => {
    const target = { tabId: 1, roomUrl: draftRoomUrl(roomA)! };
    const message = {
      type: "FANTASY_DRAFT_SYNC", provider: "espn", picks: [],
      observedAt: "2026-09-14T12:00:00Z", roomUrl: roomA,
    } as const;
    const sync = { ...message, picks: [] };
    expect(acceptsDraftSync(target, sync, { tab: { id: 1, url: roomA } })).toBe(true);
    expect(acceptsDraftSync(target, sync, { tab: { id: 2, url: roomA } })).toBe(false);
    expect(acceptsDraftSync(target, { ...sync, roomUrl: roomB }, { tab: { id: 1, url: roomB } })).toBe(false);
    expect(acceptsDraftSync(target, sync, { tab: { id: 1, url: roomB } })).toBe(false);
    expect(acceptsDraftSync(target, { ...sync, roomUrl: undefined }, { tab: { id: 1, url: roomA } })).toBe(false);
    expect(acceptsDraftSync(null, sync, { tab: { id: 1, url: roomA } })).toBe(false);
  });
});
