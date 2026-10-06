import { act, fireEvent, render, screen } from "@testing-library/react";
import { resetBrowserStorageMemory } from "@/lib/browserStorage";
import { TravelDealLabClient } from "../travel-deal-lab-client";

const STORAGE_KEY = "travel-deals:v1";
const SAVED_TRIP = {
  regionId: "western-europe",
  departureDate: "2026-12-10",
  nights: 8,
  travelers: 4,
  budget: 6000,
  checkedTactics: [],
};

describe("TravelDealLabClient number fields", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetBrowserStorageMemory();
  });

  it("lets a field go blank while retyping and says when it clamps", () => {
    render(<TravelDealLabClient />);
    const travelers = screen.getByLabelText("Travelers");

    fireEvent.change(travelers, { target: { value: "" } });
    expect(travelers).toHaveValue(null);

    fireEvent.change(travelers, { target: { value: "40" } });
    expect(screen.getByText(/runs from 1 to 12, so I.m using 12/)).toBeVisible();

    fireEvent.blur(travelers);
    expect(travelers).toHaveValue(12);
    expect(screen.queryByText(/runs from 1 to 12/)).not.toBeInTheDocument();
  });

  it("updates the trip from another tab and restores defaults when storage is cleared", () => {
    render(<TravelDealLabClient />);
    const value = JSON.stringify(SAVED_TRIP);

    act(() => {
      window.localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: value }));
    });

    expect(screen.getByLabelText("Departure date")).toHaveValue("2026-12-10");
    expect(screen.getByLabelText("Nights")).toHaveValue(8);
    expect(screen.getByLabelText("Travelers")).toHaveValue(4);

    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    expect(screen.getByLabelText("Departure date")).toHaveValue("");
    expect(screen.getByLabelText("Nights")).toHaveValue(5);
  });

  it("merges an edited field into the latest saved trip before a storage event arrives", () => {
    render(<TravelDealLabClient />);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SAVED_TRIP));

    fireEvent.change(screen.getByLabelText("Nights"), { target: { value: "9" } });

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual({
      ...SAVED_TRIP,
      nights: 9,
      quotedFare: 0,
    });
    expect(screen.getByLabelText("Departure date")).toHaveValue("2026-12-10");
  });

  it("opens a first visit with no fare and asks for one", () => {
    render(<TravelDealLabClient />);
    expect(screen.getByLabelText("Quoted fare, whole party (USD)")).toHaveValue(0);
    expect(screen.getByText("Add a fare below")).toBeInTheDocument();
    expect(screen.getByText("Your trip, fare, and budget are saved in this browser.")).toBeInTheDocument();
  });

  it("saves the quoted fare with the trip and restores it on a return visit", () => {
    const first = render(<TravelDealLabClient />);
    fireEvent.change(screen.getByLabelText("Quoted fare, whole party (USD)"), { target: { value: "600" } });

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).quotedFare).toBe(600);
    // Two travelers by default, so the readout is the per-seat fare.
    expect(screen.getAllByText("$300").length).toBeGreaterThan(0);

    first.unmount();
    resetBrowserStorageMemory();
    render(<TravelDealLabClient />);
    expect(screen.getByLabelText("Quoted fare, whole party (USD)")).toHaveValue(600);
    expect(screen.getAllByText("$300").length).toBeGreaterThan(0);
    expect(screen.queryByText("Add a fare below")).not.toBeInTheDocument();
  });

  it("reads a saved fare that is missing or out of range as a bounded number", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...SAVED_TRIP, quotedFare: "lots" }));
    const first = render(<TravelDealLabClient />);
    expect(screen.getByLabelText("Quoted fare, whole party (USD)")).toHaveValue(0);
    first.unmount();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...SAVED_TRIP, quotedFare: 9_999_999 }));
    resetBrowserStorageMemory();
    render(<TravelDealLabClient />);
    expect(screen.getByLabelText("Quoted fare, whole party (USD)")).toHaveValue(100_000);
  });

  it("opens the playbook on six tactics and shows the rest on request", () => {
    render(<TravelDealLabClient />);
    const applyButtons = () => screen.getAllByRole("button", { name: "Mark applied" });
    expect(applyButtons()).toHaveLength(6);

    const toggle = screen.getByRole("button", { name: /^Show all \d+ tactics$/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(applyButtons().length).toBeGreaterThan(6);
    expect(screen.getByRole("button", { name: "Show fewer tactics" })).toHaveAttribute("aria-expanded", "true");
  });
});
