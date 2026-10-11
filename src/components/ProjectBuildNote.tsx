import Link from "next/link";
import { PROJECT_BUILD_NOTE_CONTEXT } from "@/components/projectBuildNoteContent";

interface ProjectBuildNoteProps {
  href: string;
  route: string;
}

// The purpose/method prose lives in projectBuildNoteContent and is looked up
// here (not passed from Catalog97ToolShell) so the whole aside, component and
// prose, code-splits into one chunk that only build-note routes load.
export function ProjectBuildNote({ href, route }: ProjectBuildNoteProps) {
  const context = PROJECT_BUILD_NOTE_CONTEXT[route];
  const hasProjectContext = Boolean(context);

  // One compact row on the frame's paper: the heading and link in the first
  // column, the purpose and method beside it. Projects own their design above
  // this strip (docs/superpowers/specs/2026-10-11-project-sovereign-design.md),
  // so the strip stays quiet and never becomes a second hero.
  return (
    <aside
      aria-labelledby="project-build-note-title"
      className="c97-band c97-sheet"
      data-c97-surface="bone"
      data-seam="deckle"
      style={{ paddingBlock: "var(--c97-sp-4)" }}
    >
      <div
        className="c97-shell"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: "var(--c97-sp-4)",
          alignItems: "start",
        }}
      >
        <div>
          <p className="c97-kicker">
            {hasProjectContext ? "Project context" : "Build notes"}
          </p>
          <h2
            id="project-build-note-title"
            className="c97-serif c97-h3"
            style={{ marginTop: "var(--c97-sp-1)" }}
          >
            {hasProjectContext ? "What I use it for" : "Why I built it this way"}
          </h2>
          <Link
            href={href}
            className="c97-sectionlink"
            style={{ display: "inline-flex", marginTop: "var(--c97-sp-2)" }}
          >
            Read the build notes
          </Link>
        </div>
        {context ? (
          <>
            <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
              {context.purpose}
            </p>
            <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
              {context.method}
            </p>
          </>
        ) : (
          <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
            The project write-up covers the product decision, the technical
            tradeoffs, and what I would change after shipping it.
          </p>
        )}
      </div>
    </aside>
  );
}
