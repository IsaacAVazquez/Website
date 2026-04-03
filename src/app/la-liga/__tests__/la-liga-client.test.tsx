import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LaLigaClient } from "../la-liga-client";
import { DEFAULT_LA_LIGA_STATE } from "../la-liga-state";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}));

describe("LaLigaClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("hydrates from the URL state and keeps focused views shareable", async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams("view=europe&club=real-betis");

    render(<LaLigaClient initialState={DEFAULT_LA_LIGA_STATE} />);

    expect(screen.getByRole("heading", { name: "Real Betis" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /relegation fight/i }));

    expect(mockPush).toHaveBeenCalledWith("/la-liga?view=relegation&club=alaves", {
      scroll: false,
    });
  });

  it("canonicalizes hidden club selections for a focused view", async () => {
    currentSearchParams = new URLSearchParams("view=relegation&club=barcelona");

    render(<LaLigaClient initialState={DEFAULT_LA_LIGA_STATE} />);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/la-liga?view=relegation&club=alaves", {
        scroll: false,
      })
    );

    expect(screen.getByRole("heading", { name: "Alaves" })).toBeInTheDocument();
  });
});
