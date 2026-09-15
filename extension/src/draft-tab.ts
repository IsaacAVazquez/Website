import { detectFantasyDraftProvider, type FantasyDraftSyncMessage } from "@/lib/fantasyCompanion";
import type { AutoDraftCommand } from "./autodraft-controller";

export interface DraftTabTarget {
  tabId: number;
  roomUrl: string;
}

export function draftRoomUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!detectFantasyDraftProvider(url.hostname)) return null;
    url.hash = "";
    url.searchParams.sort();
    return url.href;
  } catch {
    return null;
  }
}

export function acceptsDraftSync(
  target: DraftTabTarget | null,
  message: FantasyDraftSyncMessage,
  sender: { tab?: { id?: number; url?: string } },
): boolean {
  return Boolean(target && sender.tab?.id === target.tabId &&
    draftRoomUrl(sender.tab.url) === target.roomUrl &&
    draftRoomUrl(message.roomUrl) === target.roomUrl);
}

// The binding survives view changes within the side panel. Stop never queries
// the active tab, which may have changed since the user armed the controller.
export function createDraftCommandSession() {
  let target: DraftTabTarget | null = null;
  return {
    getTarget: () => target,
    async send(command: AutoDraftCommand, tabs: Pick<typeof chrome.tabs, "query" | "sendMessage">) {
      if (command.type === "FANTASY_AUTODRAFT_ARM") {
        const [tab] = await tabs.query({ active: true, currentWindow: true });
        const roomUrl = draftRoomUrl(tab?.url);
        if (tab?.id === undefined || !roomUrl ||
            detectFantasyDraftProvider(new URL(roomUrl).hostname) !== command.provider) {
          throw new Error("Open the matching draft room before arming autodraft.");
        }
        if (target && (target.tabId !== tab.id || target.roomUrl !== roomUrl)) {
          throw new Error("Stop the armed draft before arming another room.");
        }
        // Retain the target even if a response is lost, so Stop can still reach it.
        target = { tabId: tab.id, roomUrl };
      }
      if (!target) throw new Error("No draft tab has been armed in this panel.");
      const response: unknown = await tabs.sendMessage(target.tabId, command);
      if (command.type === "FANTASY_AUTODRAFT_DISARM" && response &&
          typeof response === "object" && "armed" in response && response.armed === false) {
        target = null;
      }
      return response;
    },
  };
}
