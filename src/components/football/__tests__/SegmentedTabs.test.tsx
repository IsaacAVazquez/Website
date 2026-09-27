import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedTabs } from "../SegmentedTabs";

const TABS = [
  { id: "club", label: "Club detail" },
  { id: "fixtures", label: "Fixtures" },
  { id: "scorers", label: "Top scorers" },
];

it("lets the keyboard reach every tab", async () => {
  render(
    <SegmentedTabs tabs={TABS} activeId="club" onChange={() => {}} ariaLabel="Detail" idPrefix="t" panelId="p" />
  );
  const user = userEvent.setup();
  await user.tab();
  expect(screen.getByRole("tab", { name: "Club detail" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("tab", { name: "Fixtures" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("tab", { name: "Top scorers" })).toHaveFocus();
});
