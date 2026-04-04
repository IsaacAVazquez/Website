import { SurfaceCard } from "./SurfaceCard";

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SurfaceCard className="p-6 text-center sm:p-8">
      <p className="text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{description}</p>
    </SurfaceCard>
  );
}
