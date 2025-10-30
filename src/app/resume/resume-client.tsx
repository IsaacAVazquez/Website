"use client";

import { useEffect, useState, useRef } from "react";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, useInView } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin, IconTrendingUp, IconUsers, IconStar, IconChartBar, IconCode, IconCloud, IconBrush, IconDatabase } from "@tabler/icons-react";
import Link from "next/link";

const skillCategories = [
  {
    category: "Product & Analytics",
    icon: IconChartBar,
    skills: [
      { name: "Product Analytics", level: 90 },
      { name: "Google Analytics", level: 85 },
      { name: "Hotjar", level: 80 },
      { name: "Looker Studio", level: 85 }
    ]
  },
  {
    category: "Data & Development",
    icon: IconDatabase,
    skills: [
      { name: "SQL", level: 90 },
      { name: "PostgreSQL", level: 85 },
      { name: "MS SQL Server", level: 80 }
    ]
  },
  {
    category: "Cloud & AI",
    icon: IconCloud,
    skills: [
      { name: "Azure", level: 85 },
      { name: "GCP", level: 85 },
      { name: "ChatGPT", level: 95 },
      { name: "Claude Code", level: 95 },
      { name: "Copilot", level: 90 }
    ]
  },
  {
    category: "Design & Collaboration",
    icon: IconBrush,
    skills: [
      { name: "Figma", level: 85 },
      { name: "Miro", level: 80 },
      { name: "Canva", level: 85 },
      { name: "Photoshop", level: 75 },
      { name: "Lightroom", level: 75 },
      { name: "Jira", level: 90 },
      { name: "Asana", level: 85 },
      { name: "Agile", level: 90 }
    ]
  }
];

// Animated Counter Component
function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Set your reveal date (YYYY, MM-1, DD)
const mbaRevealDate = new Date(2025, 0, 1); // January 1, 2025

