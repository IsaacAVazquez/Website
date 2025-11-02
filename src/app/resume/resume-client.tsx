"use client";

import { useEffect, useState, useRef } from "react";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import { motion, useInView } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin, IconTrendingUp, IconUsers, IconStar, IconChartBar, IconCode, IconCloud, IconBrush, IconDatabase } from "@tabler/icons-react";

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

const mbaRevealDate = new Date(2025, 0, 1);

export default function Resume() {
  const [showMBA, setShowMBA] = useState(false);

  useEffect(() => {
    const now = new Date();
    setShowMBA(now >= mbaRevealDate);
  }, []);

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = '/Isaac_Vazquez_Resume.pdf';
    link.download = 'Isaac_Vazquez_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header Section */}
        <WarmCard hover={false} padding="xl" className="mb-8">
          {/* Name and Download Button Row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <div className="text-center sm:text-left mb-4 sm:mb-0 flex-1">
              <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl mb-2 tracking-tight gradient-text-warm display-heading">
                ISAAC VAZQUEZ
              </h1>
            </div>

            <ModernButton
              onClick={handleDownloadPDF}
              variant="primary"
              size="md"
              className="flex-shrink-0 w-full sm:w-auto"
            >
              <IconDownload className="inline mr-2 w-4 h-4" />
              DOWNLOAD PDF
            </ModernButton>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[#4A3426] dark:text-[#D4A88E] text-sm mb-8">
            <a
              href="mailto:isaacvazquez@berkeley.edu"
              className="flex items-center gap-2 hover:text-[#FF6B35] transition-colors"
            >
              <IconMail className="w-4 h-4" />
              isaacvazquez@berkeley.edu
            </a>
            <span className="text-[#F7B32B]">•</span>
            <a
              href="https://linkedin.com/in/isaac-vazquez"
              className="flex items-center gap-2 hover:text-[#FF6B35] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandLinkedin className="w-4 h-4" />
              LinkedIn
            </a>
          </div>

          {/* MBA Badge and Summary */}
          <div className="space-y-4">
            {showMBA && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#FF6B35]/20 to-[#F7B32B]/20 border-2 border-[#FF6B35]/40">
                  <span className="text-[#FF6B35] dark:text-[#FF8E53] font-semibold text-sm sm:text-base">
                    Berkeley Haas MBA '27 • Consortium Fellow • MLT Fellow
                  </span>
                </div>
              </motion.div>
            )}
            <p className="text-base sm:text-lg leading-relaxed text-center max-w-4xl mx-auto text-[#4A3426] dark:text-[#D4A88E]">
              Technical product manager and UC Berkeley Haas MBA candidate with a proven track record: generated <span className="text-[#FF6B35] font-semibold">$4M+ in revenue</span>, served <span className="text-[#FF6B35] font-semibold">60M+ users</span>, and increased <span className="text-[#FF6B35] font-semibold">NPS from 23 to 36</span>. I pair a QA and data analytics foundation with product strategy, experimentation, and cross-functional leadership to deliver measurable business impact.
            </p>
          </div>
        </WarmCard>

        {/* Key Achievements Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <WarmCard hover={false} padding="xl">
            <Heading level={2} className="text-2xl md:text-3xl font-bold mb-8 text-[#FF6B35] flex items-center justify-center gap-3">
              <IconTrendingUp className="w-7 h-7" />
              KEY IMPACT METRICS
            </Heading>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Revenue Generated */}
              <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#F7B32B]/5 rounded-xl p-6 border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 text-center">
                <div className="p-2 bg-[#FF6B35]/20 rounded-lg mb-4 inline-block">
                  <IconTrendingUp className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mb-2 block">Revenue Generated</span>
                <div className="text-3xl font-bold text-[#FF6B35]">
                  $<AnimatedCounter value={4} />M+
                </div>
              </div>

              {/* Users Served */}
              <div className="bg-gradient-to-br from-[#F7B32B]/10 to-[#F7B32B]/5 rounded-xl p-6 border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 text-center">
                <div className="p-2 bg-[#F7B32B]/20 rounded-lg mb-4 inline-block">
                  <IconUsers className="w-5 h-5 text-[#F7B32B]" />
                </div>
                <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mb-2 block">Users Served</span>
                <div className="text-3xl font-bold text-[#F7B32B]">
                  <AnimatedCounter value={60} />M+
                </div>
              </div>

              {/* NPS Improvement */}
              <div className="bg-gradient-to-br from-[#FF8E53]/10 to-[#FF8E53]/5 rounded-xl p-6 border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 text-center">
                <div className="p-2 bg-[#FF8E53]/20 rounded-lg mb-4 inline-block">
                  <IconStar className="w-5 h-5 text-[#FF8E53]" />
                </div>
                <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mb-2 block">NPS Increase</span>
                <div className="text-3xl font-bold text-[#FF8E53]">
                  +<AnimatedCounter value={13} /> pts
                </div>
                <div className="text-xs text-[#9C7A5F] mt-1">23 → 36</div>
              </div>

              {/* Defect Reduction */}
              <div className="bg-gradient-to-br from-[#6BCF7F]/10 to-[#6BCF7F]/5 rounded-xl p-6 border-2 border-[#FFE4D6] dark:border-[#FF8E53]/30 text-center">
                <div className="p-2 bg-[#6BCF7F]/20 rounded-lg mb-4 inline-block">
                  <IconChartBar className="w-5 h-5 text-[#6BCF7F]" />
                </div>
                <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mb-2 block">Defect Reduction</span>
                <div className="text-3xl font-bold text-[#6BCF7F]">
                  <AnimatedCounter value={90} />%
                </div>
              </div>
            </div>
          </WarmCard>
        </motion.section>

        {/* Experience Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <WarmCard hover={false} padding="xl">
            <Heading level={2} className="text-2xl md:text-3xl font-bold mb-8 text-[#FF6B35] flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#FF6B35] rounded-full" />
              EXPERIENCE
            </Heading>

            <div className="space-y-8">
              {/* CiviTech */}
              <div className="relative border-l-2 border-[#FF6B35]/40 pl-8">
                <div className="absolute left-0 -translate-x-1/2 top-0 w-4 h-4 rounded-full bg-[#FF6B35] shadow-lg border-2 border-white dark:border-[#2D1B12]" />

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <Heading level={3} className="font-bold text-[#2D1B12] dark:text-[#FFE4D6] text-xl md:text-2xl mb-1">CIVITECH</Heading>
                    <p className="text-[#6B4F3D] dark:text-[#D4A88E] text-sm">Austin, TX • January 2022–August 2025</p>
                  </div>
                </div>
                <p className="text-[#6B4F3D] dark:text-[#D4A88E] text-sm mb-6 italic leading-relaxed">Civitech is a SaaS tech company that builds software and tools for political candidates to improve voter engagement</p>

                <div className="space-y-6">
                  <WarmCard hover={true} padding="lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <Heading level={4} className="font-bold text-[#FF6B35] text-lg mb-1 sm:mb-0">Quality Assurance Engineer</Heading>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Feb 2025–Aug 2025</span>
                    </div>
                    <ul className="space-y-2.5 text-[#4A3426] dark:text-[#D4A88E] text-sm sm:text-base">
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Partnered with engineering and DevOps to create deployment rules, reducing critical production defects by <span className="text-[#FF6B35] font-semibold">90%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Increased NPS from <span className="text-[#FF6B35] font-semibold">23 to 36</span> by preventing customer-facing issues through improved release workflows</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Drove successful launch of RunningMate platform by translating cross-functional feedback into user stories aligned with business goals</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Synthesized prototype testing insights and stakeholder feedback into intuitive features, enhancing product usability</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Transformed technical challenges into cohesive customer journeys, driving <span className="text-[#FF6B35] font-semibold">30%</span> product adoption</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Pioneered AI-powered workflow automation with LLM-assisted QA processes, reducing bug triage time by <span className="text-[#FF6B35] font-semibold">40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Trained cross-functional teams on AI tools, improving collaboration across engineering, product, and client services</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Accelerated product delivery from monthly to biweekly releases through unified testing frameworks, reducing validation time by <span className="text-[#FF6B35] font-semibold">30%</span></span>
                      </li>
                    </ul>
                  </WarmCard>

                  <WarmCard hover={true} padding="lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <Heading level={4} className="font-bold text-[#FF6B35] text-lg mb-1 sm:mb-0">Quality Assurance Analyst</Heading>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Jan 2022–Jan 2025</span>
                    </div>
                    <ul className="space-y-2.5 text-[#4A3426] dark:text-[#D4A88E] text-sm sm:text-base">
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Owned end-to-end product vision and feature roadmap for TextOut platform through user research and requirements definition</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Prioritized features based on impact and technical feasibility, driving <span className="text-[#FF6B35] font-semibold">35%</span> increase in user engagement</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Championed product reliability initiatives achieving <span className="text-[#FF6B35] font-semibold">99.999%</span> uptime through 400+ manual and automated tests</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Improved release efficiency by <span className="text-[#FF6B35] font-semibold">30%</span> and enhanced user digital experience across two products</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Led cross-functional pricing strategy, aligning engineering, sales, and finance teams around product value</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Conducted market analysis and built financial models, generating <span className="text-[#FF6B35] font-semibold">$4M</span> in additional revenue</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#FF6B35] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Transformed client data accessibility to self-service model through GCP automation, reducing onboarding time by <span className="text-[#FF6B35] font-semibold">90%</span></span>
                      </li>
                    </ul>
                  </WarmCard>
                </div>
              </div>

              {/* Open Progress */}
              <div className="relative border-l-2 border-[#F7B32B]/40 pl-8">
                <div className="absolute left-0 -translate-x-1/2 top-0 w-4 h-4 rounded-full bg-[#F7B32B] shadow-lg border-2 border-white dark:border-[#2D1B12]" />

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                  <div>
                    <Heading level={3} className="font-bold text-[#2D1B12] dark:text-[#FFE4D6] text-xl md:text-2xl mb-1">OPEN PROGRESS</Heading>
                    <p className="text-[#6B4F3D] dark:text-[#D4A88E] text-sm">Los Angeles, CA • June 2019–December 2021</p>
                  </div>
                </div>
                <p className="text-[#6B4F3D] dark:text-[#D4A88E] text-sm mb-6 italic leading-relaxed">Consultancy that crafted conversational and grassroots digital engagement strategies (acquired by Civitech)</p>

                <div className="space-y-6">
                  <WarmCard hover={true} padding="lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <Heading level={4} className="font-bold text-[#FF6B35] text-lg mb-1 sm:mb-0">Client Services Manager</Heading>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Jan 2021–Dec 2021</span>
                    </div>
                    <ul className="space-y-2.5 text-[#4A3426] dark:text-[#D4A88E] text-sm sm:text-base">
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Orchestrated delivery of 80+ digital programs, achieving <span className="text-[#F7B32B] font-semibold">100%</span> on-time delivery across multiple channels</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Developed campaign messaging strategy through data analytics, resulting in <span className="text-[#F7B32B] font-semibold">25%</span> higher engagement</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Scaled platform to reach <span className="text-[#F7B32B] font-semibold">50+ million</span> voters while increasing response rates by <span className="text-[#F7B32B] font-semibold">20%</span></span>
                      </li>
                    </ul>
                  </WarmCard>

                  <WarmCard hover={true} padding="lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <Heading level={4} className="font-bold text-[#FF6B35] text-lg mb-1 sm:mb-0">Digital and Data Associate</Heading>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Sep 2019–Dec 2020</span>
                    </div>
                    <ul className="space-y-2.5 text-[#4A3426] dark:text-[#D4A88E] text-sm sm:text-base">
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Built automated ETL data pipelines with interactive dashboards (Sisense, Tableau), reducing decision-making time by <span className="text-[#F7B32B] font-semibold">40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Optimized targeting strategies across 20+ campaigns, improving conversion rate by <span className="text-[#F7B32B] font-semibold">25%</span> and user acquisition by <span className="text-[#F7B32B] font-semibold">20%</span></span>
                      </li>
                    </ul>
                  </WarmCard>

                  <WarmCard hover={true} padding="lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                      <Heading level={4} className="font-bold text-[#FF6B35] text-lg mb-1 sm:mb-0">Digital and Communications Intern</Heading>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E]">Jun 2019–Aug 2019</span>
                    </div>
                    <ul className="space-y-2.5 text-[#4A3426] dark:text-[#D4A88E] text-sm sm:text-base">
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-1 flex-shrink-0">▸</span>
                        <span className="leading-relaxed">Implemented personalized email campaigns and A/B testing, achieving <span className="text-[#F7B32B] font-semibold">5x</span> growth in user base and <span className="text-[#F7B32B] font-semibold">50%</span> conversion increase</span>
                      </li>
                    </ul>
                  </WarmCard>
                </div>
              </div>
            </div>
          </WarmCard>
        </motion.section>

        {/* Education Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <WarmCard hover={false} padding="xl">
            <Heading level={2} className="text-2xl md:text-3xl font-bold mb-8 text-[#FF6B35] flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#FF6B35] rounded-full" />
              EDUCATION
            </Heading>
            <div className="space-y-6">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-4 border-[#F7B32B] pl-6"
                >
                  <WarmCard hover={true} padding="lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                      <Heading level={3} className="font-bold text-[#2D1B12] dark:text-[#FFE4D6] text-lg sm:text-xl mb-1 sm:mb-0">University of California, Berkeley – Haas School of Business</Heading>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-1 sm:mt-0">May 2027</span>
                    </div>
                    <p className="text-[#FF6B35] font-semibold mb-4 text-sm sm:text-base">Master of Business Administration</p>
                    <ul className="space-y-2 text-[#4A3426] dark:text-[#D4A88E] text-sm">
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-0.5">▸</span>
                        <span>Consortium Fellow, Management Leadership for Tomorrow (MLT) Professional Development Fellow, MLT Ambassador</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-[#F7B32B] mr-3 mt-0.5">▸</span>
                        <span>Haas Tech Club (Marketing Manager), Product Management Club, Artificial Intelligence Club, Fintech Club</span>
                      </li>
                    </ul>
                  </WarmCard>
                </motion.div>
              )}
              <div className="border-l-4 border-[#9C7A5F] pl-6">
                <WarmCard hover={true} padding="lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <Heading level={3} className="font-bold text-[#2D1B12] dark:text-[#FFE4D6] text-lg sm:text-xl mb-1 sm:mb-0">Florida State University</Heading>
                    <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-1 sm:mt-0">December 2018</span>
                  </div>
                  <p className="text-[#6B4F3D] dark:text-[#D4A88E] text-sm">Bachelor of Arts, Political Science and International Affairs</p>
                </WarmCard>
              </div>
            </div>
          </WarmCard>
        </motion.section>

        {/* Skills Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <WarmCard hover={false} padding="xl">
            <Heading level={2} className="text-2xl md:text-3xl font-bold mb-8 text-[#FF6B35] flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#FF6B35] rounded-full" />
              SKILLS & EXPERTISE
            </Heading>

            <div className="space-y-6">
              {skillCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <WarmCard key={category.category} hover={true} padding="lg">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-[#FF6B35]/10 rounded-lg">
                        <IconComponent className="w-5 h-5 text-[#FF6B35]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#FF6B35] uppercase tracking-wider">{category.category}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill) => (
                        <span
                          key={skill.name}
                          className="px-4 py-2 bg-[#FFF8F0] dark:bg-[#4A3426]/30 border border-[#FFE4D6] dark:border-[#FF8E53]/30 rounded-lg text-sm text-[#4A3426] dark:text-[#D4A88E] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </WarmCard>
                );
              })}
            </div>
          </WarmCard>
        </motion.section>

        {/* Interests Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <WarmCard hover={false} padding="xl">
            <Heading level={2} className="text-2xl md:text-3xl font-bold mb-8 text-[#FF6B35] flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-[#FF6B35] to-[#F7B32B] rounded-full" />
              INTERESTS
            </Heading>

            <div className="flex flex-wrap justify-center gap-4">
              {["FC Barcelona", "Ferrari (F1)", "Big Foodie", "Film & TV Buff", "Travel & Cultural Immersion", "Digital Photography"].map((interest) => (
                <span
                  key={interest}
                  className="px-6 py-3 rounded-full bg-gradient-to-br from-[#FF8E53]/20 to-[#F7B32B]/10 border-2 border-[#FF8E53]/40 text-[#FF6B35] dark:text-[#FF8E53] text-sm sm:text-base font-semibold shadow-sm transition-all hover:scale-105 hover:border-[#FF6B35] hover:bg-[#FF6B35]/20 hover:shadow-lg cursor-default"
                >
                  {interest}
                </span>
              ))}
            </div>
          </WarmCard>
        </motion.section>
      </motion.div>
    </div>
  );
}
