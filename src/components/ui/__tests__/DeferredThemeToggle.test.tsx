import { Suspense } from "react";

import { DeferredThemeToggle } from "../DeferredThemeToggle";

describe("DeferredThemeToggle", () => {
  // The toggle is client-only, so React renders it after hydration and shows
  // its placeholder until then. With no boundary of its own around that, the
  // page content on every dashboard hydrated about 225 ms later, 310 to 346 ms
  // against 84 to 118 ms, measured in Chromium on a local production build
  // with the header hydrating at the same time either way.
  it("puts the client-only toggle inside a Suspense boundary of its own", () => {
    const element = DeferredThemeToggle({ className: "toggle" });

    expect(element.type).toBe(Suspense);
    expect(element.props.fallback).toBeTruthy();
    expect(element.props.children.props.className).toBe("toggle");
  });
});
