import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SurfaceCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("border border-[var(--c97-rule)] bg-[var(--c97-field)]", className)} style={style}>
      {children}
    </div>
  );
}
