import { cn } from "@/lib/utils";

export function TeamResultPill({ result }: { result: "W" | "D" | "L" }) {
  const colorClass =
    result === "W"
      ? "border-[color-mix(in_srgb,var(--color-success)_35%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--surface-secondary))] text-[var(--color-success)]"
      : result === "D"
        ? "border-[color-mix(in_srgb,var(--color-primary)_25%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--surface-secondary))] text-[var(--color-primary)]"
        : "border-[color-mix(in_srgb,var(--color-danger)_30%,var(--border-primary))] bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--surface-secondary))] text-[var(--color-danger)]";

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