export default function Resume() {
  const [showMBA, setShowMBA] = useState(false);

  useEffect(() => {
    const now = new Date();
    setShowMBA(now >= mbaRevealDate);
  }, []);

  const handleDownloadPDF = () => {
    // Create a temporary link to download PDF
    const link = document.createElement('a');
    link.href = '/Isaac_Vazquez_Resume.pdf'; // You'll need to add this file to the public folder
    link.download = 'Isaac_Vazquez_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full py-10 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-700/20">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative max-w-6xl mx-auto"
      >
        {/* Header Section */}
        <GlassCard
          elevation={4}
          interactive={false}
          className="p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 md:mb-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/10 to-matrix-green/10" />

          <div className="relative z-10">
            {/* Name and Download Button Row */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
              <div className="text-center sm:text-left mb-4 sm:mb-0 flex-1">
                <Heading level={1} className="font-extrabold text-3xl sm:text-4xl md:text-5xl mb-2 tracking-tight gradient-text font-heading">
                  ISAAC VAZQUEZ
                </Heading>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="morph-button flex items-center gap-2 text-sm px-6 py-3 flex-shrink-0 w-full sm:w-auto justify-center"
              >
                <IconDownload className="w-4 h-4" />
                <span>DOWNLOAD PDF</span>
              </button>
            </div>

            {/* Contact Info - Centered */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-slate-300 text-sm mb-8">
              <a
                href="mailto:isaacvazquez@berkeley.edu"
                className="flex items-center gap-2 hover:text-electric-blue transition-colors font-terminal"
              >
                <IconMail className="w-4 h-4" />
                isaacvazquez@berkeley.edu
              </a>
              <span className="text-matrix-green/50">•</span>
              <a
                href="https://linkedin.com/in/isaac-vazquez"
                className="flex items-center gap-2 hover:text-electric-blue transition-colors font-terminal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandLinkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </div>

            {/* MBA Badge and Summary */}
            <div className="space-y-4 sm:space-y-5">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-electric-blue/20 to-matrix-green/20 border border-electric-blue/40">
                    <span className="text-electric-blue font-semibold text-sm sm:text-base font-terminal">
                      Berkeley Haas MBA '27 • Consortium Fellow • MLT Fellow
                    </span>
                  </div>
                </motion.div>
              )}
              <p className="text-base sm:text-lg leading-relaxed text-center max-w-4xl mx-auto text-slate-300">
                Product-focused technologist transitioning into product management with proven track record: generated <span className="text-matrix-green font-semibold">$4M+ in revenue</span>, served <span className="text-matrix-green font-semibold">60M+ users</span>, and increased <span className="text-matrix-green font-semibold">NPS from 23 to 36</span>. Bringing 6+ years of experience in quality assurance, data analytics, and technology, I bridge technical execution with strategic product outcomes to deliver measurable business impact.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Key Achievements Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <GlassCard elevation={4} className="p-6 sm:p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-matrix-green/5 via-electric-blue/5 to-neon-purple/5" />

            <div className="relative z-10">
              <Heading level={2} className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-electric-blue font-heading flex items-center justify-center gap-3">
                <IconTrendingUp className="w-6 h-6 sm:w-7 sm:h-7" />
                KEY IMPACT METRICS
              </Heading>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                {/* Revenue Generated */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-br from-matrix-green/10 to-matrix-green/5 rounded-xl p-4 sm:p-6 border border-matrix-green/30 hover:border-matrix-green/60 transition-all hover:scale-105 flex flex-col items-center text-center"
                >
                  <div className="p-2 bg-matrix-green/20 rounded-lg mb-4">
                    <IconTrendingUp className="w-5 h-5 text-matrix-green" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400 font-terminal mb-2">Revenue Generated</span>
                  <div className="text-2xl sm:text-3xl font-bold text-matrix-green font-heading">
                    $<AnimatedCounter value={4} />M+
                  </div>
                </motion.div>

                {/* Users Served */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-br from-electric-blue/10 to-electric-blue/5 rounded-xl p-4 sm:p-6 border border-electric-blue/30 hover:border-electric-blue/60 transition-all hover:scale-105 flex flex-col items-center text-center"
                >
                  <div className="p-2 bg-electric-blue/20 rounded-lg mb-4">
                    <IconUsers className="w-5 h-5 text-electric-blue" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400 font-terminal mb-2">Users Served</span>
                  <div className="text-2xl sm:text-3xl font-bold text-electric-blue font-heading">
                    <AnimatedCounter value={60} />M+
                  </div>
                </motion.div>

                {/* NPS Improvement */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-br from-neon-purple/10 to-neon-purple/5 rounded-xl p-4 sm:p-6 border border-neon-purple/30 hover:border-neon-purple/60 transition-all hover:scale-105 flex flex-col items-center text-center"
                >
                  <div className="p-2 bg-neon-purple/20 rounded-lg mb-4">
                    <IconStar className="w-5 h-5 text-neon-purple" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400 font-terminal mb-2">NPS Increase</span>
                  <div className="text-2xl sm:text-3xl font-bold text-neon-purple font-heading">
                    +<AnimatedCounter value={13} /> pts
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-terminal">23 → 36</div>
                </motion.div>

                {/* Defect Reduction */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-br from-cyber-teal/10 to-cyber-teal/5 rounded-xl p-4 sm:p-6 border border-cyber-teal/30 hover:border-cyber-teal/60 transition-all hover:scale-105 flex flex-col items-center text-center"
                >
                  <div className="p-2 bg-cyber-teal/20 rounded-lg mb-4">
                    <IconChartBar className="w-5 h-5 text-cyber-teal" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400 font-terminal mb-2">Defect Reduction</span>
                  <div className="text-2xl sm:text-3xl font-bold text-cyber-teal font-heading">
                    <AnimatedCounter value={90} />%
                  </div>
                </motion.div>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Experience Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <GlassCard elevation={3} className="p-6 sm:p-8 md:p-10">
            <Heading level={2} className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-electric-blue font-heading flex items-center gap-4">
              <div className="w-1.5 h-7 sm:h-8 bg-electric-blue rounded-full" />
              EXPERIENCE
            </Heading>

            <div className="space-y-6 sm:space-y-8 md:space-y-10">
              {/* CiviTech */}
              <div className="relative border-l-2 border-electric-blue/40 pl-6 sm:pl-8 md:pl-10 pb-4 sm:pb-5 md:pb-6">
                {/* Timeline Dot */}
                <div className="absolute left-0 -translate-x-1/2 top-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-electric-blue shadow-lg shadow-electric-blue/50 border-2 border-terminal-bg animate-pulse" />

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <Heading level={3} className="font-bold text-white text-xl sm:text-xl md:text-2xl mb-1">CIVITECH</Heading>
                    <p className="text-slate-400 font-terminal text-xs sm:text-sm">Austin, TX • January 2022–August 2025</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-5 md:mb-6 italic leading-relaxed">Civitech is a SaaS tech company that builds software and tools for political candidates to improve voter engagement</p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="relative bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-electric-blue/30 transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                        <Heading level={4} className="font-bold text-electric-blue text-base sm:text-lg mb-1 sm:mb-0">Quality Assurance Engineer</Heading>
                        <span className="text-xs sm:text-sm text-slate-400 font-terminal">Feb 2025–Aug 2025</span>
                      </div>
                    <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-slate-300 text-sm sm:text-base">
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Partnered with engineering and DevOps to create deployment rules, reducing critical production defects by <span className="text-matrix-green font-semibold">90%</span></span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Increased NPS from <span className="text-matrix-green font-semibold">23 to 36</span> by preventing customer-facing issues through improved release workflows</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Drove successful launch of RunningMate platform by translating cross-functional feedback into user stories aligned with business goals</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Synthesized prototype testing insights and stakeholder feedback into intuitive features, enhancing product usability</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Transformed technical challenges into cohesive customer journeys, driving <span className="text-matrix-green font-semibold">30%</span> product adoption</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Pioneered AI-powered workflow automation with LLM-assisted QA processes, reducing bug triage time by <span className="text-matrix-green font-semibold">40%</span></span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Trained cross-functional teams on AI tools, improving collaboration across engineering, product, and client services</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Accelerated product delivery from monthly to biweekly releases through unified testing frameworks, reducing validation time by <span className="text-matrix-green font-semibold">30%</span></span>
                      </li>
                    </ul>
                    </div>
                  </div>

                  <div className="relative bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-electric-blue/30 transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                        <Heading level={4} className="font-bold text-electric-blue text-base sm:text-lg mb-1 sm:mb-0">Quality Assurance Analyst</Heading>
                        <span className="text-xs sm:text-sm text-slate-400 font-terminal">Jan 2022–Jan 2025</span>
                      </div>
                    <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-slate-300 text-sm sm:text-base">
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Owned end-to-end product vision and feature roadmap for TextOut platform through user research and requirements definition</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Prioritized features based on impact and technical feasibility, driving <span className="text-matrix-green font-semibold">35%</span> increase in user engagement</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Championed product reliability initiatives achieving <span className="text-matrix-green font-semibold">99.999%</span> uptime through 400+ manual and automated tests</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Improved release efficiency by <span className="text-matrix-green font-semibold">30%</span> and enhanced user digital experience across two products</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Led cross-functional pricing strategy, aligning engineering, sales, and finance teams around product value</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Conducted market analysis and built financial models, generating <span className="text-matrix-green font-semibold">$4M</span> in additional revenue</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Transformed client data accessibility to self-service model through GCP automation, reducing onboarding time by <span className="text-matrix-green font-semibold">90%</span></span>
                      </li>
                    </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Progress */}
              <div className="relative border-l-2 border-matrix-green/40 pl-6 sm:pl-8 md:pl-10">
                {/* Timeline Dot */}
                <div className="absolute left-0 -translate-x-1/2 top-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-matrix-green shadow-lg shadow-matrix-green/50 border-2 border-terminal-bg animate-pulse" />

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <Heading level={3} className="font-bold text-white text-xl sm:text-xl md:text-2xl mb-1">OPEN PROGRESS</Heading>
                    <p className="text-slate-400 font-terminal text-xs sm:text-sm">Los Angeles, CA • June 2019–December 2021</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-5 md:mb-6 italic leading-relaxed">Consultancy that crafted conversational and grassroots digital engagement strategies (acquired by Civitech)</p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="relative bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-matrix-green/30 transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-matrix-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                        <Heading level={4} className="font-bold text-electric-blue text-base sm:text-lg mb-1 sm:mb-0">Client Services Manager</Heading>
                      <span className="text-xs sm:text-sm text-slate-400 font-terminal">Jan 2021–Dec 2021</span>
                    </div>
                    <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-slate-300 text-sm sm:text-base">
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Orchestrated delivery of 80+ digital programs, achieving <span className="text-matrix-green font-semibold">100%</span> on-time delivery across multiple channels</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Developed campaign messaging strategy through data analytics, resulting in <span className="text-matrix-green font-semibold">25%</span> higher engagement</span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Scaled platform to reach <span className="text-matrix-green font-semibold">50+ million</span> voters while increasing response rates by <span className="text-matrix-green font-semibold">20%</span></span>
                      </li>
                    </ul>
                    </div>
                  </div>

                  <div className="relative bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-matrix-green/30 transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-matrix-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                        <Heading level={4} className="font-bold text-electric-blue text-base sm:text-lg mb-1 sm:mb-0">Digital and Data Associate</Heading>
                      <span className="text-xs sm:text-sm text-slate-400 font-terminal">Sep 2019–Dec 2020</span>
                    </div>
                    <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-slate-300 text-sm sm:text-base">
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Built automated ETL data pipelines with interactive dashboards (Sisense, Tableau), reducing decision-making time by <span className="text-matrix-green font-semibold">40%</span></span>
                      </li>
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Optimized targeting strategies across 20+ campaigns, improving conversion rate by <span className="text-matrix-green font-semibold">25%</span> and user acquisition by <span className="text-matrix-green font-semibold">20%</span></span>
                      </li>
                    </ul>
                    </div>
                  </div>

                  <div className="relative bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-matrix-green/30 transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-matrix-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                        <Heading level={4} className="font-bold text-electric-blue text-base sm:text-lg mb-1 sm:mb-0">Digital and Communications Intern</Heading>
                      <span className="text-xs sm:text-sm text-slate-400 font-terminal">Jun 2019–Aug 2019</span>
                    </div>
                    <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 text-slate-300 text-sm sm:text-base">
                      <li className="flex items-start group">
                        <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 group-hover:scale-125 transition-transform">▸</span>
                        <span className="leading-relaxed">Implemented personalized email campaigns and A/B testing, achieving <span className="text-matrix-green font-semibold">5x</span> growth in user base and <span className="text-matrix-green font-semibold">50%</span> conversion increase</span>
                      </li>
                    </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Education Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <GlassCard elevation={3} className="p-6 sm:p-8 md:p-10">
            <Heading level={2} className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-electric-blue font-heading flex items-center gap-4">
              <div className="w-1.5 h-7 sm:h-8 bg-electric-blue rounded-full" />
              EDUCATION
            </Heading>
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-2 sm:border-l-4 border-matrix-green/50 pl-4 sm:pl-6 bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-matrix-green/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <Heading level={3} className="font-bold text-white text-lg sm:text-xl mb-1 sm:mb-0">University of California, Berkeley – Haas School of Business</Heading>
                    <span className="text-xs sm:text-sm text-slate-400 font-terminal mt-1 sm:mt-0">May 2027</span>
                  </div>
                  <p className="text-electric-blue font-semibold mb-2 sm:mb-4 text-sm sm:text-base">Master of Business Administration</p>
                  <ul className="space-y-1.5 sm:space-y-2 text-slate-300 text-xs sm:text-sm">
                    <li className="flex items-start">
                      <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5">▸</span>
                      <span>Consortium Fellow, Management Leadership for Tomorrow (MLT) Professional Development Fellow, MLT Ambassador</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-matrix-green mr-2 sm:mr-3 mt-0.5">▸</span>
                      <span>Haas Tech Club (Marketing Manager), Product Management Club, Artificial Intelligence Club, Fintech Club</span>
                    </li>
                  </ul>
                </motion.div>
              )}
              <div className="relative border-l-2 border-slate-600/50 pl-6 sm:pl-8 md:pl-10 bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-slate-600 transition-all overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute left-0 -translate-x-1/2 top-8 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-slate-600 shadow-md shadow-slate-600/30 border-2 border-terminal-bg" />
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <Heading level={3} className="font-bold text-white text-lg sm:text-xl mb-1 sm:mb-0">Florida State University</Heading>
                    <span className="text-xs sm:text-sm text-slate-400 font-terminal mt-1 sm:mt-0">December 2018</span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">Bachelor of Arts, Political Science and International Affairs</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Skills Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <GlassCard elevation={3} className="p-6 sm:p-8 md:p-10">
            <Heading level={2} className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-electric-blue font-heading flex items-center gap-4">
              <div className="w-1.5 h-7 sm:h-8 bg-electric-blue rounded-full" />
              SKILLS & EXPERTISE
            </Heading>

            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {skillCategories.map((category, catIndex) => {
                const IconComponent = category.icon;
                return (
                  <div key={category.category} className="bg-slate-900/40 rounded-lg p-4 sm:p-6 border border-slate-800/50 hover:border-electric-blue/30 transition-all">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-electric-blue/10 rounded-lg">
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-electric-blue" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-electric-blue font-terminal uppercase tracking-wider">{category.category}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill, skillIndex) => (
                        <motion.span
                          key={skill.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (catIndex * 0.1) + (skillIndex * 0.05) }}
                          className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs sm:text-sm text-slate-300 font-terminal hover:border-matrix-green/50 hover:text-matrix-green transition-all"
                        >
                          {skill.name}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.section>

        {/* Interests Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <GlassCard elevation={3} className="p-6 sm:p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-transparent" />

            <div className="relative z-10">
              <Heading level={2} className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-electric-blue font-heading flex items-center gap-4">
                <div className="w-1.5 h-7 sm:h-8 bg-gradient-to-b from-electric-blue to-neon-purple rounded-full" />
                INTERESTS
              </Heading>

              <div className="flex flex-wrap justify-center gap-4">
                {["FC Barcelona", "Ferrari (F1)", "Big Foodie", "Film & TV Buff", "Travel & Cultural Immersion", "Digital Photography"].map((interest, index) => (
                  <motion.span
                    key={interest}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-br from-neon-purple/20 to-neon-purple/5 border border-neon-purple/40 text-neon-purple text-sm sm:text-base font-semibold shadow-sm transition-all hover:scale-105 hover:border-neon-purple hover:bg-neon-purple/20 hover:shadow-lg hover:shadow-neon-purple/20 font-terminal cursor-default"
                  >
                    {interest}
                  </motion.span>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.section>
      </motion.div>
    </div>
  );
}
