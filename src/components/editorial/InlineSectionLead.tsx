import type { ReactNode } from "react";

interface InlineSectionLeadProps {
  kicker: string;
  children: ReactNode;
  maxWidthClassName?: string;
}

/**
 * Small section lead-in used below card titles or section headers to pair a
 * kicker label with a short explanation. Follows the editorial typography
 * (Instrument Sans, muted color, tight tracking on the kicker).
 */
export function InlineSectionLead({
  kicker,
  children,
  maxWidthClassName = "max-w-[48rem]",
}: InlineSectionLeadProps) {
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <p className="home-kicker mb-0">{kicker}</p>
      <p
        className={`mb-0 text-sm leading-7 ${maxWidthClassName}`}
        style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
      >
        {children}
      </p>
    </div>
  );
}
