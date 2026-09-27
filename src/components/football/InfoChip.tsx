export function InfoChip({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-[44px] items-center border border-[var(--c97-rule)] bg-[var(--c97-field)] px-4 py-2 font-medium text-[var(--c97-ink-2)]">
      {label}
    </span>
  );
}
