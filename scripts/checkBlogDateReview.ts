import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { reviewBlogDateChange } from "./blogDateReview";

interface ChangedBlogFile {
  status: "A" | "M" | "R";
  previousPath?: string;
  currentPath: string;
}

function readArgument(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function listChangedBlogFiles(base: string): ChangedBlogFile[] {
  const output = execFileSync(
    "git",
    [
      "diff",
      "--name-status",
      "--find-renames",
      "--diff-filter=AMR",
      `${base}...HEAD`,
      "--",
      "content/blog",
    ],
    { encoding: "utf8" }
  );

  const changes: ChangedBlogFile[] = [];
  for (const line of output.split("\n").filter(Boolean)) {
    const [rawStatus, firstPath, secondPath] = line.split("\t");
    const status = rawStatus.slice(0, 1);

    if (status === "A" && firstPath) {
      changes.push({ status: "A", currentPath: firstPath });
    } else if (status === "M" && firstPath) {
      changes.push({ status: "M", currentPath: firstPath });
    } else if (status === "R" && firstPath && secondPath) {
      changes.push({
        status: "R",
        previousPath: firstPath,
        currentPath: secondPath,
      });
    }
  }
  return changes;
}

function readAtRevision(revision: string, filePath: string): string {
  return execFileSync("git", ["show", `${revision}:${filePath}`], {
    encoding: "utf8",
  });
}

function main() {
  const base = readArgument("base");
  if (!base) {
    throw new Error(
      "Pass --base <git revision> so article body changes can be compared."
    );
  }
  if (/^0+$/.test(base)) {
    console.log("No prior revision is available for the writing date review.");
    return;
  }

  const failures: string[] = [];
  for (const change of listChangedBlogFiles(base)) {
    if (change.status === "A") continue;

    const previousPath = change.previousPath ?? change.currentPath;
    const previousSource = readAtRevision(base, previousPath);
    const currentSource = fs.readFileSync(change.currentPath, "utf8");
    const review = reviewBlogDateChange(previousSource, currentSource);

    if (review.bodyChanged && !review.dateReviewed) {
      failures.push(change.currentPath);
    }
  }

  if (failures.length > 0) {
    throw new Error(
      [
        "Article body text changed without an updatedAt review:",
        ...failures.map((filePath) => `  ${filePath}`),
        "Change updatedAt in the same pull request when the edit is substantive.",
      ].join("\n")
    );
  }

  console.log("Writing freshness dates match the changed article bodies.");
}

main();
