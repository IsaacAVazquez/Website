"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { trackNewsletterSubscribe } from "@/lib/analytics";

type NewsletterSource = "writing" | "agent_build_index";

interface NewsletterSignupProps {
  source: NewsletterSource;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export function NewsletterSignup({ source }: NewsletterSignupProps) {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          company: formData.get("company"),
          source,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "I could not save that signup.");
      }

      form.reset();
      setState("success");
      setMessage(payload.message || "You are on the list.");
      trackNewsletterSubscribe({ signup_location: source });
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "I could not save that signup. Please try again."
      );
    }
  }

  if (state === "success") {
    return (
      <div role="status" style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
        <p className="c97-prose" style={{ color: "var(--c97-positive)" }}>
          {message}
        </p>
        <p className="c97-prose" style={{ color: "var(--c97-ink-2)" }}>
          I will only send something when I have a build or finding worth
          sharing.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Email newsletter signup"
      style={{ display: "grid", gap: "var(--c97-sp-2)" }}
    >
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`company-${source}`}>Company</label>
        <input
          id={`company-${source}`}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div style={{ display: "grid", gap: "var(--c97-sp-1)" }}>
        <label className="c97-kicker" htmlFor={`newsletter-email-${source}`}>
          Email address
        </label>
        <input
          id={`newsletter-email-${source}`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          disabled={state === "submitting"}
          aria-invalid={state === "error" || undefined}
          aria-describedby={state === "error" ? `newsletter-error-${source}` : undefined}
          className="c97-field"
          style={{ cursor: state === "submitting" ? "wait" : undefined }}
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="c97-btn"
          style={{
            gap: "var(--c97-sp-1)",
            justifyContent: "center",
            cursor: state === "submitting" ? "wait" : undefined,
          }}
        >
          {state === "submitting" ? "Joining…" : "Join the list"}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="c97-prose" style={{ fontSize: "var(--c97-fs-small)", color: "var(--c97-ink-2)" }}>
        One note a month at most. Unsubscribe whenever you want.
      </p>
      {state === "error" ? (
        <p
          id={`newsletter-error-${source}`}
          role="alert"
          className="c97-prose"
          style={{ color: "var(--c97-negative)" }}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
