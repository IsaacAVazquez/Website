import { cn } from "@/lib/utils";

export function TeamResultPill({ result }: { result: "W" | "D" | "L" }) {
  const colorClass =
    result === "W"
      ? "border-[color-mix(in_srgb,var(--home-positive)_45%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-positive)_16%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-positive)_70%,var(--home-ink))]"
      : result === "L"
        ? "border-[color-mix(in_srgb,var(--home-negative)_40%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-negative)_12%,var(--home-paper-alt))] text-[color-mix(in_srgb,var(--home-negative)_70%,var(--home-ink))]"
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
