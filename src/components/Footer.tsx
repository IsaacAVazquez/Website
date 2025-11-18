"use client";
import React from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export const Footer = () => {
  return (
    <motion.footer
      role="contentinfo"
      aria-label="Site footer with copyright and social links"
      className="relative z-20 flex flex-col items-center justify-center p-5 pb-2 min-h-[72px] bg-gradient-to-t from-neutral-50 to-transparent dark:from-black dark:to-transparent backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-600"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        ease: [0.4, 0.0, 0.2, 1],
        delay: 0.2
      }}
    >
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
          className="font-bold text-black dark:text-white"
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
          className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <FaGithub size={20} aria-hidden="true" />
        </motion.a>
      </motion.nav>
    </motion.footer>
  );
};
