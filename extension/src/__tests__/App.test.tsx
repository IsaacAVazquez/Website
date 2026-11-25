import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "../App";

const SETUP_KEY = "fantasy-companion-setup-v2";

function savedSetup(): { teams: number; rounds: number; contestId: string } {
  return JSON.parse(window.localStorage.getItem(SETUP_KEY) ?? "null");
}

describe("companion setup", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("sizes an Underdog room from the contest card, not a fixed 12 by 18", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Underdog best ball/ }));
    await user.click(screen.getByRole("button", { name: /6-Man/ }));
    await waitFor(() =>
      expect(savedSetup()).toMatchObject({ contestId: "six-man", teams: 6, rounds: 18 })
    );

    await user.click(screen.getByRole("button", { name: /Superflex/ }));
    await waitFor(() =>
      expect(savedSetup()).toMatchObject({ contestId: "superflex", teams: 12, rounds: 20 })
    );
  });
});
