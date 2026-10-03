import { cn } from "@/lib/cn";

const RESULT_LABEL = { W: "Win", D: "Draw", L: "Loss" } as const;

export function TeamResultPill({ result }: { result: "W" | "D" | "L" }) {
  const colorClass =
    result === "W"
      ? "border-[color-mix(in_srgb,var(--c97-positive)_45%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-positive)_16%,var(--c97-field))] text-[color-mix(in_srgb,var(--c97-positive)_70%,var(--c97-ink))]"
      : result === "L"
        ? "border-[color-mix(in_srgb,var(--c97-negative)_40%,var(--c97-rule))] bg-[color-mix(in_srgb,var(--c97-negative)_12%,var(--c97-field))] text-[color-mix(in_srgb,var(--c97-negative)_70%,var(--c97-ink))]"
        : "border-[var(--c97-rule)] bg-[var(--c97-field)] text-[var(--c97-ink-2)]";

  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center border text-xs font-bold",
        colorClass
      )}
    >
      <span aria-hidden="true">{result}</span>
      <span className="sr-only">{RESULT_LABEL[result]}</span>
    </span>
  );
}
