"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin, IconPhone } from "@tabler/icons-react";
import Link from "next/link";

const skillCategories = [
  {
    category: "Product & Analytics",
    skills: ["Product Analytics", "Google Analytics", "Hotjar", "Looker Studio"]
  },
  {
    category: "Data & Development",
    skills: ["SQL", "PostgreSQL", "MS SQL Server"]
  },
  {
    category: "Cloud & AI",
    skills: ["Azure", "GCP", "ChatGPT", "Claude Code", "Copilot"]
  },
  {
    category: "Design & Collaboration",
    skills: ["Figma", "Miro", "Canva", "Photoshop", "Lightroom", "Jira", "Asana", "Agile"]
  }
];

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
    <div className="min-h-screen w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-700/20">
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
        className="relative max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto"
      >
        {/* Header Section */}
        <GlassCard
          elevation={4}
          interactive={false}
          className="p-4 sm:p-6 md:p-8 lg:p-10 mb-6 sm:mb-8 md:mb-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/10 to-matrix-green/10" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 md:mb-8">
              <div className="flex-1 mb-4 sm:mb-0">
                <Heading level={1} className="font-extrabold text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 tracking-tight gradient-text font-heading">
                  ISAAC VAZQUEZ
                </Heading>
                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-2 text-slate-300 text-xs sm:text-sm">
                  <a
                    href="tel:(850)591-0159"
                    className="flex items-center gap-2 hover:text-electric-blue transition font-terminal"
                  >
                    <IconPhone className="w-4 h-4" />
                    (850) 591-0159
                  </a>
                  <span className="hidden sm:inline text-matrix-green/50">•</span>
                  <a
                    href="mailto:isaacvazquez@berkeley.edu"
                    className="flex items-center gap-2 hover:text-electric-blue transition font-terminal"
                  >
                    <IconMail className="w-4 h-4" />
                    <span className="hidden xs:inline">isaacvazquez@berkeley.edu</span>
                    <span className="xs:hidden">Email</span>
                  </a>
                  <span className="hidden sm:inline text-matrix-green/50">•</span>
                  <a
                    href="https://linkedin.com/in/isaac-vazquez"
                    className="flex items-center gap-2 hover:text-electric-blue transition font-terminal"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconBrandLinkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                </div>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="morph-button flex items-center gap-2 text-xs sm:text-sm flex-shrink-0 w-full sm:w-auto justify-center"
              >
                <IconDownload className="w-4 h-4" />
                <span>DOWNLOAD PDF</span>
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3 text-slate-300">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pb-2 sm:pb-3 border-b border-electric-blue/20"
                >
                  <p className="font-semibold text-electric-blue text-sm sm:text-base md:text-lg">
                    Berkeley Haas MBA Candidate '27 | Consortium Fellow | MLT Professional Development Fellow
                  </p>
                </motion.div>
              )}
              <p className="text-sm sm:text-base leading-relaxed pt-1 sm:pt-2">
                Product-focused technologist transitioning into product management with proven track record: generated <span className="text-matrix-green font-semibold">$4M+ in revenue</span>, served <span className="text-matrix-green font-semibold">60M+ users</span>, and increased <span className="text-matrix-green font-semibold">NPS from 23 to 36</span>. Bringing 6+ years of experience in quality assurance, data analytics, and technology, I bridge technical execution with strategic product outcomes to deliver measurable business impact.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Experience Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <GlassCard elevation={3} className="p-4 sm:p-6 md:p-8 lg:p-10">
            <Heading level={2} className="text-2xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-electric-blue font-heading flex items-center gap-2 sm:gap-3">
              <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-electric-blue rounded-full" />
              EXPERIENCE
            </Heading>

            <div className="space-y-6 sm:space-y-8 md:space-y-10">
              {/* CiviTech */}
              <div className="border-l-2 sm:border-l-3 md:border-l-4 border-electric-blue/40 pl-3 sm:pl-4 md:pl-6 pb-4 sm:pb-5 md:pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <Heading level={3} className="font-bold text-white text-xl sm:text-xl md:text-2xl mb-1">CIVITECH</Heading>
                    <p className="text-slate-400 font-terminal text-xs sm:text-sm">Austin, TX • January 2022–August 2025</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-5 md:mb-6 italic leading-relaxed">Civitech is a SaaS tech company that builds software and tools for political candidates to improve voter engagement</p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50 hover:border-electric-blue/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
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

                  <div className="bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50 hover:border-electric-blue/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
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

              {/* Open Progress */}
              <div className="border-l-2 sm:border-l-3 md:border-l-4 border-matrix-green/40 pl-3 sm:pl-4 md:pl-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <Heading level={3} className="font-bold text-white text-xl sm:text-xl md:text-2xl mb-1">OPEN PROGRESS</Heading>
                    <p className="text-slate-400 font-terminal text-xs sm:text-sm">Los Angeles, CA • June 2019–December 2021</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-5 md:mb-6 italic leading-relaxed">Consultancy that crafted conversational and grassroots digital engagement strategies (acquired by Civitech)</p>

                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  <div className="bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50 hover:border-matrix-green/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
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

                  <div className="bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50 hover:border-matrix-green/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
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

                  <div className="bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50 hover:border-matrix-green/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
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
          </GlassCard>
        </motion.section>

        {/* Education Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <GlassCard elevation={3} className="p-4 sm:p-6 md:p-8 lg:p-10">
            <Heading level={2} className="text-2xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-electric-blue font-heading flex items-center gap-2 sm:gap-3">
              <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-electric-blue rounded-full" />
              EDUCATION
            </Heading>
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-2 sm:border-l-3 md:border-l-4 border-matrix-green/50 pl-3 sm:pl-4 md:pl-6 bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50 hover:border-matrix-green/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <Heading level={3} className="font-bold text-white text-lg sm:text-xl mb-1 sm:mb-0">University of California, Berkeley – Haas School of Business</Heading>
                    <span className="text-xs sm:text-sm text-slate-400 font-terminal mt-1 sm:mt-0">May 2027</span>
                  </div>
                  <p className="text-electric-blue font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Master of Business Administration</p>
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
              <div className="border-l-2 sm:border-l-3 md:border-l-4 border-slate-600/50 pl-3 sm:pl-4 md:pl-6 bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <Heading level={3} className="font-bold text-white text-lg sm:text-xl mb-1 sm:mb-0">Florida State University</Heading>
                  <span className="text-xs sm:text-sm text-slate-400 font-terminal mt-1 sm:mt-0">December 2018</span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm">Bachelor of Arts, Political Science and International Affairs</p>
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
          <GlassCard elevation={3} className="p-4 sm:p-6 md:p-8 lg:p-10">
            <Heading level={2} className="text-2xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-electric-blue font-heading flex items-center gap-2 sm:gap-3">
              <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-electric-blue rounded-full" />
              SKILLS & EXPERTISE
            </Heading>

            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {skillCategories.map((category, catIndex) => (
                <div key={category.category} className="bg-slate-900/40 rounded-lg p-3 sm:p-4 md:p-5 border border-slate-800/50">
                  <h3 className="text-xs sm:text-sm font-bold text-electric-blue mb-2 sm:mb-3 font-terminal uppercase tracking-wider">{category.category}</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {category.skills.map((skill, skillIndex) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (catIndex * 0.1) + (skillIndex * 0.03) }}
                        className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-terminal-bg/70 border border-matrix-green/30 text-matrix-green text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 hover:border-matrix-green hover:bg-matrix-green/10 hover:shadow-md font-terminal"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.section>

        {/* Interests Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 sm:mt-8 md:mt-10"
        >
          <GlassCard elevation={3} className="p-4 sm:p-6 md:p-8 lg:p-10">
            <Heading level={2} className="text-2xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-electric-blue font-heading flex items-center gap-2 sm:gap-3">
              <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-electric-blue rounded-full" />
              INTERESTS
            </Heading>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {["FC Barcelona", "Ferrari (F1)", "Big Foodie", "Film & TV Buff", "Travel & Cultural Immersion", "Digital Photography"].map((interest, index) => (
                <motion.span
                  key={interest}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-terminal-bg/70 border border-neon-purple/30 text-neon-purple text-xs sm:text-sm font-semibold shadow-sm transition-all hover:scale-105 hover:border-neon-purple hover:bg-neon-purple/10 hover:shadow-md font-terminal"
                >
                  {interest}
                </motion.span>
              ))}
            </div>
          </GlassCard>
        </motion.section>
      </motion.div>
    </div>
  );
}
