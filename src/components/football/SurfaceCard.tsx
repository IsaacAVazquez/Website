import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}
