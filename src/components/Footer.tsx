"use client";
import React from "react";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedin } from "react-icons/fa";

export const Footer = () => {
  return (
    <motion.footer
      role="contentinfo"
      aria-label="Site footer with copyright and social links"
      className="relative z-20 flex flex-col items-center justify-center p-5 pb-2 min-h-[72px] bg-gradient-to-t from-[#FFFCF7] to-transparent dark:from-[#1C1410] dark:to-transparent backdrop-blur-sm rounded-t-xl border-t-2 border-[#FFE4D6] dark:border-[#FF8E53]/30"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        ease: [0.4, 0.0, 0.2, 1],
        delay: 0.2
      }}
    >
      <div className="flex items-center gap-2 text-base font-semibold text-[#6B4F3D] dark:text-[#D4A88E] mb-1">
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
          className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF6B35] via-[#F7B32B] to-[#FF8E53]"
          whileHover={{
            filter: "drop-shadow(0 0 4px rgba(255, 107, 53, 0.6))",
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
          className="text-[#6B4F3D] dark:text-[#D4A88E] hover:text-[#FF6B35] dark:hover:text-[#FF8E53] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <FaLinkedin size={20} aria-hidden="true" />
        </motion.a>
        <motion.a
          href="https://github.com/IsaacAVazquez"
          aria-label="Visit Isaac Vazquez's GitHub profile"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#6B4F3D] dark:text-[#D4A88E] hover:text-[#FF6B35] dark:hover:text-[#FF8E53] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <FaGithub size={20} aria-hidden="true" />
        </motion.a>
      </motion.nav>
    </motion.footer>
  );
};
