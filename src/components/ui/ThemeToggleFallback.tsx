export function ThemeToggleFallback() {
  return (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--text-tertiary)]"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)]"
      />
      <span className="sr-only">Theme controls loading</span>
    </button>
  );
}
