"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconHome, IconArrowLeft } from "@tabler/icons-react";
import { ModernButton } from "@/components/ui/ModernButton";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0]/50 via-[#FFFCF7]/30 to-[#FFE4D6]/20 dark:from-[#2D1B12]/50 dark:via-[#1C1410]/30 dark:to-[#4A3426]/20">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 107, 53, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 107, 53, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Warm Effect Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255, 107, 53, 0.1) 10px,
              rgba(255, 107, 53, 0.1) 20px
            )`,
          }}
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-2xl">
        {/* 404 Text with Warm Effect */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          <h1 className="text-9xl font-heading font-black text-[#FF6B35] dark:text-[#FF8E53] relative">
            404
            <motion.span
              className="absolute inset-0 text-[#FF5757]"
              animate={{
                opacity: [0, 1, 0],
                x: [-2, 2, -2],
              }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              404
            </motion.span>
            <motion.span
              className="absolute inset-0 text-[#F7B32B]"
              animate={{
                opacity: [0, 1, 0],
                x: [2, -2, 2],
              }}
              transition={{
                duration: 0.2,
                repeat: Infinity,
                repeatDelay: 3,
                delay: 0.1,
              }}
            >
              404
            </motion.span>
          </h1>
        </motion.div>

        {/* Terminal-style Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8 font-terminal text-[#6BCF7F] dark:text-[#8FE39E]"
        >
          <p className="text-xl mb-2">
            <span className="text-[#FF6B35] dark:text-[#FF8E53]">$</span> cat /page/not/found
          </p>
          <p className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">
            Error: The requested resource could not be located in the system.
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-[#4A3426] dark:text-[#FFE4D6] mb-8"
        >
          Looks like you've ventured into uncharted territory.
          This page doesn't exist in our system... yet.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <ModernButton
              variant="primary"
              size="lg"
              icon={<IconHome className="h-5 w-5" />}
              iconPosition="left"
            >
              Return Home
            </ModernButton>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-[#FF6B35] dark:border-[#FF8E53] text-[#FF6B35] dark:text-[#FF8E53] hover:bg-[#FF6B35]/10 dark:hover:bg-[#FF8E53]/10 rounded-lg transition-all duration-300 font-terminal uppercase tracking-wider inline-flex items-center gap-2"
          >
            <IconArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </motion.div>

        {/* Fun Terminal Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 font-terminal text-sm text-[#6B4F3D] dark:text-[#D4A88E]"
        >
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ■ SEARCHING FOR PAGE... ■
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}