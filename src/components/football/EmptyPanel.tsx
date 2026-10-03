import { SurfaceCard } from "./SurfaceCard";

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SurfaceCard className="text-center" style={{ padding: "var(--c97-sp-3)" }}>
      <p className="text-lg font-semibold text-[var(--c97-ink)]">{title}</p>
      <p className="text-sm leading-7 text-[var(--c97-ink-2)]" style={{ marginTop: "var(--c97-sp-1)" }}>{description}</p>
    </SurfaceCard>
  );
}
