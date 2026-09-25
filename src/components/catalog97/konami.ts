/** The Konami code matcher behind the out-of-register egg in Catalog97EasterEggs. */

export const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

/** Appends a key to the recent-key history, keeping only as many as the code needs. */
export function pushKonamiKey(history: readonly string[], key: string): string[] {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  return [...history, normalized].slice(-KONAMI_SEQUENCE.length);
}

export function isKonami(history: readonly string[]): boolean {
  return (
    history.length === KONAMI_SEQUENCE.length &&
    history.every((key, index) => key === KONAMI_SEQUENCE[index])
  );
}

/**
 * True when a keystroke should not count toward the code. That covers a key
 * held down and auto-repeating, a key something else already handled with
 * preventDefault (a game's arrow keys, say), a meta, ctrl, or alt combo, and
 * typing in a form field. Shift is allowed, so Shift+B and Shift+A count.
 */
export function shouldIgnoreKey(event: KeyboardEvent): boolean {
  if (event.repeat || event.defaultPrevented) return true;
  if (event.metaKey || event.ctrlKey || event.altKey) return true;
  return isTypingTarget(event.target);
}

/** True for a form field or editable region, where a keystroke is someone typing. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element.tagName !== "string") return false;
  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.tagName === "SELECT" ||
    element.isContentEditable === true
  );
}
