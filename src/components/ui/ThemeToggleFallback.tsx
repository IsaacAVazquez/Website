import { cn } from "@/lib/utils";

interface ThemeToggleFallbackProps {
  className?: string;
}

export function ThemeToggleFallback({ className }: ThemeToggleFallbackProps) {
  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      className={cn(
        "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-[var(--home-ink-muted)]",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)]"
      />
      <span className="sr-only">Theme controls loading</span>
    </button>
  );
}
