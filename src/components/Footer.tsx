"use client";
import React from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { IconMail, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export const Footer = () => {
  return (
    <motion.footer
      role="contentinfo"
      aria-label="Site footer with copyright and social links"
      className="relative z-20 bg-gradient-to-t from-neutral-100 to-transparent dark:from-[#1A0F0C] dark:to-transparent backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-700"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        ease: [0.4, 0.0, 0.2, 1],
        delay: 0.2
      }}
    >
      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          className="rounded-2xl p-8 md:p-12 text-center border"
          style={{
            backgroundColor: 'var(--neutral-900)',
            borderColor: 'var(--neutral-700)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-50 mb-4">
            Need a PM who can own the roadmap end to end?
          </h2>
          <p className="text-lg text-neutral-300 mb-8 max-w-2xl mx-auto">
            Looking for a product manager who combines technical expertise with strategic thinking?
            Let&apos;s discuss how I can help drive your product vision forward.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/#contact">
              <motion.button
                className="px-8 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all min-h-[52px] flex items-center gap-2 text-lg"
                whileHover={{ scale: 1.03, boxShadow: "0 12px 32px rgba(0, 0, 0, 0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                <IconMail className="w-5 h-5" />
                Get In Touch
                <IconArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link href="/resume">
              <motion.button
                className="px-8 py-4 bg-transparent text-neutral-100 border-2 border-[var(--neutral-500)] hover:border-[var(--neutral-300)] dark:border-[var(--neutral-400)] dark:hover:border-[var(--neutral-100)] font-semibold rounded-xl transition-all min-h-[52px] flex items-center gap-2 text-lg"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                View Resume
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col items-center justify-center p-5 pb-2">
        <div className="flex items-center gap-2 text-base font-medium text-neutral-500 dark:text-neutral-400 mb-1">
        <motion.span
          className="text-lg select-none inline-block"
          animate={{
            rotate: [0, -20, 10, 8, -12, 0, 0],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            times: [0, 0.1, 0.2, 0.4, 0.5, 0.6, 1],
          }}
        >
          ⚡
        </motion.span>
        <span>{new Date().getFullYear()}</span>
        <span>&#8212; Built by</span>
        <motion.a
          href="https://isaacavazquez.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-neutral-900 dark:text-neutral-100"
          whileHover={{
            filter: "drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))",
          }}
          transition={{ duration: 0.3 }}
        >
          Isaac Vazquez
        </motion.a>
      </div>
      <motion.nav
        aria-label="Social media links"
        className="flex gap-4 mt-1 opacity-75"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <motion.a
          href="https://linkedin.com/in/isaac-vazquez"
          aria-label="Visit Isaac Vazquez's LinkedIn profile"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <FaLinkedin size={20} aria-hidden="true" />
        </motion.a>
        <motion.a
          href="https://github.com/IsaacAVazquez"
          aria-label="Visit Isaac Vazquez's GitHub profile"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <FaGithub size={20} aria-hidden="true" />
        </motion.a>
      </motion.nav>

      {/* Accessibility Statement Link */}
      <div className="mt-3 text-center">
        <Link
          href="/accessibility"
          className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline"
        >
          Accessibility Statement
        </Link>
      </div>
      </div>
    </motion.footer>
  );
};
