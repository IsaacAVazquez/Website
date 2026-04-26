"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  IconMail,
  IconBrandLinkedin,
  IconMapPin,
} from "@tabler/icons-react";

export function ContactContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="home-page min-h-screen">
      <div className="home-shell home-section space-y-10">
        {/* Heading */}
        <motion.div
          className="text-center space-y-3 pt-4"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
        >
          <p className="home-kicker">Contact</p>
          <h1
            className="mx-auto w-full max-w-5xl text-center"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "clamp(2.6rem, 6vw, 5rem)",
              fontWeight: 600,
              lineHeight: 0.94,
              letterSpacing: "-0.07em",
              color: "var(--home-ink)",
            }}
          >
            Get in touch.
          </h1>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="mx-auto w-full max-w-5xl grid gap-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr]"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: 0.1 }}
        >
          {/* Main CTA card */}
          <div className="home-card home-project-card space-y-5">
            <p className="home-kicker">Good fit</p>
            <h2
              style={{
                fontFamily: "var(--font-home-sans)",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "var(--home-ink)",
              }}
            >
              I&apos;m looking for product work where the thinking and the delivery both have to be good.
            </h2>

            <p className="home-body max-w-none">
              I&apos;m especially interested in analytics, fintech, and workflow
              products, along with teams where clear strategy and reliable
              delivery are connected.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="mailto:IsaacVazquez@berkeley.edu"
                className="home-button home-button-primary inline-flex items-center justify-center gap-2"
              >
                <IconMail className="h-4 w-4" />
                Email me
              </Link>
              <Link
                href="https://www.linkedin.com/in/isaac-vazquez"
                target="_blank"
                rel="noopener noreferrer"
                className="home-button home-button-secondary inline-flex items-center justify-center gap-2"
              >
                <IconBrandLinkedin className="h-4 w-4" />
                Connect on LinkedIn
              </Link>
            </div>

            <div
              className="flex items-center gap-2 text-sm"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
              role="status"
              aria-label="Currently available — based in Berkeley, reachable by email or LinkedIn"
            >
              <div
                className="h-2 w-2 rounded-full flex-shrink-0 motion-safe:animate-pulse"
                style={{ background: "var(--home-moss)" }}
                aria-hidden="true"
              />
              <span>Based in Berkeley and available by email or LinkedIn</span>
            </div>
          </div>

          {/* Side cards */}
          <div className="space-y-6">
            <div className="home-card home-project-card space-y-3">
              <div className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 flex-shrink-0" style={{ color: "var(--home-haze)" }} />
                <h3
                  className="font-bold"
                  style={{
                    fontFamily: "var(--font-home-sans)",
                    fontSize: "1.1rem",
                    letterSpacing: "-0.02em",
                    color: "var(--home-ink)",
                  }}
                >
                  Berkeley, CA
                </h3>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)", lineHeight: 1.65 }}
              >
                Based in the Bay Area while attending UC Berkeley Haas. Most of
                what I&apos;ve worked on has been in civic tech, SaaS, and
                investment research.
              </p>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{
                background: "color-mix(in srgb, var(--home-paper-alt) 80%, var(--home-elev-mix))",
                border: "1px solid var(--home-rule)",
              }}
            >
              <p className="home-kicker mb-3">Best conversations</p>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)", lineHeight: 1.65 }}
              >
                I&apos;m most engaged when the problem involves analytics, fintech, or platform reliability. Places where clear product thinking changes the outcome, not just the roadmap.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
