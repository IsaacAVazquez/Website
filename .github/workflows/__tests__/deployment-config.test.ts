/**
 * @jest-environment node
 */
import { spawnSync } from "child_process";
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

  it("keeps metered Netlify builds off main and dependabot branches", () => {
    const config = fs.readFileSync(
      path.join(process.cwd(), "netlify.toml"),
      "utf8"
    );

    expect(config).toContain('ignore = "sh scripts/ci/netlify-ignore.sh"');

    // Netlify inverts the usual convention, so exit 0 cancels the build and a
    // non-zero exit runs it. publish-data.yml builds and uploads production, so
    // Netlify must not build main as well, and dependabot previews are what
    // exhausted the account's 300 monthly build minutes on 2026-08-06. Human
    // pull requests still get a preview.
    const decide = (branch: string) =>
      spawnSync("sh", ["scripts/ci/netlify-ignore.sh"], {
        env: { ...process.env, BRANCH: branch },
      }).status;

    expect(decide("main")).toBe(0);
    expect(decide("dependabot/npm_and_yarn/next-16.0.1")).toBe(0);
    expect(decide("feat/rankings-drawer")).not.toBe(0);
  });
});
