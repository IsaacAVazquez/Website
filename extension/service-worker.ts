/// <reference types="chrome" />

async function enableActionOpening(): Promise<void> {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

chrome.runtime.onInstalled.addListener(() => {
  void enableActionOpening();
});

chrome.runtime.onStartup.addListener(() => {
  void enableActionOpening();
});

void enableActionOpening();
