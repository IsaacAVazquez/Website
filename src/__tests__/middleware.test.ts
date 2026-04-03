/** @jest-environment node */

import { NextRequest } from "next/server";
import middleware, { config } from "@/middleware";

describe("middleware security headers", () => {
  it("keeps CSP enabled for HTML routes without analytics vendor domains", () => {
    expect(config.matcher).toContain("/((?!_next/static|_next/image|favicon.ico|api/).*)");

    const response = middleware(new NextRequest("https://example.com/about"));
    const contentSecurityPolicy = response.headers.get("Content-Security-Policy");

    expect(contentSecurityPolicy).toBeTruthy();
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com");
    expect(contentSecurityPolicy).not.toContain("googletagmanager");
    expect(contentSecurityPolicy).not.toContain("google-analytics.com");
    expect(contentSecurityPolicy).not.toContain("contentsquare");
    expect(response.headers.get("Netlify-CDN-Cache-Control")).toBe("no-store");
  });
});
