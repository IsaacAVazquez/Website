import { cn } from "@/lib/utils";

export function TeamResultPill({ result }: { result: "W" | "D" | "L" }) {
  const colorClass =
    result === "W"
      ? "border-[color-mix(in_srgb,var(--color-success)_35%,var(--home-rule))] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--home-paper-alt))] text-[var(--color-success)]"
      : result === "D"
        ? "border-[color-mix(in_srgb,var(--home-haze)_25%,var(--home-rule))] bg-[color-mix(in_srgb,var(--home-haze)_10%,var(--home-paper-alt))] text-[var(--home-haze)]"
        : "border-[color-mix(in_srgb,var(--color-danger)_30%,var(--home-rule))] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--home-paper-alt))] text-[var(--color-danger)]";

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
