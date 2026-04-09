import type { ReactNode } from "react";

interface StatusPanelProps {
  title: string;
  message: string;
  tone?: "default" | "error" | "warning";
  icon?: ReactNode;
  statusRole?: "status" | "alert";
}

/**
 * Centered editorial status card used for loading, empty, and error states.
 * Tone controls border/background accent while keeping the --home-* palette
 * so it works in both light and dark mode without extra work.
 */
export function StatusPanel({
  title,
  message,
  tone = "default",
  icon,
  statusRole,
}: StatusPanelProps) {
  const toneStyle =
    tone === "error"
      ? {
          borderColor: "color-mix(in srgb, var(--color-error) 30%, var(--home-rule))",
          background: "color-mix(in srgb, var(--color-error) 10%, var(--home-paper))",
          accent: "var(--color-error)",
        }
      : tone === "warning"
        ? {
            borderColor: "color-mix(in srgb, var(--color-warning) 32%, var(--home-rule))",
            background: "color-mix(in srgb, var(--color-warning) 12%, var(--home-paper))",
            accent: "var(--color-warning)",
          }
        : {
            borderColor: "var(--home-rule)",
            background: "color-mix(in srgb, var(--home-paper-alt) 78%, white)",
            accent: "var(--home-haze)",
          };

  return (
    <div
      className="home-card px-6 py-10 text-center"
      style={{
        borderColor: toneStyle.borderColor,
        background: toneStyle.background,
      }}
      role={statusRole}
    >
      {icon ? (
        <div
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--home-paper) 88%, white)",
            color: toneStyle.accent,
          }}
        >
          {icon}
        </div>
      ) : null}
      <h2
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
      >
        {title}
      </h2>
      <p
        className="mx-auto mt-3 mb-0 max-w-[36rem] text-sm leading-7"
        style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
      >
        {message}
      </p>
    </div>
  );
}
