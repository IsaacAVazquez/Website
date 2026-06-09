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
        "rounded-[var(--radius-2xl)] border border-[var(--home-rule)] bg-[var(--home-paper-raised)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}
