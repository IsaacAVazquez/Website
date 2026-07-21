"use client";

// Preview provider for design-sync cards and claude.ai/design renders.
// Components in this repo assume the Next.js app shell: next-themes for the
// .dark class, an app router for <Link>, and the Next image pipeline. None of
// that exists in a static preview, so this wrapper supplies deterministic
// stand-ins: light theme, a no-op router, and unoptimized images.
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
          {children}
        </ThemeProvider>
      </ImageConfigContext.Provider>
    </AppRouterContext.Provider>
  );
}
