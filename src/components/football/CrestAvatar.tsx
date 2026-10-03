import { cn } from "@/lib/cn";

function getTeamInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function CrestAvatar({
  crest,
  name,
  size = "md",
}: {
  crest: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensionClass =
    size === "lg"
      ? "h-16 w-16 text-lg"
      : size === "sm"
        ? "h-9 w-9 text-xs"
        : "h-12 w-12 text-sm";

  if (crest) {
    return (
      <img
        src={crest}
        // Decorative: every caller prints the team name beside the crest or
        // names the control, and the initials fallback is aria-hidden too.
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(
          "border border-[var(--c97-rule)] bg-[var(--c97-print-bone)] object-contain",
          dimensionClass
        )} style={{ padding: "var(--c97-sp-0)" }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center border border-[var(--c97-rule)] bg-[var(--c97-field)] font-semibold text-[var(--c97-ink)]",
        dimensionClass
      )}
      aria-hidden="true"
    >
      {getTeamInitials(name)}
    </div>
  );
}
