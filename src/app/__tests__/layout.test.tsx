import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/font/google", () => ({
  Fragment_Mono: () => ({ variable: "font-fragment-mono" }),
  Instrument_Sans: () => ({ variable: "font-instrument-sans" }),
  Instrument_Serif: () => ({ variable: "font-instrument-serif" }),
}));

jest.mock("@/components/Providers", () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/StaticHeader", () => ({
  StaticHeader: () => <header>Header</header>,
}));

jest.mock("@/components/ConditionalLayout", () => ({
  ConditionalLayout: ({ children }: { children: React.ReactNode }) => (
    <main id="main-content">{children}</main>
  ),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("does not render third-party analytics scripts in the app shell", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>Page content</div>
      </RootLayout>
    );

    expect(html).toContain("Page content");
    expect(html).not.toContain("googletagmanager");
    expect(html).not.toContain("google-analytics");
    expect(html).not.toContain("gtag/js");
    expect(html).not.toContain("contentsquare");
    expect(html).not.toContain("t.contentsquare.net");
  });
});
