export function InfoChip({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-4 py-2 font-medium text-[var(--home-ink-muted)]">
      {label}
    </span>
  );
}
