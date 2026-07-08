import { fireEvent, render, screen } from "@testing-library/react";
import EmailDigestDialog from "../EmailDigestDialog";

describe("EmailDigestDialog", () => {
  it("enables Send only when the email contains an @ and forwards it on submit", () => {
    const onSubmit = jest.fn();
    render(
      <EmailDigestDialog
        isOpen
        onClose={jest.fn()}
        onSubmit={onSubmit}
        sending={false}
      />
    );

    const sendButton = screen.getByRole("button", { name: "Send" });
    expect(sendButton).toBeDisabled();

    const emailInput = screen.getByLabelText("Your email address");
    fireEvent.change(emailInput, { target: { value: "youexample.com" } });
    expect(sendButton).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "you@example.com" } });
    expect(sendButton).toBeEnabled();

    fireEvent.click(sendButton);
    expect(onSubmit).toHaveBeenCalledWith("you@example.com");
  });

  it("ignores Escape while sending but honors it once sending finishes", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <EmailDigestDialog
        isOpen
        onClose={onClose}
        onSubmit={jest.fn()}
        sending
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <EmailDigestDialog
        isOpen
        onClose={onClose}
        onSubmit={jest.fn()}
        sending={false}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps focus with Tab from the last control and Shift+Tab from the first", () => {
    render(
      <EmailDigestDialog
        isOpen
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        sending={false}
      />
    );

    const emailInput = screen.getByLabelText("Your email address");
    // A valid email keeps Send in the focusable set so the trap spans all controls.
    fireEvent.change(emailInput, { target: { value: "you@example.com" } });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    cancelButton.focus();
    expect(document.activeElement).toBe(cancelButton);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(emailInput);

    emailInput.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(cancelButton);
  });
});
