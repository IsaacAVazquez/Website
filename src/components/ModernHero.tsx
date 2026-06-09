import Image from "next/image";
import { ModernButton } from "@/components/ui/ModernButton";

export function ModernHero() {
  return (
    <section
      className="relative overflow-hidden bg-[var(--home-paper)] py-6 md:py-8 lg:py-10 xl:py-12"
      aria-label="Isaac Vazquez introduction"
      data-testid="hero"
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b to-transparent"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, color-mix(in srgb, var(--home-haze) 12%, transparent), transparent)",
          }}
        />
        <div
          className="absolute -left-24 top-24 h-72 w-72 rounded-full blur-3xl"
          style={{
            background: "color-mix(in srgb, var(--home-haze) 12%, transparent)",
          }}
        />
      </div>

      <div className="page-shell relative z-10">
        <div className="section-panel overflow-hidden px-6 py-4 sm:px-8 sm:py-5 lg:px-10 lg:py-6 xl:px-12 xl:py-7">
          <div className="grid items-start gap-8 lg:grid-cols-[1.28fr_0.72fr] lg:gap-12 xl:gap-16">
            <div className="space-y-6">
              <div className="space-y-5">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--home-ink-soft)]">
                  Berkeley, CA · UC Berkeley Haas MBA Candidate
                </p>

                <h1 className="max-w-5xl text-4xl font-bold tracking-tight text-[var(--home-ink)] sm:text-[2.85rem] lg:text-[3.45rem] lg:leading-[1.02] xl:text-[4rem]">
                  Product manager focused on reliability, analytics, and
                  execution.
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-[var(--home-ink-muted)] sm:text-lg lg:max-w-2xl lg:text-[1.05rem] xl:max-w-3xl xl:text-[1.1rem]">
                  I've worked across SaaS, civic tech, and investment tooling,
                  turning operational complexity into clearer product decisions
                  and stronger delivery.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <ModernButton href="/portfolio" variant="accent" size="lg">
                  View projects
                </ModernButton>
                <ModernButton href="/about" variant="outline" size="lg">
                  Learn more
                </ModernButton>
              </div>

            </div>

            <div className="relative lg:pt-1 xl:pt-2">
              <div className="mx-auto max-w-xs sm:max-w-sm lg:ml-auto lg:max-w-[22rem]">
                <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--home-rule)] bg-[var(--home-paper)] p-3 shadow-[var(--shadow-lg)]">
                  <div
                    className="absolute inset-x-10 top-4 h-20 rounded-full blur-3xl"
                    style={{
                      background:
                        "color-mix(in srgb, var(--home-haze) 14%, transparent)",
                    }}
                  />
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-[var(--home-rule)] bg-[var(--home-paper-alt)]">
                    <Image
                      src="/images/headshot-home.webp"
                      alt="Isaac Vazquez - Technical Product Manager and UC Berkeley Haas MBA Candidate"
                      fill
                      priority
                      sizes="(min-width: 1280px) 24rem, (min-width: 1024px) 30vw, (min-width: 640px) 70vw, 82vw"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
