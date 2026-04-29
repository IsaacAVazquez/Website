import { cn } from "@/lib/utils";

export function TeamResultPill({ result }: { result: "W" | "D" | "L" }) {
  const colorClass =
    result === "W"
      ? "border-[color-mix(in_srgb,var(--home-moss)_55%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-moss)_22%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-ink)_75%,var(--home-moss))]"
      : result === "D"
        ? "border-[color-mix(in_srgb,var(--home-haze)_25%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-haze)_10%,var(--home-paper-alt))] text-[var(--home-haze)]"
        : "border-[var(--home-rule)] bg-[var(--home-paper-alt)] text-[var(--home-ink-muted)]";

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold",
        colorClass
      )}
    >
      {result}
    </span>
  );
}
