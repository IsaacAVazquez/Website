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
        "border border-[var(--c97-rule)] bg-[var(--c97-field)] ",
        className
      )}
    >
      {children}
    </div>
  );
}
