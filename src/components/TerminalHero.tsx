"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMenu2 } from "@tabler/icons-react";
import Link from "next/link";
import { personalMetrics } from "@/constants/personal";

// Reduced particle positions for cleaner visual experience
const PARTICLE_POSITIONS = [
  { left: 20, top: 30 },
  { left: 75, top: 15 },
  { left: 10, top: 70 },
  { left: 85, top: 45 },
  { left: 45, top: 60 },
  { left: 60, top: 20 }
];

interface TerminalCommand {
  command: string;
  output: string;
  delay: number;
}

const commands: TerminalCommand[] = [
  {
    command: "whoami",
    output: `isaacvazquez // QA ENGINEER | STRATEGIC THINKER | FUTURE BUILDER
uid=1001(isaac) gid=1001(systems_thinking) groups=1001(cross_functional),1002(civic_tech),1003(coffee_addicts)
home=/Users/isaac status=building_at_intersection_of_tech_strategy_impact since=2018`,
    delay: 1000,
  },
  {
    command: "curl /career/status",
    output: `Systems Delivered: 12+
Users Impacted: ${personalMetrics.experience.votersReached.toLocaleString()}+
Critical Issues Prevented: ${personalMetrics.experience.bugsSquashed.toLocaleString()}+
Cross-functional Meetings Survived: 287
Cups of Coffee: ${personalMetrics.experience.coffeeConsumed}`,
    delay: 2000,
  },
  {
    command: "systemctl status isaac.service",
    output: `● isaac.service - Tech-Backed Problem Solver
   Loaded: loaded (/etc/systemd/system/isaac.service; enabled)
   Active: ACTIVE - building at the intersection of tech, strategy, and user impact
   Process: ${personalMetrics.experience.votersReached.toLocaleString()} voters served
   Memory: ${personalMetrics.experience.yearsInQA}+ years experience loaded
   CGroup: /system.slice/isaac.service
           ├─ systems-thinking.exe
           ├─ cross-functional-collaboration.daemon
           └─ strategic-problem-solving.worker`,
    delay: 3000,
  },
  {
    command: "curl -s isaac.local/api/personality | jq",
    output: `{
  "traits": ["perfectionist", "problem_solver", "empathetic"],
  "debug_mode": "always_on",
  "coffee_dependency": "high",
  "bug_detection": "enhanced",
  "user_empathy": "maximum",
  "status": "optimistically_debugging_life"
}`,
    delay: 4000,
  },
  {
    command: "grep -r 'passion' ~/.isaac/",
    output: `~/.isaac/values.conf: passion="building_trust_through_quality"
~/.isaac/hobbies.txt: passion="hiking_texas_trails"
~/.isaac/career.log: passion="civic_tech_impact"
~/.isaac/daily.sh: passion="learning_new_testing_frameworks"
~/.isaac/dreams.txt: passion="democratizing_quality_assurance"`,
    delay: 5500,
  },
  {
    command: "tail -f /var/log/isaac/impact.log",
    output: `[${new Date().toISOString()}] INFO: ${personalMetrics.experience.votersReached.toLocaleString()}+ voters reached
[${new Date().toISOString()}] SUCCESS: 0 critical bugs in production
[${new Date().toISOString()}] WARNING: Perfectionist mode may cause overtime
[${new Date().toISOString()}] INFO: Quality assurance protocols engaged
[${new Date().toISOString()}] STATUS: Building the future, one test at a time...`,
    delay: 6500,
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
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden" role="main" aria-label="Isaac Vazquez - Product Strategist and UC Berkeley MBA">
      {/* Mobile Navigation */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Link 
          href="/about"
          className="flex items-center justify-center w-12 h-12 bg-terminal-bg/90 border border-electric-blue/30 rounded-full backdrop-blur-md shadow-lg hover:bg-electric-blue/10 transition-all glow-effect focus-ring"
          aria-label="Open navigation menu"
        >
          <IconMenu2 className="w-6 h-6 text-electric-blue" aria-hidden="true" />
        </Link>
      </div>

      {/* Simplified Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-800/20 to-slate-700/10">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Subtle Floating Particles */}
      <div className="absolute inset-0">
        {PARTICLE_POSITIONS.map((position, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-electric-blue/60 rounded-full"
            style={{
              left: `${position.left}%`,
              top: `${position.top}%`,
            }}
            animate={{
              y: [-10, 10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Content - Value Proposition First */}
        <div className="flex flex-col items-center text-center space-y-12">
          
          {/* Primary Hero Content */}
          <header className="max-w-4xl space-y-6" role="banner">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-mono text-electric-blue uppercase tracking-widest"
              aria-hidden="true"
            >
              &gt; SYSTEM_READY...
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="heading-hero gradient-text"
              id="main-heading"
            >
              ISAAC VAZQUEZ
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-cyber text-matrix-green text-xl md:text-2xl"
              role="text"
              aria-describedby="main-heading"
            >
              PRODUCT STRATEGIST // BUSINESS LEADER // UC BERKELEY MBA CANDIDATE
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto"
            >
              I'm passionate about the intersection of technology and strategy — from civic minded tech in Austin to Silicon Valley innovation ecosystems. As a UC Berkeley Haas MBA 
              student and business leader, I explore how technical expertise and strategic thinking can 
              solve meaningful problems and create lasting impact across communities and markets.
            </motion.p>

            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
              role="navigation"
              aria-label="Main navigation"
            >
              <Link href="/about" className="morph-button glow-effect inline-block focus-ring" aria-describedby="main-heading">
                <span className="relative z-10">ABOUT ME</span>
              </Link>
              
              <Link href="/projects" className="px-6 py-3 border border-electric-blue text-electric-blue hover:bg-electric-blue/10 rounded-lg transition-all duration-300 font-terminal uppercase tracking-wider inline-block text-center focus-ring" aria-label="View my projects and work">
                PROJECTS
              </Link>
              
              <Link href="/blog" className="px-6 py-3 border border-matrix-green text-matrix-green hover:bg-matrix-green/10 rounded-lg transition-all duration-300 font-terminal uppercase tracking-wider inline-block text-center focus-ring" aria-label="Read my blog posts and insights">
                BLOG
              </Link>
            </motion.nav>
          </header>

          {/* Status Indicators - moved between nav and terminal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center space-x-6"
            role="status"
            aria-label="Current activities"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-matrix-green rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-sm font-mono text-slate-400">CONNECTING</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-sm font-mono text-slate-400">STUDYING</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning-amber rounded-full animate-pulse" aria-hidden="true"></div>
              <span className="text-sm font-mono text-slate-400">EXPLORING</span>
            </div>
          </motion.div>

          {/* Secondary - Compact Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="w-full max-w-2xl"
          >
            <div 
              className="glass-card bg-terminal-bg/95 border-terminal-border rounded-lg p-4 font-terminal text-xs shadow-2xl backdrop-blur-xl"
              role="complementary"
              aria-label="Interactive terminal showing system information"
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-terminal-border">
                <div className="flex items-center space-x-2" aria-label="Terminal window controls">
                  <div className="w-2 h-2 rounded-full bg-error-red" aria-hidden="true"></div>
                  <div className="w-2 h-2 rounded-full bg-warning-amber" aria-hidden="true"></div>
                  <div className="w-2 h-2 rounded-full bg-matrix-green" aria-hidden="true"></div>
                </div>
                <span className="text-slate-400 text-xs" aria-label="Command prompt">isaac@vazquez:~$</span>
              </div>

              {/* Compact Terminal Content */}
              <div 
                className="terminal-content space-y-1 max-h-[180px] overflow-y-auto terminal-scroll" 
                role="log" 
                aria-live="polite"
                aria-label="Terminal output showing professional information"
              >
                <AnimatePresence>
                  {displayedCommands.slice(-3).map((cmd, index) => (
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
                      
                      {/* Output - truncated for compact view */}
                      <div className="ml-4 text-slate-300 whitespace-pre-line text-xs">
                        {cmd.output.split('\n').slice(0, 2).join('\n')}
                        {cmd.output.split('\n').length > 2 && '...'}
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
            </div>
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