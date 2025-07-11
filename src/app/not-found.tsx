"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconHome, IconArrowLeft } from "@tabler/icons-react";
import { MorphButton } from "@/components/ui/MorphButton";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-700/20">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Glitch Effect Background */}
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
              rgba(0, 245, 255, 0.1) 10px,
              rgba(0, 245, 255, 0.1) 20px
            )`,
          }}
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-2xl">
        {/* 404 Text with Glitch Effect */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative mb-8"
        >
          <h1 className="text-9xl font-heading font-black text-electric-blue relative">
            404
            <motion.span
              className="absolute inset-0 text-error-red"
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
              className="absolute inset-0 text-matrix-green"
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
          className="mb-8 font-terminal text-matrix-green"
        >
          <p className="text-xl mb-2">
            <span className="text-electric-blue">$</span> cat /page/not/found
          </p>
          <p className="text-sm text-slate-400">
            Error: The requested resource could not be located in the system.
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-slate-300 mb-8"
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
            <MorphButton
              variant="primary"
              size="lg"
              icon={<IconHome className="h-5 w-5" />}
              iconPosition="left"
            >
              Return Home
            </MorphButton>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-electric-blue text-electric-blue hover:bg-electric-blue/10 rounded-lg transition-all duration-300 font-terminal uppercase tracking-wider inline-flex items-center gap-2"
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
          className="mt-16 font-terminal text-sm text-slate-500"
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