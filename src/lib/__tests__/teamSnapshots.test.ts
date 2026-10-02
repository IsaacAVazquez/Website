import { capLists, findTeamSnapshot } from "../teamSnapshots";

describe("findTeamSnapshot", () => {
  it("answers a null entry or a prototype key with a 404, not the value", () => {
    const snapshots = { "57": null } as unknown as Record<string, { id: number }>;
    expect(() => findTeamSnapshot(snapshots, "57", "Test")).toThrow(
      expect.objectContaining({ status: 404 })
    );
    expect(() => findTeamSnapshot(snapshots, "constructor", "Test")).toThrow(
      expect.objectContaining({ status: 404 })
    );
  });
});

describe("capLists", () => {
  it("caps only the named lists", () => {
    const capped = capLists({ a: [1, 2, 3], b: [1, 2, 3], c: [1, 2, 3] }, 2, ["a", "b"]);
    expect(capped).toEqual({ a: [1, 2], b: [1, 2], c: [1, 2, 3] });
  });
});
