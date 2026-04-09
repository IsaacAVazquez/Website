export function ThemeToggleFallback() {
  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--home-ink-muted)]"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)]"
      />
      <span className="sr-only">Theme controls loading</span>
    </button>
  );
}
