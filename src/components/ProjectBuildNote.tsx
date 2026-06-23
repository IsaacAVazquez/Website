import Link from "next/link";
import { ArrowRight } from "@/components/ui/ServerIcons";

interface ProjectBuildNoteProps {
  href: string;
}

export function ProjectBuildNote({ href }: ProjectBuildNoteProps) {
  return (
    <aside
      aria-labelledby="project-build-note-title"
      className="border-t border-[var(--home-rule)] bg-[var(--home-paper-alt)]"
    >
      <div className="home-shell py-8 sm:py-10">
        <p className="home-kicker mb-2">Build notes</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2
              id="project-build-note-title"
              className="mb-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--home-ink)]"
            >
              Why I built it this way
            </h2>
            <p className="home-body mb-0">
              The project write-up covers the product decision, the technical tradeoffs, and
              what I would change after shipping it.
            </p>
          </div>
          <Link
            href={href}
            className="home-inline-link inline-flex min-h-[44px] items-center gap-2 self-start py-2 font-semibold sm:self-auto"
          >
            Read the build notes
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
