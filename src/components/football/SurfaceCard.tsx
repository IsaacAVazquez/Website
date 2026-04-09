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
        "rounded-[28px] border border-[var(--home-rule)] bg-[color-mix(in srgb, var(--home-paper) 92%, white)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}
