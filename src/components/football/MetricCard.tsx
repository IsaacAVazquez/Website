export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--home-rule)] bg-[var(--home-paper-alt)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color-mix(in srgb, var(--home-ink) 45%, var(--home-paper))]">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-[var(--home-ink)]">{value}</p>
    </div>
  );
}
