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

  return (
    <aside
      aria-labelledby="project-build-note-title"
      className="c97-band"
      data-c97-surface="bone"
    >
      <div
        className="c97-shell"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "var(--c97-sp-4)",
          alignItems: "end",
        }}
      >
        <div>
          <p className="c97-kicker">
            {hasProjectContext ? "Project context" : "Build notes"}
          </p>
          <h2
            id="project-build-note-title"
            className="c97-serif c97-h2"
            style={{ marginTop: "var(--c97-sp-2)" }}
          >
            {hasProjectContext ? "What I use it for" : "Why I built it this way"}
          </h2>
          <div
            className="c97-article"
            style={{ marginTop: "var(--c97-sp-2)", color: "var(--c97-ink-2)" }}
          >
            {context ? (
              <>
                <p>{context.purpose}</p>
                <p>{context.method}</p>
              </>
            ) : (
              <p>
                The project write-up covers the product decision, the technical
                tradeoffs, and what I would change after shipping it.
              </p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <Link href={href} className="c97-sectionlink">
            Read the build notes
          </Link>
        </div>
      </div>
    </aside>
  );
}
