import Link from "next/link";
import { PROJECT_BUILD_NOTE_CONTEXT } from "@/components/projectBuildNoteContent";

interface ProjectBuildNoteProps {
  href: string;
  route: string;
}

const PLACEHOLDER =
  "The project write-up covers the product decision, the technical tradeoffs, and what I would change after shipping it.";

// The purpose prose lives in projectBuildNoteContent and is looked up here
// (not passed from Catalog97ToolShell) so the whole aside, component and
// prose, code-splits into one chunk that only build-note routes load.
export function ProjectBuildNote({ href, route }: ProjectBuildNoteProps) {
  const context = PROJECT_BUILD_NOTE_CONTEXT[route];

  // A colophon, not a section: the heading, one paragraph, and the link on
  // one line at desktop widths, stacked on a phone. Projects own their design
  // above this strip (docs/superpowers/specs/2026-10-11-project-sovereign-design.md),
  // so it stays quiet and never reads as a second hero. The method belongs to
  // the write-up the link opens.
  return (
    <aside
      aria-labelledby="project-build-note-title"
      className="c97-band c97-sheet"
      data-c97-surface="bone"
      data-seam="deckle"
      style={{ paddingBlock: "var(--c97-sp-3)" }}
    >
      <div
        className="c97-shell"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          columnGap: "var(--c97-sp-4)",
          rowGap: "var(--c97-sp-1)",
        }}
      >
        <h2
          id="project-build-note-title"
          className="c97-serif"
          style={{ flex: "0 0 auto", margin: 0, fontSize: "var(--c97-fs-lead)" }}
        >
          {context ? "What I use it for" : "Why I built it this way"}
        </h2>
        <p
          style={{
            flex: "1 1 32ch",
            minWidth: 0,
            maxWidth: "72ch",
            margin: 0,
            fontSize: "var(--c97-fs-small)",
            lineHeight: "var(--c97-lh-body)",
            color: "var(--c97-ink-2)",
          }}
        >
          {context ? context.purpose : PLACEHOLDER}
        </p>
        <Link href={href} className="c97-sectionlink" style={{ flex: "0 0 auto" }}>
          Read the build notes
        </Link>
      </div>
    </aside>
  );
}
