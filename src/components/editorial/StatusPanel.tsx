import type { ReactNode } from "react";

interface StatusPanelProps {
  title: string;
  message: string;
  tone?: "default" | "error";
  icon?: ReactNode;
}

/**
 * Centered editorial status card used for loading, empty, and error states.
 * Tone puts its colour on the border rule and the icon swatch only; the
 * title and message stay in ink so the text always clears contrast.
 */
export function StatusPanel({ title, message, tone = "default", icon }: StatusPanelProps) {
  // error → alert, otherwise status, so every instance gets a live region.
  const role = tone === "error" ? "alert" : "status";
  const toneAccent = tone === "error" ? "var(--c97-negative)" : "var(--c97-accent)";
  const borderColor = tone === "default" ? "var(--c97-rule)" : toneAccent;

  return (
    <div
      className="c97-panel border text-center"
      style={{ borderColor, padding: "var(--c97-sp-4) var(--c97-sp-3)" }}
      role={role}
    >
      {icon ? (
        <div
          className="flex h-11 w-11 items-center justify-center"
          style={{
            marginInline: "auto",
            marginBottom: "var(--c97-sp-2)",
            background: toneAccent,
            color: "var(--c97-surface)",
          }}
        >
          {icon}
        </div>
      ) : null}
      <h3 className="c97-serif c97-h3">{title}</h3>
      <p
        className="c97-prose"
        style={{
          marginTop: "var(--c97-sp-2)",
          marginInline: "auto",
          fontSize: "var(--c97-fs-small)",
          color: "var(--c97-ink-2)",
        }}
      >
        {message}
      </p>
    </div>
  );
}
