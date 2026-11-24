export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="border border-[var(--c97-rule)] bg-[var(--c97-field)] text-center"
      style={{ padding: "var(--c97-sp-3)" }}
    >
      <p className="text-lg font-semibold text-[var(--c97-ink)]">{title}</p>
      <p className="text-sm leading-7 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>{description}</p>
    </div>
  );
}
