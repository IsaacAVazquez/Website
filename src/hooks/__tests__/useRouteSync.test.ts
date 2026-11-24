import { renderHook, waitFor } from "@testing-library/react";
import { useRouteSync } from "../useRouteSync";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useSearchParams: () => new URLSearchParams("view=bad"),
}));

describe("useRouteSync", () => {
  afterEach(() => {
    window.location.hash = "";
    mockReplace.mockReset();
  });

  it("keeps the link's fragment when it rewrites the query", async () => {
    window.location.hash = "#golf-tabpanel-leaderboard";

    renderHook(() => useRouteSync("/golf", "/golf"));

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/golf#golf-tabpanel-leaderboard", { scroll: false })
    );
  });
});
