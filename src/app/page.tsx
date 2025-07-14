"use client";

import { TerminalHero } from "@/components/TerminalHero";
import { Heading } from "@/components/Heading";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import Link from "next/link";

const funFacts = [
  "Full-stack QA Engineer with 6+ years breaking software (professionally)",
  "Civic tech enthusiast who helped 100K+ voters access democracy", 
  "Data-driven tester who's written 25,000+ test cases",
  "Bug hunter with 150,000+ issues caught before production",
  "99.7% uptime achieved across critical production systems",
];

function FunFacts() {
  return (
    <ul className="list-none space-y-3 text-slate-300">
      {funFacts.map((fact, i) => (
        <motion.li 
          key={i} 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="transition-all hover:scale-105 hover:text-electric-blue flex items-center space-x-3 font-mono"
        >
          <span className="text-matrix-green">&gt;</span>
          <span>{fact}</span>
        </motion.li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      {/* Terminal Hero Section */}
      <TerminalHero />
      
      {/* Secondary Content */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Fun Facts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <GlassCard
            elevation={3}
            interactive={true}
            cursorGlow={true}
            noiseTexture={true}
            className="p-8 bg-terminal-bg/50 border-terminal-border"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/5 to-matrix-green/5 rounded-xl breathing-gradient" />
            
            <div className="relative z-10 space-y-6">
              <Heading as="h2" className="text-cyber text-electric-blue text-2xl mb-6">
                isaac.getCurrentStatus()
              </Heading>
              <FunFacts />
            </div>
          </GlassCard>
        </motion.div>

        {/* Call to Action Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          <GlassCard className="p-6 bg-terminal-bg/30 border-electric-blue/30 hover:border-electric-blue transition-all duration-300">
            <div className="space-y-4">
              <div className="text-electric-blue font-mono text-sm uppercase tracking-wider">RESUME_VIEWER</div>
              <h3 className="text-cyber text-white text-xl">View My Resume</h3>
              <p className="text-slate-400 font-mono text-sm">Explore my professional experience and qualifications</p>
              <Link href="/resume" className="morph-button w-full inline-block text-center">
                VIEW RESUME
              </Link>
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-terminal-bg/30 border-matrix-green/30 hover:border-matrix-green transition-all duration-300">
            <div className="space-y-4">
              <div className="text-matrix-green font-mono text-sm uppercase tracking-wider">CONTACT_INIT</div>
              <h3 className="text-cyber text-white text-xl">Get In Touch</h3>
              <p className="text-slate-400 font-mono text-sm">Let's build something amazing together</p>
              <Link href="/contact" className="px-6 py-3 border border-matrix-green text-matrix-green hover:bg-matrix-green/10 rounded-lg transition-all duration-300 font-terminal uppercase tracking-wider w-full inline-block text-center">
                START CONVERSATION
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}