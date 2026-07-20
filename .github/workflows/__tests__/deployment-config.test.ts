/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

describe("production deployment packaging", () => {
  it("packages committed investment snapshots with the server function", () => {
    const config = fs.readFileSync(
      path.join(process.cwd(), "netlify.toml"),
      "utf8"
    );

    expect(config).toMatch(
      /included_files\s*=\s*\["public\/data\/investments\/\*\*"\]/
    );
  });
});
