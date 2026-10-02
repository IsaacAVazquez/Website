import dynamic from "next/dynamic";
import type { ProjectPress } from "@/constants/projectPress";
import { Catalog97Shell } from "./Catalog97Shell";

const ProjectBuildNote = dynamic(() =>
  import("@/components/ProjectBuildNote").then((mod) => mod.ProjectBuildNote),
);

interface Catalog97ToolShellProps {
  children: React.ReactNode;
  /** The current pathname, used by the build note to look up its prose. */
  route: string;
  /** Link to the build-note write-up, from `projectBuildNoteLinks`. */
  buildNoteHref?: string;
  /** The route's ink pair from `PROJECT_PRESS`. Its second ink becomes the overprint on every sheet in the body. */
  press?: ProjectPress;
  /** True on the dense tools in `WIDE_TOOL_ROUTES`, whose every shell prints on the wide column. */
  wide?: boolean;
}

/**
 * The shell for every route that is not one of the seven designed Catalog 97
 * pages. It is `Catalog97Shell` (header, the only `main`, espresso footer)
 * plus the build-note aside that `ConditionalLayout` used to append. Every
 * route renders its own h1. It puts the `.c97-page` token scope around the route.
 */
export function Catalog97ToolShell({
  children,
  route,
  buildNoteHref,
  press,
  wide,
}: Catalog97ToolShellProps) {
  return (
    <Catalog97Shell wide={wide}>
      <div data-c97-surface="paper" data-c97-press-second={press?.second}>
        {children}
        {buildNoteHref ? <ProjectBuildNote href={buildNoteHref} route={route} /> : null}
      </div>
    </Catalog97Shell>
  );
}
