import {
  getBrowserStorageSnapshot,
  readBrowserStorageString,
  readValidatedBrowserStorage,
  resetBrowserStorageMemory,
  subscribeBrowserStorage,
  writeBrowserStorageString,
} from "../browserStorage";

describe("browserStorage", () => {
  beforeEach(() => {
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetBrowserStorageMemory();
    window.localStorage.clear();
  });

  it("notifies same-tab subscribers after a guarded write", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeBrowserStorage("example", listener);

    expect(writeBrowserStorageString("example", "new value")).toBe("persistent");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getBrowserStorageSnapshot("example", "fallback")).toBe("new value");
    unsubscribe();
  });

  it("updates cached snapshots from cross-tab storage events", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeBrowserStorage("example", listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "example",
        newValue: "from another tab",
        storageArea: window.localStorage,
      }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getBrowserStorageSnapshot("example", "fallback")).toBe("from another tab");
    unsubscribe();
  });

  it("retains the newest value in memory when localStorage rejects a write", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "QuotaExceededError");
    });

    expect(writeBrowserStorageString("example", "unsaved value")).toBe("memory-only");
    expect(readBrowserStorageString("example")).toEqual({
      value: "unsaved value",
      persistenceStatus: "memory-only",
    });
  });

  it("returns a validated fallback without overwriting malformed JSON", () => {
    window.localStorage.setItem("example", "{not-json");

    const result = readValidatedBrowserStorage(
      "example",
      (value) => (Array.isArray(value) ? value : undefined),
      () => [],
    );

    expect(result).toMatchObject({ value: [], source: "invalid" });
    expect(window.localStorage.getItem("example")).toBe("{not-json");
  });
});
