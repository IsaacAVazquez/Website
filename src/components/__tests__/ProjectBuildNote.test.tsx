import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ProjectBuildNote } from "@/components/ProjectBuildNote";

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

  it("renders route context as visible prose when it is provided", () => {
    act(() => {
      root.render(
        <ProjectBuildNote
          href="/writing/example"
          purpose="I use this tool to answer a specific product question."
          method="The page uses a dated public data snapshot."
        />,
      );
    });

    expect(container.querySelector("aside")?.textContent).toContain("What I use it for");
    expect(container.querySelector("aside")?.textContent).toContain(
      "I use this tool to answer a specific product question.",
    );
    expect(container.querySelector("aside")?.textContent).toContain(
      "The page uses a dated public data snapshot.",
    );
    expect(container.querySelector('a[href="/writing/example"]')).not.toBeNull();
  });

  it("keeps the existing build note for routes without added context", () => {
    act(() => {
      root.render(<ProjectBuildNote href="/writing/example" />);
    });

    expect(container.querySelector("aside")?.textContent).toContain("Why I built it this way");
    expect(container.querySelector("aside")?.textContent).toContain(
      "The project write-up covers the product decision",
    );
  });
});
