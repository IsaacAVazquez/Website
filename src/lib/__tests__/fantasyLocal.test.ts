import {
  FANTASY_COMPARE_LIMIT,
  FANTASY_NOTE_MAX_LENGTH,
  FANTASY_QUEUE_STORAGE_KEY,
  loadIdList,
  parseIdList,
  parseNotes,
  reorderIds,
  saveIdList,
  setNoteEntry,
  toggleId,
  toggleIdCapped,
} from "@/lib/fantasyLocal";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

afterEach(() => {
  resetBrowserStorageMemory();
  localStorage.clear();
  jest.restoreAllMocks();
});

describe("fantasyLocal id lists", () => {
  it("parses a clean list and de-duplicates preserving order", () => {
    expect(parseIdList('["a","b","a","c"]')).toEqual(["a", "b", "c"]);
  });

  it("returns an empty list for malformed or non-string payloads", () => {
    expect(parseIdList(null)).toEqual([]);
    expect(parseIdList("not json")).toEqual([]);
    expect(parseIdList('[1,2,3]')).toEqual([]);
    expect(parseIdList('{"a":1}')).toEqual([]);
  });

  it("toggles ids in and out", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("respects the cap when toggling the compare tray", () => {
    const full = ["a", "b", "c"];
    expect(full).toHaveLength(FANTASY_COMPARE_LIMIT);
    // Adding a fourth is a no-op.
    expect(toggleIdCapped(full, "d", FANTASY_COMPARE_LIMIT)).toEqual(full);
    // Removing an existing one always works, even at the cap.
    expect(toggleIdCapped(full, "b", FANTASY_COMPARE_LIMIT)).toEqual(["a", "c"]);
  });

  it("reorders within bounds and clamps the target", () => {
    expect(reorderIds(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorderIds(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    // Out-of-range source is a no-op (same reference).
    const list = ["a", "b"];
    expect(reorderIds(list, 5, 0)).toBe(list);
  });

  it("keeps queue writes in memory when durable storage is blocked", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "QuotaExceededError");
    });

    saveIdList(FANTASY_QUEUE_STORAGE_KEY, ["a", "b"]);

    expect(loadIdList(FANTASY_QUEUE_STORAGE_KEY)).toEqual(["a", "b"]);
  });
});

describe("fantasyLocal notes", () => {
  it("parses notes, dropping non-string and empty values", () => {
    expect(parseNotes('{"a":"keep","b":"","c":42}')).toEqual({ a: "keep" });
  });

  it("returns an empty map for malformed payloads", () => {
    expect(parseNotes(null)).toEqual({});
    expect(parseNotes("[]")).toEqual({});
    expect(parseNotes("oops")).toEqual({});
  });

  it("sets and clears a note, trimming to the max length", () => {
    const long = "x".repeat(FANTASY_NOTE_MAX_LENGTH + 50);
    const withNote = setNoteEntry({}, "p1", long);
    expect(withNote.p1).toHaveLength(FANTASY_NOTE_MAX_LENGTH);

    const cleared = setNoteEntry(withNote, "p1", "   ");
    expect(cleared.p1).toBeUndefined();
  });
});
