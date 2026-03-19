import fs from "fs";

describe("next.config fantasy redirects", () => {
  it("points fantasy shortcuts and legacy tier pages at the canonical rankings route", async () => {
    const file = fs.readFileSync("next.config.mjs", "utf8");

    expect(file).toContain("source: '/qb'");
    expect(file).toContain("destination: '/fantasy-football?position=qb&scoring=ppr'");
    expect(file).toContain("source: '/rb'");
    expect(file).toContain("destination: '/fantasy-football?position=rb&scoring=ppr'");
    expect(file).toContain("source: '/wr'");
    expect(file).toContain("destination: '/fantasy-football?position=wr&scoring=ppr'");
    expect(file).toContain("source: '/te'");
    expect(file).toContain("destination: '/fantasy-football?position=te&scoring=ppr'");
  });
});
