import { act, render } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { isAnalyticsEnabled, trackScrollDepth } from "@/lib/analytics";
import { ScrollDepthTracker } from "../ScrollDepthTracker";

jest.mock("@/lib/analytics", () => ({
  isAnalyticsEnabled: jest.fn(() => true),
  trackScrollDepth: jest.fn(),
}));

jest.mock("next/navigation", () => ({ usePathname: jest.fn(() => "/writing/post") }));

const VIEWPORT = window.innerHeight;
let frames: FrameRequestCallback[] = [];

function setPage(scrollHeight: number, scrollY: number) {
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(window, "scrollY", { configurable: true, value: scrollY });
}

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  window.dispatchEvent(new Event("scroll"));
}

function flushFrames() {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((cb) => cb(0)));
}

const percents = () => (trackScrollDepth as jest.Mock).mock.calls.map(([params]) => params.percent_scrolled);

beforeEach(() => {
  frames = [];
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    frames.push(cb);
    return frames.length;
  });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  (trackScrollDepth as jest.Mock).mockClear();
  (isAnalyticsEnabled as jest.Mock).mockReturnValue(true);
  (usePathname as jest.Mock).mockReturnValue("/writing/post");
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ScrollDepthTracker", () => {
  it("fires each milestone once as the reader scrolls a long page", () => {
    // Scrollable distance is 4 viewports.
    setPage(VIEWPORT * 5, 0);
    render(<ScrollDepthTracker />);
    expect(trackScrollDepth).not.toHaveBeenCalled();

    const scrollable = VIEWPORT * 4;
    scrollTo(scrollable * 0.3);
    flushFrames();
    expect(trackScrollDepth).toHaveBeenLastCalledWith({ percent_scrolled: 25, page_path: "/writing/post" });

    scrollTo(scrollable * 0.2);
    flushFrames();
    scrollTo(scrollable * 0.4);
    flushFrames();
    expect(percents()).toEqual([25]);

    scrollTo(scrollable * 0.8);
    flushFrames();
    expect(percents()).toEqual([25, 50, 75]);

    scrollTo(scrollable);
    flushFrames();
    scrollTo(scrollable);
    flushFrames();
    expect(percents()).toEqual([25, 50, 75, 100]);
  });

  it("measures at most once per animation frame", () => {
    setPage(VIEWPORT * 5, 0);
    render(<ScrollDepthTracker />);
    scrollTo(VIEWPORT);
    scrollTo(VIEWPORT * 2);
    scrollTo(VIEWPORT * 4);
    expect(frames).toHaveLength(1);
    flushFrames();
    expect(percents()).toEqual([25, 50, 75, 100]);
  });

  it("counts a page that loads already scrolled", () => {
    setPage(VIEWPORT * 3, VIEWPORT * 1.1);
    render(<ScrollDepthTracker />);
    expect(percents()).toEqual([25, 50]);
  });

  it("ignores pages under one and a half screens tall", () => {
    setPage(VIEWPORT * 1.4, VIEWPORT * 0.4);
    render(<ScrollDepthTracker />);
    scrollTo(VIEWPORT * 0.4);
    flushFrames();
    expect(trackScrollDepth).not.toHaveBeenCalled();
  });

  it("does nothing when analytics is off", () => {
    (isAnalyticsEnabled as jest.Mock).mockReturnValue(false);
    setPage(VIEWPORT * 5, VIEWPORT * 4);
    render(<ScrollDepthTracker />);
    scrollTo(VIEWPORT * 4);
    expect(frames).toHaveLength(0);
    expect(trackScrollDepth).not.toHaveBeenCalled();
  });

  it("starts the milestones over on a client-side navigation", () => {
    setPage(VIEWPORT * 5, VIEWPORT * 4);
    const { rerender } = render(<ScrollDepthTracker />);
    expect(percents()).toEqual([25, 50, 75, 100]);

    (usePathname as jest.Mock).mockReturnValue("/writing/next");
    setPage(VIEWPORT * 5, VIEWPORT * 2);
    rerender(<ScrollDepthTracker />);
    expect((trackScrollDepth as jest.Mock).mock.calls.slice(4).map(([params]) => params)).toEqual([
      { percent_scrolled: 25, page_path: "/writing/next" },
      { percent_scrolled: 50, page_path: "/writing/next" },
    ]);
  });

  it("stops listening and cancels a pending frame on unmount", () => {
    setPage(VIEWPORT * 5, 0);
    const { unmount } = render(<ScrollDepthTracker />);
    scrollTo(VIEWPORT * 4);
    expect(frames).toHaveLength(1);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
    frames = [];
    scrollTo(VIEWPORT * 4);
    expect(frames).toHaveLength(0);
  });
});
