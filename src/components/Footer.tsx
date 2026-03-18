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

interface FooterProps {
  variant?: FooterVariant;
}

export const Footer = ({ variant = "full" }: FooterProps) => {
  const isCompact = variant === "compact";

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      data-footer-variant={variant}
      className="relative z-20 border-t border-[var(--border-primary)] bg-[var(--surface-primary)]"
    >
      <div className={`page-shell ${isCompact ? "py-8 md:py-10" : "py-12 md:py-16"}`}>
        {!isCompact ? (
          <div className="section-panel p-8 md:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                  Thanks for taking a look.
                </h2>
                <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
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
        >
          <div className="space-y-1 text-sm text-[var(--text-tertiary)]">
            <p className="font-medium text-[var(--text-primary)]">Isaac Vazquez</p>
            <p>Product management, projects, and analytics-focused work.</p>
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
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border-primary)] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                >
                  <link.icon size={18} aria-hidden="true" />
                </a>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-tertiary)]">
              <span>{new Date().getFullYear()}</span>
              <Link
                href="/accessibility"
                className="transition-colors hover:text-[var(--text-primary)]"
              >
                Accessibility
              </Link>
              <a
                href="https://isaacavazquez.com"
                className="font-medium text-[var(--text-primary)] transition-colors hover:text-[var(--color-primary)]"
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
