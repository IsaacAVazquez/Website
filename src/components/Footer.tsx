"use client";

import Link from "next/link";
import {
  BrandLinkedin,
  BrandGithub,
} from "@/components/ui/ServerIcons";
import { ContactCta } from "@/components/ContactCta";

const socialLinks = [
  {
    href: "https://www.linkedin.com/in/isaac-vazquez/",
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
      {!isCompact ? <ContactCta /> : null}

      <div className={`page-shell ${isCompact ? "py-4 md:py-5" : "py-6 md:py-8"}`}>
        <div
          className="flex flex-col gap-5 border-t pt-6 sm:flex-row sm:items-start sm:justify-between"
          style={{ borderTopColor: "var(--home-ink)" }}
        >
          <div className="space-y-1.5">
            <p className="footer-home-colophon">
              &copy; {new Date().getFullYear()} Isaac Vazquez
            </p>
            <p className="text-sm footer-home-text" style={{ maxWidth: "38ch" }}>
              Building products where clear thinking and reliable execution move the needle.
            </p>
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
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors footer-home-icon"
                >
                  <link.icon size={18} aria-hidden="true" />
                </a>
              ))}
            </nav>

            <nav aria-label="Footer links" className="footer-home-links">
              <Link href="/now">Now</Link>
              <Link href="/changelog">Changelog</Link>
              <Link href="/accessibility">Accessibility</Link>
              <a href="https://isaacavazquez.com" className="is-strong">
                isaacavazquez.com
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};
