/// <reference types="chrome" />

import {
  detectAutoDraftProvider,
  startAutoDraftController,
  type AutoDraftCommand,
  type AutoDraftStatus,
} from "./src/autodraft-controller";
import {
  detectDraftSyncProvider,
  startDraftPickSync,
  type DraftPickRead,
} from "./src/draft-pick-sync";

const syncProvider = detectDraftSyncProvider();
const autoDraftProvider = detectAutoDraftProvider();
let readPicks: (() => Promise<DraftPickRead>) | undefined;

if (syncProvider) {
  const pickSync = startDraftPickSync(syncProvider, (message) => {
    void chrome.runtime.sendMessage(message).catch(() => undefined);
  });
  readPicks = pickSync.request;

  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      if (
        !message ||
        typeof message !== "object" ||
        (message as { type?: unknown }).type !== "FANTASY_DRAFT_SYNC_REQUEST"
      ) {
        return false;
      }
      void pickSync.request().then(sendResponse);
      return true;
    }
  );

  window.addEventListener("pagehide", () => pickSync.stop(), { once: true });
}

if (autoDraftProvider) {
  const publish = (status: AutoDraftStatus): void => {
    void chrome.runtime.sendMessage(status).catch(() => undefined);
  };
  const controller = startAutoDraftController(autoDraftProvider, publish, {
    readPicks,
  });

  chrome.runtime.onMessage.addListener(
    (message: AutoDraftCommand, _sender, sendResponse) => {
      if (
        message?.type !== "FANTASY_AUTODRAFT_ARM" &&
        message?.type !== "FANTASY_AUTODRAFT_DISARM"
      ) {
        return false;
      }
      void controller.handleCommand(message).then(sendResponse);
      return true;
    }
  );

  window.addEventListener("pagehide", () => controller.stop(), { once: true });
}
