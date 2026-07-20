import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ProjectBuildNote } from "@/components/ProjectBuildNote";
import { PROJECT_BUILD_NOTE_CONTEXT } from "@/components/projectBuildNoteContent";
import { projectBuildNoteLinks } from "@/components/projectBuildNoteLinks";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe("ProjectBuildNote", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders route context as visible prose for routes that have it", () => {
    act(() => {
      root.render(
        <ProjectBuildNote
          href="/writing/building-a-bart-transit-dashboard"
          route="/bay-area-transit"
        />,
      );
    });

    const text = container.querySelector("aside")?.textContent;
    expect(text).toContain("What I use it for");
    expect(text).toContain(PROJECT_BUILD_NOTE_CONTEXT["/bay-area-transit"].purpose);
    expect(text).toContain(PROJECT_BUILD_NOTE_CONTEXT["/bay-area-transit"].method);
    expect(
      container.querySelector('a[href="/writing/building-a-bart-transit-dashboard"]'),
    ).not.toBeNull();
  });

  it("keeps the existing build note for routes without added context", () => {
    act(() => {
      root.render(
        <ProjectBuildNote href="/writing/building-decision-lab" route="/decision-lab" />,
      );
    });

    expect(container.querySelector("aside")?.textContent).toContain("Why I built it this way");
    expect(container.querySelector("aside")?.textContent).toContain(
      "The project write-up covers the product decision",
    );
  });

  it("has a build-note link for every route with authored context", () => {
    // The prose and link maps live in separate modules (the prose is
    // code-split); a context entry without a link would never render.
    const linkedRoutes = new Set(Object.keys(projectBuildNoteLinks));

    for (const route of Object.keys(PROJECT_BUILD_NOTE_CONTEXT)) {
      expect(linkedRoutes).toContain(route);
    }
  });
});
