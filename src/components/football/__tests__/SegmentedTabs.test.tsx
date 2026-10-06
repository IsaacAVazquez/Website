import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SegmentedTabs } from "../SegmentedTabs";

const TABS = [
  { id: "club", label: "Club detail" },
  { id: "fixtures", label: "Fixtures" },
  { id: "scorers", label: "Top scorers" },
];

function TabsHarness() {
  const [activeId, setActiveId] = useState("club");
  return (
    <>
      <SegmentedTabs tabs={TABS} activeId={activeId} onChange={setActiveId} ariaLabel="Detail" idPrefix="t" panelId="p" />
      <button type="button">After tabs</button>
    </>
  );
}

it("uses one Tab stop and moves selection with arrows, Home, and End", async () => {
  render(<TabsHarness />);
  const user = userEvent.setup();
  await user.tab();
  expect(screen.getByRole("tab", { name: "Club detail" })).toHaveFocus();

  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Fixtures" })).toHaveFocus();
  expect(screen.getByRole("tab", { name: "Fixtures" })).toHaveAttribute("aria-selected", "true");

  await user.keyboard("{End}");
  expect(screen.getByRole("tab", { name: "Top scorers" })).toHaveFocus();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Club detail" })).toHaveFocus();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("tab", { name: "Top scorers" })).toHaveFocus();
  await user.keyboard("{Home}");
  expect(screen.getByRole("tab", { name: "Club detail" })).toHaveFocus();

  await user.tab();
  expect(screen.getByRole("button", { name: "After tabs" })).toHaveFocus();
});
