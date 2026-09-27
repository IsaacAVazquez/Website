"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Email-digest modal for the MBA tracker. Code-split via `next/dynamic` and
 * mounted only while open, so its focus-trap logic stays out of the initial bundle.
 */
export default function EmailDigestDialog({
  isOpen,
  onClose,
  onSubmit,
  sending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  sending: boolean;
}) {
  const [email, setEmail] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<Element | null>(null);

  // Trap focus within the dialog while open and restore it on close.
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement;
    const dialog: HTMLDivElement | null = dialogRef.current;
    if (!dialog) return;
    const dialogEl: HTMLDivElement = dialog;

    const focusable = dialogEl.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !sending) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = dialogEl.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, sending]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !sending) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-digest-title"
        aria-describedby="email-digest-description"
        className="c97-panel c97-offset w-full max-w-sm"
        style={{ background: "var(--c97-surface)" }}
      >
        <h2
          id="email-digest-title"
          className="mb-3 text-lg font-semibold"
          style={{ fontFamily: "var(--c97-font-body)", color: "var(--c97-ink)" }}
        >
          Send email digest
        </h2>
        <p
          id="email-digest-description"
          className="mb-4 text-sm"
          style={{ color: "var(--c97-ink-2)" }}
        >
          Enter your email to receive the current job list as a digest.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="c97-field"
          style={{ marginBottom: "var(--c97-sp-3)" }}
          disabled={sending}
          autoComplete="email"
          aria-label="Your email address"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onSubmit(email)}
            disabled={sending || !email.includes("@")}
            className="c97-btn flex-1 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="c97-btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
