import Link from "next/link";
import { ArrowLeft, Home } from "@/components/ui/ServerIcons";
import { ModernButton } from "@/components/ui/ModernButton";

export default function NotFound() {
  return (
    <section className="home-page home-section min-h-screen">
      <div className="home-shell home-shell-tight flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="home-kicker mb-6">Error · 404</p>
        <h1
          className="mb-6"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "clamp(4rem, 14vw, 9rem)",
            fontWeight: 600,
            lineHeight: 0.9,
            letterSpacing: "-0.08em",
            color: "var(--home-ink)",
          }}
        >
          404
        </h1>
        <h2
          className="mb-5 max-w-[28ch] text-balance"
          style={{
            fontFamily: "var(--font-home-sans)",
            fontSize: "clamp(1.35rem, 2.4vw, 1.75rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--home-ink)",
          }}
        >
          I don&apos;t have a page at that address.
        </h2>
        <p
          className="mb-10 max-w-[44ch] text-base leading-7"
          style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
        >
          The URL you followed isn&apos;t in my current route map. It may have moved, or the
          link might be a little old. Jump back to the home page or browse the portfolio.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ModernButton href="/" variant="primary" size="lg">
            <Home className="h-5 w-5" />
            Return home
          </ModernButton>

          <Link href="/portfolio">
            <ModernButton variant="outline" size="lg">
              <ArrowLeft className="h-5 w-5" />
              Browse projects
            </ModernButton>
          </Link>
        </div>
      </div>
    </section>
  );
}
