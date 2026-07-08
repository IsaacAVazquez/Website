import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { useTablistKeyboard } from "../useTablistKeyboard";

const ITEMS = ["alpha", "beta", "gamma"];

function Tablist({ onSelect }: { onSelect: (item: string) => void }) {
  const onKeyDown = useTablistKeyboard(ITEMS, onSelect);
  return (
    <div role="tablist">
      {ITEMS.map((item, index) => (
        <button
          key={item}
          role="tab"
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

describe("useTablistKeyboard", () => {
  it("moves focus to the next tab on ArrowRight", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });

    expect(document.activeElement).toBe(tabs[1]);
    expect(onSelect).toHaveBeenCalledWith("beta");
  });

  it("wraps from the last tab back to the first on ArrowRight", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[2], { key: "ArrowRight" });

    expect(document.activeElement).toBe(tabs[0]);
    expect(onSelect).toHaveBeenCalledWith("alpha");
  });

  it("moves focus to the previous tab on ArrowLeft", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[1], { key: "ArrowLeft" });

    expect(document.activeElement).toBe(tabs[0]);
    expect(onSelect).toHaveBeenCalledWith("alpha");
  });

  it("wraps from the first tab to the last on ArrowLeft", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[0], { key: "ArrowLeft" });

    expect(document.activeElement).toBe(tabs[2]);
    expect(onSelect).toHaveBeenCalledWith("gamma");
  });

  it("jumps to the first tab on Home", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[2], { key: "Home" });

    expect(document.activeElement).toBe(tabs[0]);
    expect(onSelect).toHaveBeenCalledWith("alpha");
  });

  it("jumps to the last tab on End", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    fireEvent.keyDown(tabs[0], { key: "End" });

    expect(document.activeElement).toBe(tabs[2]);
    expect(onSelect).toHaveBeenCalledWith("gamma");
  });

  it("activates the focused tab on Enter, calls onSelect with that item, and prevents default", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    // fireEvent returns false when a handler called preventDefault.
    const notPrevented = fireEvent.keyDown(tabs[1], { key: "Enter" });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("beta");
    expect(notPrevented).toBe(false);
  });

  it("activates the focused tab on Space, calls onSelect with that item, and prevents default", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");

    const notPrevented = fireEvent.keyDown(tabs[2], { key: " " });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("gamma");
    expect(notPrevented).toBe(false);
  });

  it("ignores unrelated keys without moving focus, selecting, or preventing default", () => {
    const onSelect = jest.fn();
    render(<Tablist onSelect={onSelect} />);
    const tabs = screen.getAllByRole("tab");
    tabs[1].focus();

    const notPrevented = fireEvent.keyDown(tabs[1], { key: "a" });

    expect(onSelect).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(tabs[1]);
    expect(notPrevented).toBe(true);
  });
});
