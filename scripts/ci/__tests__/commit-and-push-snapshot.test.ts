/**
 * @jest-environment node
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Runs the helper every refresh lane pushes through against a bare remote and
// two clones in a temp directory, so the retry, rebase, and conflict branches
// execute and are not only matched as text.
const HELPER = path.join(process.cwd(), "scripts", "ci", "commit-and-push-snapshot.sh");

// Writes public/sitemap.xml as one line built from every file under data/, so
// two clones that each change a data file always conflict on it.
const SITEMAP_STUB = `import fs from "node:fs";
const names = fs.readdirSync("data").sort();
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync(
  "public/sitemap.xml",
  names.map((name) => name + ":" + fs.readFileSync("data/" + name, "utf8").trim()).join(",") + "\\n"
);
`;

describe("commit-and-push-snapshot.sh", () => {
  let root: string;
  let env: NodeJS.ProcessEnv;

  // The identity rides on each command the test itself runs. The helper's own
  // commits take theirs from the local config the helper writes.
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", ["-c", "user.name=Seed", "-c", "user.email=seed@example.com", ...args], {
      cwd,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  const write = (cwd: string, file: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), content);
  };
  const clone = (name: string) => {
    git(root, "clone", "--quiet", "remote.git", name);
    return path.join(root, name);
  };
  const runHelper = (cwd: string, ...pathspecs: string[]) => {
    fs.writeFileSync(env.GITHUB_OUTPUT as string, "");
    const result = spawnSync("bash", [HELPER, "chore: refresh test snapshot", ...pathspecs], {
      cwd,
      env,
      encoding: "utf8",
    });
    return {
      status: result.status,
      log: result.stdout + result.stderr,
      output: fs.readFileSync(env.GITHUB_OUTPUT as string, "utf8"),
    };
  };
  const remoteFile = (file: string) => git(root, "--git-dir", "remote.git", "show", `main:${file}`);

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "commit-helper-"));
    // The helper sleeps between attempts. A stub first on PATH keeps the retry fast.
    const bin = path.join(root, "bin");
    fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, "sleep"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });

    env = {
      ...process.env,
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      // Keep the developer's own git configuration, hooks, and signing out of it.
      GIT_CONFIG_GLOBAL: os.devNull,
      GIT_CONFIG_SYSTEM: os.devNull,
      GITHUB_OUTPUT: path.join(root, "github-output.txt"),
      SNAPSHOT_PUSH_ATTEMPTS: "3",
    };
    for (const name of Object.keys(env)) {
      // GIT_DIR and friends would point git at this checkout, and an inherited
      // author would override the identity the helper sets.
      if (/^GIT_(DIR|WORK_TREE|INDEX_FILE|AUTHOR_|COMMITTER_)/.test(name)) delete env[name];
    }

    git(root, "init", "--quiet", "--bare", "--initial-branch=main", "remote.git");
    const seed = clone("seed");
    git(seed, "checkout", "--quiet", "-b", "main");
    write(seed, "data/a.json", "a1\n");
    write(seed, "data/b.json", "b1\n");
    write(seed, "public/sitemap.xml", "a.json:a1,b.json:b1\n");
    write(seed, "scripts/generatePublicSitemap.mjs", SITEMAP_STUB);
    write(seed, ".gitignore", "node_modules\n");
    git(seed, "add", "-A");
    git(seed, "commit", "--quiet", "-m", "seed");
    git(seed, "push", "--quiet", "origin", "main");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("exits clean and reports changed=false when nothing moved", () => {
    const lane = clone("lane");
    const result = runHelper(lane, "data");

    expect(result.status).toBe(0);
    expect(result.log).toContain("No snapshot changes detected");
    expect(result.output).toBe("changed=false\n");
  });

  it("commits a brand-new untracked artifact and pushes it on the first attempt", () => {
    const lane = clone("lane");
    write(lane, "data/c.json", "c1\n");
    const result = runHelper(lane, "data/c.json");

    expect(result.status).toBe(0);
    expect(result.log).toContain("Pushed on attempt 1.");
    expect(result.output).toBe("changed=true\n");
    expect(remoteFile("data/c.json")).toBe("c1\n");
    expect(git(root, "--git-dir", "remote.git", "log", "-1", "--format=%s|%an", "main").trim()).toBe(
      "chore: refresh test snapshot|github-actions[bot]"
    );
    // No sitemap dependency is installed in this clone, so the sitemap stays put.
    expect(remoteFile("public/sitemap.xml")).toBe("a.json:a1,b.json:b1\n");
  });

  it("rebases and pushes again when another lane landed first on a different file", () => {
    const lane = clone("lane");
    const other = clone("other");
    write(other, "data/a.json", "a2\n");
    git(other, "commit", "--quiet", "-am", "other lane");
    git(other, "push", "--quiet", "origin", "main");

    write(lane, "data/b.json", "b2\n");
    const result = runHelper(lane, "data/b.json");

    expect(result.status).toBe(0);
    expect(result.log).toContain("Push attempt 1/3 rejected. Rebasing onto latest origin/main...");
    expect(result.log).toContain("Pushed on attempt 2.");
    expect(remoteFile("data/a.json")).toBe("a2\n");
    expect(remoteFile("data/b.json")).toBe("b2\n");
  });

  it("fails and leaves a clean tree when another lane changed the same file", () => {
    const lane = clone("lane");
    const other = clone("other");
    write(other, "data/b.json", "theirs\n");
    git(other, "commit", "--quiet", "-am", "other lane");
    git(other, "push", "--quiet", "origin", "main");

    write(lane, "data/b.json", "ours\n");
    const result = runHelper(lane, "data/b.json");

    expect(result.status).toBe(1);
    expect(result.log).toContain("Rebase hit a genuine data conflict; failing the run.");
    expect(git(lane, "status", "--porcelain")).toBe("");
    expect(fs.existsSync(path.join(lane, ".git", "rebase-merge"))).toBe(false);
    expect(remoteFile("data/b.json")).toBe("theirs\n");
  });

  it("regenerates the sitemap when it is the only file in conflict", () => {
    const lane = clone("lane");
    const other = clone("other");
    write(other, "data/a.json", "a2\n");
    write(other, "public/sitemap.xml", "a.json:a2,b.json:b1\n");
    git(other, "commit", "--quiet", "-am", "other lane");
    git(other, "push", "--quiet", "origin", "main");

    // The helper regenerates the sitemap only where the site's dependencies are installed.
    write(lane, "node_modules/gray-matter/package.json", "{}\n");
    write(lane, "data/b.json", "b2\n");
    const result = runHelper(lane, "data/b.json");

    expect(result.status).toBe(0);
    expect(result.log).toContain("Resolving the generated sitemap against the rebased snapshots.");
    expect(result.log).toContain("Pushed on attempt 2.");
    expect(remoteFile("data/a.json")).toBe("a2\n");
    expect(remoteFile("data/b.json")).toBe("b2\n");
    expect(remoteFile("public/sitemap.xml")).toBe("a.json:a2,b.json:b2\n");
  });
});
