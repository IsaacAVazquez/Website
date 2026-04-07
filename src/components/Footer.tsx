"use client";

import Link from "next/link";
import {
  BrandLinkedin,
  BrandGithub,
  Mail,
  ArrowRight,
} from "@/components/ui/ServerIcons";

const socialLinks = [
  {
    href: "https://linkedin.com/in/isaac-vazquez",
    label: "Visit Isaac Vazquez's LinkedIn profile",
    icon: BrandLinkedin,
  },
  {
    href: "https://github.com/IsaacAVazquez",
    label: "Visit Isaac Vazquez's GitHub profile",
    icon: BrandGithub,
  },
];

export type FooterVariant = "full" | "compact";
export type FooterSurface = "default" | "home";

interface FooterProps {
  variant?: FooterVariant;
  surface?: FooterSurface;
}

export const Footer = ({ variant = "full", surface = "default" }: FooterProps) => {
  const isCompact = variant === "compact";
  const isHomeSurface = surface === "home";

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      data-footer-variant={variant}
      data-footer-surface={surface}
      className={`relative z-20 border-t ${
        isHomeSurface
          ? "footer-home"
          : "border-[var(--border-primary)] bg-[var(--surface-primary)]"
      }`}
    >
      <div className={`page-shell ${isCompact ? "py-4 md:py-5" : "py-6 md:py-8"}`}>
        {!isCompact ? (
          <div className={`section-panel p-8 md:p-10 ${isHomeSurface ? "footer-home-panel" : ""}`}>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <h2
                  className={`max-w-2xl text-3xl font-bold tracking-tight md:text-4xl ${
                    isHomeSurface ? "footer-home-text-strong" : "text-[var(--text-primary)]"
                  }`}
                >
                  Thanks for taking a look.
                </h2>
                <p
                  className={`max-w-2xl text-lg leading-relaxed ${
                    isHomeSurface ? "footer-home-text" : "text-[var(--text-secondary)]"
                  }`}
                >
                  If a project stands out, I&apos;d be happy to share more about the
                  work or my background.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/portfolio"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] px-6 py-3 font-medium text-[var(--text-inverse)] transition-colors hover:bg-[var(--neutral-800)]"
                >
                  View projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] px-6 py-3 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-secondary)]"
                >
                  <Mail className="h-4 w-4" />
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`flex flex-col gap-5 border-t border-[var(--border-primary)] pt-6 sm:flex-row sm:items-center sm:justify-between ${
            isCompact ? "" : "mt-8"
          }`}
          style={isHomeSurface ? { borderTopColor: "var(--home-rule)" } : undefined}
        >
          <div
            className={`space-y-1 text-sm ${
              isHomeSurface ? "footer-home-text" : "text-[var(--text-tertiary)]"
            }`}
          >
            <p
              className={`font-medium ${
                isHomeSurface ? "footer-home-text-strong" : "text-[var(--text-primary)]"
              }`}
            >
              Isaac Vazquez
            </p>
            <p>Building products where clear thinking and reliable execution actually move the needle.</p>
          </div>

          <div className="flex flex-col gap-4 sm:items-end">
            <nav aria-label="Social media links" className="flex items-center gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors ${
                    isHomeSurface
                      ? "footer-home-icon"
                      : "border-[var(--border-primary)] text-[var(--text-tertiary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <link.icon size={18} aria-hidden="true" />
                </a>
              ))}
            </nav>

            <div
              className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${
                isHomeSurface ? "footer-home-text" : "text-[var(--text-tertiary)]"
              }`}
            >
              <span>{new Date().getFullYear()}</span>
              <Link
                href="/accessibility"
                className={`transition-colors ${
                  isHomeSurface ? "hover:text-[var(--home-ink)]" : "hover:text-[var(--text-primary)]"
                }`}
              >
                Accessibility
              </Link>
              <a
                href="https://isaacavazquez.com"
                className={`font-medium transition-colors ${
                  isHomeSurface
                    ? "footer-home-text-strong hover:text-[var(--home-haze)]"
                    : "text-[var(--text-primary)] hover:text-[var(--color-primary)]"
                }`}
              >
                isaacavazquez.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
