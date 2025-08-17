"use client";

import { TerminalHero } from "@/components/TerminalHero";
import { Heading } from "@/components/ui/Heading";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const funFacts = [
  "Engineer with 6+ years optimizing systems and driving cross-functional execution",
  "Led platform quality for tools used by 60M+ voters during critical election cycles",
  "Known for translating technical complexity into actionable strategy",
  "Excited by hard problems — especially when the stakes are real",
  "Currently pursuing an MBA at Berkeley Haas to scale my impact across tech and business",
];

function FunFacts() {
  return (
    <motion.ul 
      className="list-none space-y-3 text-slate-300"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {funFacts.map((fact, i) => (
        <motion.li 
          key={i}
          variants={{
            hidden: { opacity: 0, x: -30, scale: 0.95 },
            visible: { 
              opacity: 1, 
              x: 0, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
              }
            }
          }}
          className="transition-all hover:scale-105 hover:text-electric-blue flex items-center space-x-3 font-mono group"
          whileHover={{ x: 10 }}
        >
          <motion.span 
            className="text-matrix-green"
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
          >&gt;</motion.span>
          <span className="group-hover:text-glow">{fact}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      {/* Terminal Hero Section */}
      <TerminalHero />
      
      {/* Secondary Content */}
      <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        {/* What I'm Focused On - Now Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto grid md:grid-cols-5 gap-4 md:gap-6 lg:gap-8 items-stretch"
        >
          {/* Headshot Card */}
          <motion.div 
            className="md:col-span-2"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.8,
              delay: 0.2,
              type: "spring",
              stiffness: 100
            }}>
            <GlassCard
              elevation={3}
              interactive={true}
              cursorGlow={true}
              noiseTexture={true}
              className="p-3 sm:p-4 bg-terminal-bg/50 border-terminal-border flex items-center justify-center h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 via-electric-blue/5 to-cyber-teal/10 rounded-xl breathing-gradient" />
              <div className="relative z-10 flex justify-center">
                <div className="relative">
                  <Image
                    src="/images/headshot-320-cropped.jpg"
                    alt="Isaac Vazquez - UC Berkeley MBA Student and Product Strategist"
                    width={320}
                    height={320}
                    priority
                    className="w-64 h-64 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-xl object-cover shadow-lg"
                    sizes="(max-width: 768px) 256px, (max-width: 1024px) 288px, 320px"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                  />
                  <div className="absolute -inset-1 bg-gradient-to-br from-neon-purple/30 to-electric-blue/30 rounded-xl blur-sm opacity-50"></div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
          
          {/* Content Card */}
          <motion.div 
            className="md:col-span-3"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.8,
              delay: 0.4,
              ease: "easeOut"
            }}>
            <GlassCard
              elevation={3}
              interactive={true}
              cursorGlow={true}
              noiseTexture={true}
              className="p-6 sm:p-8 bg-terminal-bg/50 border-terminal-border flex flex-col justify-center h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/10 to-neon-purple/5 rounded-xl breathing-gradient" />
              <div className="relative z-10 space-y-6">
                <Heading 
                  level={2}
                  className="text-cyber text-electric-blue mb-6 lg:mb-8"
                  style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
                >
                  whatImFocusedOn()
                </Heading>
                <div 
                  className="text-slate-300 leading-relaxed"
                  style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)' }}
                >
                  <p className="mb-6">
                    As an MBA candidate at UC Berkeley Haas, I'm focused on honing the tools to drive innovation, 
                    solve critical business problems, and deliver scalable impact — whether through consulting, 
                    product leadership, or a hybrid of both.
                  </p>
                  <div className="flex items-start">
                    <span className="text-matrix-green mr-3 text-lg">▸</span>
                    <span>Building the bridge between technical execution and strategic vision</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Visual Separator */}
        <motion.div 
          className="relative max-w-4xl mx-auto my-8 sm:my-12 lg:my-16"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-neon-purple/30 to-transparent"></div>
          </div>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-electric-blue/20 to-transparent blur-sm"></div>
          </div>
        </motion.div>

        {/* Enhanced Fun Facts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 0.6,
            delay: 0.1,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="max-w-4xl mx-auto"
        >
          <GlassCard
            elevation={3}
            interactive={true}
            cursorGlow={true}
            noiseTexture={true}
            className="p-8 bg-terminal-bg/50 border-terminal-border"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-matrix-green/5 via-cyber-teal/5 to-electric-blue/5 rounded-xl breathing-gradient" />
            
            <div className="relative z-10 space-y-6">
              <Heading level={2} className="text-cyber text-electric-blue text-xl lg:text-2xl mb-4">
                isaac.getCurrentStatus()
              </Heading>
              <FunFacts />
            </div>
          </GlassCard>
        </motion.div>

        {/* Call to Action Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
          className="mt-12 sm:mt-16 lg:mt-20 grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto items-stretch"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20, rotateX: -30 },
              visible: { 
                opacity: 1, 
                y: 0, 
                rotateX: 0,
                transition: {
                  duration: 0.6,
                  ease: "easeOut"
                }
              }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            style={{ perspective: 1000 }}
          >
            <GlassCard className="p-6 bg-terminal-bg/30 border-electric-blue/30 hover:border-electric-blue hover:bg-electric-blue/5 transition-all duration-300 flex flex-col h-full">
            <div className="flex-1 space-y-3">
              <motion.div 
                className="text-electric-blue font-mono text-xs uppercase tracking-wider opacity-70"
                whileHover={{ opacity: 1 }}
              >RESUME_VIEWER</motion.div>
              <h3 className="text-cyber text-white text-lg">View My Resume</h3>
              <p className="text-slate-400 font-mono text-xs opacity-80">Explore my professional experience</p>
            </div>
            <div className="mt-6">
              <Link href="/resume" className="morph-button w-full inline-block text-center group">
                <span className="flex items-center justify-center space-x-2">
                  <span>VIEW RESUME</span>
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >→</motion.span>
                </span>
              </Link>
            </div>
          </GlassCard>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20, rotateX: -30 },
              visible: { 
                opacity: 1, 
                y: 0, 
                rotateX: 0,
                transition: {
                  duration: 0.6,
                  ease: "easeOut"
                }
              }
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            style={{ perspective: 1000 }}
          >
            <GlassCard className="p-6 bg-terminal-bg/30 border-matrix-green/30 hover:border-matrix-green hover:bg-matrix-green/5 transition-all duration-300 flex flex-col h-full">
            <div className="flex-1 space-y-3">
              <motion.div 
                className="text-matrix-green font-mono text-xs uppercase tracking-wider opacity-70"
                whileHover={{ opacity: 1 }}
              >CONTACT_INIT</motion.div>
              <h3 className="text-cyber text-white text-lg">Get In Touch</h3>
              <p className="text-slate-400 font-mono text-xs opacity-80">Let's connect!</p>
            </div>
            <div className="mt-6">
              <Link href="/contact" className="morph-button w-full inline-block text-center group">
                <span className="flex items-center justify-center space-x-2">
                  <span>START CONVERSATION</span>
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >→</motion.span>
                </span>
              </Link>
            </div>
          </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}