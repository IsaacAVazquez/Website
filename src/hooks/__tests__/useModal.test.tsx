import React, { useRef } from "react";
import { render, screen } from "@testing-library/react";
import { useModal } from "../useModal";

function Panel({ open, lockScroll, resetKey }: { open: boolean; lockScroll?: boolean; resetKey?: string }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, open, () => {}, { lockScroll, resetKey });
  return (
    <div ref={panelRef} tabIndex={-1} data-testid="panel">
      <button>{resetKey ?? "inside"}</button>
    </div>
  );
}

describe("useModal", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("locks page scroll while open and restores it on close", () => {
    const { rerender } = render(<Panel open />);
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<Panel open={false} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("leaves page scroll alone when lockScroll is false", () => {
    render(<Panel open lockScroll={false} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("moves focus back into the panel when resetKey changes while open", () => {
    const { rerender } = render(<Panel open resetKey="arsenal" />);
    screen.getByRole("button").focus();
    rerender(<Panel open resetKey="chelsea" />);
    expect(document.activeElement).toBe(screen.getByTestId("panel"));
  });
});
