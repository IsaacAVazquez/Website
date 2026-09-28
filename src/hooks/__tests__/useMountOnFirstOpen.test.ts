import { act, renderHook } from "@testing-library/react";
import { useMountOnFirstOpen } from "../useMountOnFirstOpen";

describe("useMountOnFirstOpen", () => {
  it("stays unmounted until the overlay opens, then stays mounted", () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useMountOnFirstOpen(open),
      { initialProps: { open: false } },
    );
    expect(result.current).toBe(false);

    rerender({ open: true });
    expect(result.current).toBe(true);

    // Closing keeps it mounted, so an exit animation has something to run on
    // and focus can return to whatever opened the overlay.
    rerender({ open: false });
    expect(result.current).toBe(true);
  });

  // A deep link opens an overlay before any script runs, so the server has to
  // render it.
  it("is mounted from the first render when it starts open", () => {
    const { result } = renderHook(() => useMountOnFirstOpen(true));
    expect(result.current).toBe(true);
  });

  it("loads the overlay's code once, after the page has settled", () => {
    jest.useFakeTimers();
    try {
      const preload = jest.fn(() => Promise.resolve());
      const { rerender } = renderHook(() => useMountOnFirstOpen(false, preload));
      expect(preload).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(preload).toHaveBeenCalledTimes(1);

      rerender();
      act(() => {
        jest.advanceTimersByTime(10_000);
      });
      expect(preload).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it("drops the pending load when it unmounts first", () => {
    jest.useFakeTimers();
    try {
      const preload = jest.fn(() => Promise.resolve());
      const { unmount } = renderHook(() => useMountOnFirstOpen(false, preload));

      unmount();
      act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(preload).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
