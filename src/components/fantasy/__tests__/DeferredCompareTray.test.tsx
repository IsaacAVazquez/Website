import { act, render, screen } from "@testing-library/react";

import { resetBrowserStorageMemory } from "@/lib/browserStorage";

import { DeferredCompareTray } from "../DeferredCompareTray";

jest.mock("../CompareTray", () => ({
  CompareTray: () => <div data-testid="compare-tray" />,
}));

describe("DeferredCompareTray", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  // The tray draws nothing while no player is pinned, so mounting it early
  // shows nothing. What it buys is the first pin, which otherwise waits on
  // React holding a lazy component's first render for 300 ms.
  it("is mounted, with nothing pinned, once its code has loaded in idle time", async () => {
    jest.useFakeTimers();
    try {
      render(<DeferredCompareTray resolvePlayer={() => undefined} />);
      expect(screen.queryByTestId("compare-tray")).not.toBeInTheDocument();

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(await screen.findByTestId("compare-tray")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
