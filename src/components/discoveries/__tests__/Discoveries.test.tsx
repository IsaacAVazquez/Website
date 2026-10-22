import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RetroHome } from "../RetroHome";
import { WineCork } from "../WineCork";
import { RegistrationGame } from "../RegistrationGame";
import { PortraitControls } from "../PortraitControls";
import { Catalog97Monet } from "@/components/catalog97/Catalog97Monet";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { GUESTBOOK_KEY } from "@/lib/siteDiscoveries";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

beforeEach(() => { localStorage.clear(); resetBrowserStorageMemory(); });
afterEach(() => { jest.restoreAllMocks(); });

it("keeps guestbook text local, restores it, and renders markup as text", () => {
  localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(["Previously here"]));
  const view = render(<RetroHome />);
  expect(screen.getByText("Previously here")).toBeVisible();
  fireEvent.change(screen.getByLabelText(/Leave a message/), { target: { value: '<img src=x onerror="alert(1)">' } });
  fireEvent.click(screen.getByRole("button", { name: "I was here" }));
  expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeVisible();
  expect(view.container.querySelector("img")).toBeNull();
  expect(JSON.parse(localStorage.getItem(GUESTBOOK_KEY)!)).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Clear guestbook" }));
  expect(localStorage.getItem(GUESTBOOK_KEY)).toBeNull();
});

it("keeps an entry signed in another tab when this tab signs next", () => {
  render(<RetroHome />);
  const other = JSON.stringify(["From the other tab"]);
  localStorage.setItem(GUESTBOOK_KEY, other);
  act(() => { window.dispatchEvent(new StorageEvent("storage", { key: GUESTBOOK_KEY, newValue: other })); });
  expect(screen.getByText("From the other tab")).toBeVisible();
  fireEvent.change(screen.getByLabelText(/Leave a message/), { target: { value: "From this tab" } });
  fireEvent.click(screen.getByRole("button", { name: "I was here" }));
  expect(JSON.parse(localStorage.getItem(GUESTBOOK_KEY)!)).toEqual(["From this tab", "From the other tab"]);
});

it("does not claim a guestbook entry was saved when storage rejects it", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  render(<RetroHome />);
  fireEvent.change(screen.getByLabelText(/Leave a message/), { target: { value: "Hello" } });
  fireEvent.click(screen.getByRole("button", { name: "I was here" }));
  expect(screen.getByRole("status")).toHaveTextContent("Browser storage is unavailable");
  expect(screen.getByRole("list", { name: "Your guestbook entries" })).toHaveTextContent("Hello");
});

it("reveals the wine label after three cork inspections and restores focus on closing", () => {
  render(<WineCork />);
  const cork = screen.getByRole("button", { name: "Inspect the cork" });
  fireEvent.click(cork); fireEvent.click(cork);
  expect(screen.queryByText("Château Side Project")).not.toBeInTheDocument();
  fireEvent.click(cork);
  expect(screen.getByText("Château Side Project")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Put the cork back" }));
  expect(cork).toHaveFocus();
  expect(cork).toHaveAttribute("aria-expanded", "false");
});

it("unlocks a souvenir only when every ink axis is registered and resets the puzzle", () => {
  render(<RegistrationGame />);
  expect(screen.queryByRole("button", { name: "Save souvenir print" })).not.toBeInTheDocument();
  screen.getAllByRole("slider").forEach((slider) => fireEvent.change(slider, { target: { value: "0" } }));
  expect(screen.getByRole("button", { name: "Save souvenir print" })).toBeVisible();
  expect(screen.getByRole("status", { name: "Print status" })).toHaveTextContent("Approved for printing");
  fireEvent.click(screen.getByRole("button", { name: "Reset inks" }));
  expect(screen.queryByRole("button", { name: "Save souvenir print" })).not.toBeInTheDocument();
});

it("cycles still portraits and unlocks the gallery with a keyboard or touch control", async () => {
  render(<section data-c97-monet><div data-c97-paint="portrait" data-testid="portrait" /><PortraitControls /><Catalog97Monet /></section>);
  const button = screen.getByRole("button", { name: "Change portrait painter" });
  for (const painter of ["van-gogh", "seurat", "hopper", "lichtenstein"]) {
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByTestId("portrait")).toHaveAttribute("data-c97-painter", painter));
  }
  expect(screen.getByTestId("portrait")).toHaveAttribute("data-c97-still-painting", "true");
  expect(await screen.findByRole("link", { name: "The gallery is open" })).toHaveAttribute("href", "/back-room/gallery");
});
