"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";

interface TerminalCommand {
  command: string;
  output: string;
  delay: number;
}

const commands: TerminalCommand[] = [
  {
    command: "whoami",
    output: "isaac_vazquez",
    delay: 1000,
  },
  {
    command: "cat skills.txt",
    output: `QA Engineering
Software Testing
Automation
Data Analytics
Web Development`,
    delay: 2000,
  },
  {
    command: "ls achievements/",
    output: `fantasy_football_champion.txt
bug_hunter_supreme.exe
data_whisperer.py
quality_guardian.sh`,
    delay: 3000,
  },
  {
    command: "echo $MISSION",
    output: "Build things that real people use and enjoy",
    delay: 4000,
  },
  {
    command: "status",
    output: "■ SYSTEM READY ■ BUILDING THE FUTURE ■",
    delay: 5000,
  },
];

export function TerminalHero() {
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [displayedCommands, setDisplayedCommands] = useState<TerminalCommand[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (currentCommandIndex < commands.length) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setDisplayedCommands(prev => [...prev, commands[currentCommandIndex]]);
          setCurrentCommandIndex(prev => prev + 1);
          setIsTyping(false);
        }, 800);
      }, commands[currentCommandIndex].delay);

      return () => clearTimeout(timer);
    }
  }, [currentCommandIndex]);

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Mobile Navigation */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Link 
          href="/about"
          className="flex items-center justify-center w-12 h-12 bg-terminal-bg/90 border border-electric-blue/30 rounded-full backdrop-blur-md shadow-lg hover:bg-electric-blue/10 transition-all glow-effect"
          aria-label="Navigation menu"
        >
          <IconMenu2 className="w-6 h-6 text-electric-blue" />
        </Link>
      </div>

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

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-electric-blue rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Terminal */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-card bg-terminal-bg/95 border-terminal-border rounded-lg p-6 font-terminal text-sm shadow-2xl backdrop-blur-xl"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-terminal-border">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-error-red"></div>
                <div className="w-3 h-3 rounded-full bg-warning-amber"></div>
                <div className="w-3 h-3 rounded-full bg-matrix-green"></div>
              </div>
              <span className="text-slate-400 text-xs">isaac@vazquez:~$</span>
            </div>

            {/* Terminal Content */}
            <div className="space-y-2 min-h-[250px] max-h-[350px] overflow-y-auto">
              <AnimatePresence>
                {displayedCommands.map((cmd, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Command Line */}
                    <div className="flex items-center space-x-2">
                      <span className="text-matrix-green">$</span>
                      <span className="text-electric-blue">{cmd.command}</span>
                    </div>
                    
                    {/* Output */}
                    <div className="ml-4 text-slate-300 whitespace-pre-line">
                      {cmd.output}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Blinking Cursor */}
              {isTyping && (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-matrix-green">$</span>
                  <span className="text-electric-blue">
                    {commands[currentCommandIndex]?.command.slice(0, -1)}
                  </span>
                  <motion.span
                    className="w-2 h-5 bg-electric-blue"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Side - Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-mono text-electric-blue uppercase tracking-widest"
              >
                &gt; INITIALIZING_SYSTEM...
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="heading-hero gradient-text"
              >
                ISAAC VAZQUEZ
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-cyber text-matrix-green text-xl"
              >
                QA ENGINEER // DATA WHISPERER // BUILDER
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-lg text-slate-300 leading-relaxed max-w-lg"
            >
              Specializing in breaking things so you don't have to. 
              I thrive on the cutting edge, catching bugs before they bite, 
              and shipping software you can trust.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button className="morph-button glow-effect">
                <span className="relative z-10">VIEW PROJECTS</span>
              </button>
              
              <button className="px-6 py-3 border border-electric-blue text-electric-blue hover:bg-electric-blue/10 rounded-lg transition-all duration-300 font-terminal uppercase tracking-wider">
                DOWNLOAD CV
              </button>
            </motion.div>

            {/* Status Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="flex items-center space-x-6 pt-4"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-slate-400">ONLINE</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-slate-400">BUILDING</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning-amber rounded-full animate-pulse"></div>
                <span className="text-sm font-mono text-slate-400">LEARNING</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-electric-blue rounded-full p-1"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-electric-blue rounded-full mx-auto"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}