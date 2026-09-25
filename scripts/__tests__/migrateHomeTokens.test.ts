/**
 * @jest-environment node
 */
import { migrateHomeTokens } from "../migrateHomeTokens.mjs";

describe("migrateHomeTokens", () => {
  it("maps every bridged token onto its Catalog 97 name", () => {
    const input =
      "text-[var(--home-ink-muted)] bg-[var(--home-paper-alt)] border-[var(--home-control-rule)] text-[var(--home-ink)] bg-[var(--home-paper)] text-[var(--home-signal-ink)] bg-[var(--home-signal-soft)] bg-[var(--home-overlay)] text-[var(--home-ink-soft)] border-[var(--home-stone)]";
    expect(migrateHomeTokens(input)).toBe(
      "text-[var(--c97-ink-2)] bg-[var(--c97-field)] border-[var(--c97-ink-2)] text-[var(--c97-ink)] bg-[var(--c97-surface)] text-[var(--c97-accent)] bg-[var(--c97-accent-soft)] bg-[var(--c97-overlay)] text-[var(--c97-label)] border-[var(--c97-rule)]",
    );
  });

  it("maps tokens inside color-mix and inline styles", () => {
    expect(migrateHomeTokens("color-mix(in srgb, var(--home-signal) 20%, var(--home-paper-raised))")).toBe(
      "color-mix(in srgb, var(--c97-accent) 20%, var(--c97-field))",
    );
  });

  it("leaves unknown --home tokens alone so the grep check catches them", () => {
    expect(migrateHomeTokens("var(--home-dark-paper)")).toBe("var(--home-dark-paper)");
  });
});
