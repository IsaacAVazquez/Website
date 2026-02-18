"use client";

import Link from "next/link";
import {
  IconBrandLinkedin,
  IconBrandGithub,
  IconMail,
  IconArrowRight,
} from "@tabler/icons-react";

const socialLinks = [
  {
    href: "https://linkedin.com/in/isaac-vazquez",
    label: "Visit Isaac Vazquez's LinkedIn profile",
    icon: IconBrandLinkedin,
  },
  {
    href: "https://github.com/IsaacAVazquez",
    label: "Visit Isaac Vazquez's GitHub profile",
    icon: IconBrandGithub,
  },
];

export const Footer = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className="relative z-20 border-t border-[var(--border-primary)] bg-[var(--surface-primary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl p-8 md:p-12 text-center bg-[var(--neutral-900)] border border-[var(--neutral-700)]">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--neutral-50)] mb-4">
            Need a PM who can own the roadmap end to end?
          </h2>
          <p className="text-lg text-[var(--neutral-400)] mb-8 max-w-2xl mx-auto">
            Looking for a product manager who combines technical expertise with
            strategic thinking? Let&apos;s discuss how I can help drive your
            product vision forward.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all min-h-[52px] text-lg"
            >
              <IconMail className="w-5 h-5" />
              Get In Touch
              <IconArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-[var(--neutral-300)] border-2 border-[var(--neutral-600)] hover:border-[var(--neutral-400)] font-semibold rounded-xl transition-all min-h-[52px] text-lg"
            >
              View Resume
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 pb-6">
        <div className="flex items-center gap-2 text-base font-medium text-[var(--text-tertiary)] mb-3">
          <span>{new Date().getFullYear()}</span>
          <span>&#8212;</span>
          <span>Built by</span>
          <a
            href="https://isaacavazquez.com"
            className="font-bold text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Isaac Vazquez
          </a>
        </div>

        <nav
          aria-label="Social media links"
          className="flex gap-3 mb-4"
        >
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-label={link.label}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[var(--neutral-100)]"
            >
              <link.icon size={20} aria-hidden="true" />
            </a>
          ))}
        </nav>

        <Link
          href="/accessibility"
          className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors underline underline-offset-2"
        >
          Accessibility Statement
        </Link>
      </div>
    </footer>
  );
};
