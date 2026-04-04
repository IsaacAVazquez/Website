export function InfoChip({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)] px-4 py-2 font-medium text-[var(--text-secondary)]">
      {label}
    </span>
  );
}
