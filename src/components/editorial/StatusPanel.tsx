import type { ReactNode } from "react";

interface StatusPanelProps {
  title: string;
  message: string;
  tone?: "default" | "error" | "warning";
  icon?: ReactNode;
  statusRole?: "status" | "alert";
  /** Optional action rendered under the message (e.g. a retry button). */
  action?: ReactNode;
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
  action,
}: StatusPanelProps) {
  // Auto-derive the ARIA role from tone (error → alert, otherwise status) so
  // every instance gets a live region even if the caller doesn't pass one;
  // an explicit `statusRole` still overrides.
  const role = statusRole ?? (tone === "error" ? "alert" : "status");

  const toneStyle =
    tone === "error"
      ? {
          borderColor: "color-mix(in srgb, var(--home-negative) 30%, var(--home-rule))",
          background: "color-mix(in srgb, var(--home-negative) 10%, var(--home-paper))",
          accent: "var(--home-negative)",
        }
      : tone === "warning"
        ? {
            borderColor: "color-mix(in srgb, var(--home-warning) 32%, var(--home-rule))",
            background: "color-mix(in srgb, var(--home-warning) 12%, var(--home-paper))",
            accent: "var(--home-warning)",
          }
        : {
            borderColor: "var(--home-rule)",
            background: "color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))",
            accent: "var(--home-signal)",
          };

  return (
    <div
      className="home-card-static px-6 py-10 text-center"
      style={{
        borderColor: toneStyle.borderColor,
        background: toneStyle.background,
      }}
      role={role}
    >
      {icon ? (
        <div
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--home-paper) 88%, var(--home-elev-mix))",
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
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
