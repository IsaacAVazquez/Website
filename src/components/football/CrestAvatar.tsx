import { cn } from "@/lib/utils";

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
        alt={`${name} crest`}
        loading="lazy"
        decoding="async"
        className={cn(
          "rounded-full border border-[var(--home-rule)] bg-white object-contain p-1",
          dimensionClass
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] font-semibold text-[var(--home-ink)]",
        dimensionClass
      )}
      aria-hidden="true"
    >
      {getTeamInitials(name)}
    </div>
  );
}
