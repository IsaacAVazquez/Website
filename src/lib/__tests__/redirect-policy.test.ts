import { execFileSync } from "node:child_process";

interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

function loadRedirects(): RedirectRule[] {
  const script = [
    "import config from './next.config.mjs';",
    "process.stdout.write(JSON.stringify(await config.redirects()));",
  ].join("");

  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
  ) as RedirectRule[];
}

const redirects = loadRedirects();
const directLegacyProjectDestinations = {
  "/projects/investment-analytics-platform": "/investments",
  "/projects/textout-platform": "/writing/textout-platform",
  "/projects/runningmate-platform": "/writing/runningmate-platform-launch",
  "/projects/civic-engagement-platform-scale":
    "/writing/scaling-civic-engagement-platform",
  "/projects/campaign-analytics-dashboard":
    "/writing/campaign-self-service-analytics",
  "/projects/qa-automation-framework":
    "/writing/qa-automation-daily-deploys",
  "/projects/pulse-dashboards":
    "/writing/building-the-pulse-dashboard-family",
  "/projects/performance-intelligence":
    "/writing/proactive-performance-intelligence",
  "/projects/pricing-strategy-initiative":
    "/writing/pricing-strategy-initiative",
  "/projects/digital-acquisition-strategy":
    "/writing/digital-acquisition-strategy",
};

describe("redirect policy", () => {
  it.each(Object.entries(directLegacyProjectDestinations))(
    "sends %s directly to its canonical destination",
    (source, destination) => {
      expect(redirects).toContainEqual({
        source,
        destination,
        permanent: true,
      });
    }
  );

  // A page that calls permanentRedirect() under fantasy-football/loading.tsx
  // redirects after the Suspense shell has streamed, so it answers 200 with a
  // meta refresh. A config redirect answers before any rendering.
  it.each([
    ["/fantasy-football/rb-tiers", "/fantasy-football?position=rb&scoring=ppr"],
    [
      "/fantasy-football/tiers/:position",
      "/fantasy-football?position=:position&scoring=ppr",
    ],
  ])("retires %s with a permanent config redirect", (source, destination) => {
    expect(redirects).toContainEqual({ source, destination, permanent: true });
  });

  // src/proxy.ts used to answer these first with a 307, and sent
  // /blog/posts/<slug> to /writing/posts/<slug>, which is a 404.
  it.each([
    ["/blog", "/writing"],
    ["/blog/:slug", "/writing/:slug"],
    ["/blog/posts/:slug", "/writing/:slug"],
  ])("sends legacy %s permanently to %s", (source, destination) => {
    expect(redirects).toContainEqual({ source, destination, permanent: true });
  });

  it("does not chain any exact redirect through another exact source", () => {
    const exactSources = new Set(
      redirects
        .map((redirect) => redirect.source)
        .filter((source) => !source.includes(":"))
    );
    const chains = redirects.filter((redirect) => {
      if (redirect.source.includes(":")) return false;
      const destinationPath = redirect.destination.split(/[?#]/, 1)[0];
      return exactSources.has(destinationPath);
    });

    expect(chains).toEqual([]);
  });
});
