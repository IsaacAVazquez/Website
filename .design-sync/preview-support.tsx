"use client";

// Preview provider for design-sync cards and claude.ai/design renders.
// Components in this repo assume the Next.js app shell: next-themes for the
// .dark class, an app router for <Link>, and the Next image pipeline. None of
// that exists in a static preview, so this wrapper supplies deterministic
// stand-ins: light theme, a no-op router, and unoptimized images.
//
// Since 2026-09-16 every route renders inside Catalog97ToolShell, whose root
// carries `.c97-page` + `data-c97` (the token scope) and whose content sits in
// a nested `data-c97-surface="paper"` div. The surface rules and the --home-*
// bridge in catalog97.css use the descendant combinator, so both levels are
// needed for components to paint the way they do on the site.
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { imageConfigDefault } from "next/dist/shared/lib/image-config";

const noop = () => {};
const stubRouter = {
  back: noop,
  forward: noop,
  refresh: noop,
  hmrRefresh: noop,
  push: noop,
  replace: noop,
  prefetch: noop,
} as unknown as React.ContextType<typeof AppRouterContext>;

const imageConfig = {
  ...imageConfigDefault,
  unoptimized: true,
} as React.ContextType<typeof ImageConfigContext>;

export function PreviewProvider({ children }: { children?: React.ReactNode }) {
  return (
    <AppRouterContext.Provider value={stubRouter}>
      <ImageConfigContext.Provider value={imageConfig}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div className="c97-page" data-c97 data-c97-surface="paper">
            <div data-c97-surface="paper">{children}</div>
          </div>
        </ThemeProvider>
      </ImageConfigContext.Provider>
    </AppRouterContext.Provider>
  );
}
