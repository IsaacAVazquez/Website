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
      <div
        role="status"
        className="rounded-[var(--radius-2xl)] border border-[color-mix(in_srgb,var(--home-positive)_42%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_9%,var(--home-paper))] px-4 py-4 text-sm leading-6 text-[var(--home-ink)]"
      >
        <p className="font-semibold">{message}</p>
        <p className="mt-1 text-[var(--home-ink-muted)]">
          I will only send something when I have a build or finding worth
          sharing.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
      aria-label="Email newsletter signup"
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
      <div className="grid gap-2">
        <label className="sr-only" htmlFor={`newsletter-email-${source}`}>
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
          className="min-h-[48px] w-full rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper)] px-4 text-base text-[var(--home-ink)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--home-ink-muted)] focus:border-[var(--home-signal)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--home-signal)_16%,transparent)] disabled:cursor-wait disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[var(--radius-2xl)] border border-[var(--home-ink)] bg-[var(--home-ink)] px-5 text-sm font-semibold text-[var(--home-paper)] transition-[background-color,border-color,color,transform] hover:border-[var(--home-signal)] hover:bg-[var(--home-signal)] focus-visible:border-[var(--home-signal)] focus-visible:bg-[var(--home-signal)] disabled:cursor-wait disabled:opacity-70 motion-safe:active:translate-y-px"
        >
          {state === "submitting" ? "Joining…" : "Join the list"}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs leading-5 text-[var(--home-ink-muted)]">
        One note a month at most. Unsubscribe whenever you want.
      </p>
      {state === "error" ? (
        <p
          id={`newsletter-error-${source}`}
          role="alert"
          className="text-sm leading-6 text-[var(--home-negative)]"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

