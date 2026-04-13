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
      className="relative z-20 border-t footer-home"
    >
      <div className={`page-shell ${isCompact ? "py-4 md:py-5" : "py-6 md:py-8"}`}>
        {!isCompact ? (
          <div className="section-panel p-8 md:p-10 footer-home-panel">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl footer-home-text-strong">
                  Thanks for taking a look.
                </h2>
                <p className="max-w-2xl text-lg leading-relaxed footer-home-text">
                  If a project stands out, I&apos;d be happy to share more about the
                  work or my background.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/portfolio"
                  className="home-button home-button-primary inline-flex items-center gap-2"
                >
                  View projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="home-button home-button-secondary inline-flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`flex flex-col gap-5 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${isCompact ? "" : "mt-8"}`}
          style={{ borderTopColor: "var(--home-rule)" }}
        >
          <div className="space-y-1 text-sm footer-home-text">
            <p className="font-medium footer-home-text-strong">Isaac Vazquez</p>
            <p>Building products where clear thinking and reliable execution move the needle.</p>
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
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border transition-colors footer-home-icon"
                >
                  <link.icon size={18} aria-hidden="true" />
                </a>
              ))}
            </nav>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm footer-home-text">
              <span>{new Date().getFullYear()}</span>
              <Link
                href="/accessibility"
                className="transition-colors hover:text-[var(--home-ink)]"
              >
                Accessibility
              </Link>
              <a
                href="https://isaacavazquez.com"
                className="font-medium transition-colors footer-home-text-strong hover:text-[var(--home-haze)]"
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
