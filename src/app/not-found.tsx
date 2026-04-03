import Link from "next/link";
import { ArrowLeft, Home } from "@/components/ui/ServerIcons";
import { ModernButton } from "@/components/ui/ModernButton";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-secondary)]/60 via-[var(--surface-primary)] to-[var(--border-primary)]/20" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15, 23, 42, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(15, 23, 42, 0.1) 10px, rgba(15, 23, 42, 0.1) 20px)",
        }}
      />

      <div className="relative z-10 max-w-2xl text-center">
        <div className="relative mb-8">
          <h1 className="text-9xl font-black text-[var(--color-primary)]">404</h1>
        </div>

        <div className="mb-8 font-mono text-[var(--color-success)]">
          <p className="mb-2 text-xl">
            <span className="text-[var(--color-primary)]">$</span> cat /page/not/found
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Error: The requested resource could not be located in the system.
          </p>
        </div>

        <p className="mb-8 text-lg text-[var(--text-primary)]">
          Looks like you&apos;ve ventured into uncharted territory. This page
          doesn&apos;t exist in the current route map.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <ModernButton href="/" variant="primary" size="lg">
            <Home className="h-5 w-5" />
            Return Home
          </ModernButton>

          <Link href="/portfolio">
            <ModernButton variant="outline" size="lg">
              <ArrowLeft className="h-5 w-5" />
              Browse Projects
            </ModernButton>
          </Link>
        </div>

        <div className="mt-16 font-mono text-sm text-[var(--text-secondary)]">
          <span className="opacity-80">■ SEARCHING FOR PAGE... ■</span>
        </div>
      </div>
    </div>
  );
}
