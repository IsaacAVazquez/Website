import { act, fireEvent, render, screen } from "@testing-library/react";
import { UserTeams } from "../UserTeams";
import { TEAM_RECORDS_KEY } from "../teamRecords";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";

beforeEach(() => { localStorage.clear(); resetBrowserStorageMemory(); });
it("saves a real team, restores progress, merges another tab's name, and creates after removal", () => {
  const view = render(<UserTeams />);
  fireEvent.change(screen.getByLabelText("Team name"), { target: { value: "Payments" } });
  fireEvent.click(screen.getByRole("button", { name: "Save team" }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Complete Name the first workflows/ }));
  expect(screen.getByText("1 of 5 steps complete.")).toBeVisible();
  view.unmount(); render(<UserTeams />);
  fireEvent.click(screen.getByRole("button", { name: "Edit Payments" }));
  expect(screen.getByRole("checkbox", { name: /Complete Name the first workflows/ })).toBeChecked();
  const saved = JSON.parse(localStorage.getItem(TEAM_RECORDS_KEY)!);
  const concurrent = JSON.stringify([{ ...saved[0], name: "Platform" }]);
  act(() => { localStorage.setItem(TEAM_RECORDS_KEY, concurrent); window.dispatchEvent(new StorageEvent("storage", { key: TEAM_RECORDS_KEY, newValue: concurrent })); });
  fireEvent.change(screen.getByLabelText("Resolved questions"), { target: { value: "8" } });
  fireEvent.click(screen.getByRole("button", { name: "Save team changes" }));
  expect(screen.getByLabelText("Team name")).toHaveValue("Platform");
  fireEvent.click(screen.getByRole("button", { name: "Remove Platform" }));
  fireEvent.change(screen.getByLabelText("Team name"), { target: { value: "New team" } });
  fireEvent.click(screen.getByRole("button", { name: "Save team" }));
  expect(screen.getByRole("button", { name: "Edit New team" })).toBeVisible();
});
