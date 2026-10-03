import { expect, type Page, type Request } from "@playwright/test";

interface PrefetchState {
  pending: Set<Request>;
  updatedAt: number;
}

const prefetches = new WeakMap<Page, PrefetchState>();

function watchPrefetches(page: Page) {
  if (prefetches.has(page)) return;
  const state: PrefetchState = { pending: new Set(), updatedAt: Date.now() };
  prefetches.set(page, state);
  page.on("request", (request) => {
    if (new URL(request.url()).searchParams.has("_rsc")) {
      state.pending.add(request);
      state.updatedAt = Date.now();
    }
  });
  const finished = (request: Request) => {
    if (state.pending.delete(request)) state.updatedAt = Date.now();
  };
  page.on("requestfinished", finished);
  page.on("requestfailed", finished);
}

async function waitForPrefetches(page: Page) {
  const state = prefetches.get(page)!;
  // Rapid full-page navigation cancels Next route prefetches, which WebKit
  // reports as page errors. Let those requests settle before discarding the
  // document. Live dashboard API polling does not delay this wait.
  await expect.poll(() => state.pending.size === 0 && Date.now() - state.updatedAt >= 500,
    { timeout: 10_000, message: "background route prefetches finish before navigation" }
  ).toBe(true);
}

async function waitForControls(page: Page) {
  // The header and tool can hydrate in different boundaries. An SSR input
  // needs its own handlers attached before a test starts typing into it.
  await page.waitForFunction(() => {
    const controls = [...document.querySelectorAll("header button, main input, main select, main textarea, main button")];
    return controls.length > 0 && controls.every((control) =>
      Object.keys(control).some((key) => key.startsWith("__reactFiber"))
    );
  });
}

export async function openTool(page: Page, route: string) {
  watchPrefetches(page);
  if (page.url() !== "about:blank") await waitForPrefetches(page);
  expect((await page.goto(route))?.status()).toBeLessThan(400);
  await expect(page.locator("h1")).toBeVisible();
  await waitForControls(page);
}

export async function reloadTool(page: Page) {
  await waitForPrefetches(page);
  await page.reload();
  await waitForControls(page);
}
