"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin } from "@tabler/icons-react";

const skillCategories = [
  {
    category: "Product & Analytics",
    skills: [
      { name: "Product Analytics", level: 90 },
      { name: "Google Analytics", level: 85 },
      { name: "Hotjar", level: 80 },
      { name: "Looker Studio", level: 85 }
    ]
  },
  {
    category: "Data & Development",
    skills: [
      { name: "SQL", level: 90 },
      { name: "PostgreSQL", level: 85 },
      { name: "MS SQL Server", level: 80 }
    ]
  },
  {
    category: "Cloud & AI",
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
    <div className="min-h-screen bg-white dark:bg-[#1C1410]">
      {/* Editorial Container - Centered, generous margins */}
      <div className="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 py-20 sm:py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header - Bold Editorial Style */}
          <header className="mb-20 sm:mb-24 lg:mb-28">
            {/* Name - Oversized, Bold */}
            <h1 className="font-bold text-6xl sm:text-7xl lg:text-8xl mb-8 tracking-tighter text-[#2D1B12] dark:text-[#FFFCF7] leading-[0.9]">
              ISAAC<br />VAZQUEZ
            </h1>

            {/* Download Button - Minimal, Top Right or Below Name */}
            <div className="mb-10">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#2D1B12] dark:border-[#FFFCF7] text-[#2D1B12] dark:text-[#FFFCF7] text-sm font-semibold tracking-wider uppercase transition-all hover:bg-[#2D1B12] hover:text-white dark:hover:bg-[#FFFCF7] dark:hover:text-[#2D1B12]"
              >
                <IconDownload className="w-4 h-4" />
                Download PDF
              </button>
            </div>

            {/* Contact Info - Clean, Minimal */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-10 text-[#4A3426] dark:text-[#D4A88E] text-sm">
              <a
                href="mailto:isaacvazquez@berkeley.edu"
                className="flex items-center gap-2 hover:text-[#FF6B35] transition-colors"
              >
                <IconMail className="w-4 h-4" />
                isaacvazquez@berkeley.edu
              </a>
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

            {/* MBA Badge - Clean, Editorial */}
            {showMBA && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <div className="inline-block px-6 py-2 border-2 border-[#FF6B35] text-[#FF6B35] dark:text-[#FF8E53] dark:border-[#FF8E53] text-sm font-semibold tracking-wide">
                  Berkeley Haas MBA '27 • Consortium Fellow • MLT Fellow
                </div>
              </motion.div>
            )}

            {/* Summary - Editorial Typography */}
            <p className="text-lg sm:text-xl leading-relaxed max-w-4xl text-[#2D1B12] dark:text-[#D4A88E] font-light">
              Technical product manager and UC Berkeley Haas MBA candidate with a proven track record: generated <span className="font-semibold text-[#FF6B35]">$4M+ in revenue</span>, served <span className="font-semibold text-[#FF6B35]">60M+ users</span>, and increased <span className="font-semibold text-[#FF6B35]">NPS from 23 to 36</span>. I pair a QA and data analytics foundation with product strategy, experimentation, and cross-functional leadership to deliver measurable business impact.
            </p>
          </header>

          {/* Thin Separator Line */}
          <div className="h-px bg-[#2D1B12]/10 dark:bg-[#FFFCF7]/10 mb-20" />

          {/* Experience Section */}
          <section className="mb-24">
            {/* Section Header - Bold, Editorial */}
            <h2 className="text-4xl sm:text-5xl font-bold mb-16 text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
              Experience
            </h2>

            <div className="space-y-20">
              {/* CiviTech */}
              <div>
                {/* Company Header */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                    <h3 className="text-3xl sm:text-4xl font-bold text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
                      CIVITECH
                    </h3>
                    <div className="text-base text-[#6B4F3D] dark:text-[#D4A88E] mt-2 sm:mt-0">
                      January 2022–August 2025
                    </div>
                  </div>
                  <p className="text-[#6B4F3D] dark:text-[#D4A88E] text-sm italic max-w-3xl">
                    Austin, TX • Civitech is a SaaS tech company that builds software and tools for political candidates to improve voter engagement
                  </p>
                </div>

                {/* Roles */}
                <div className="space-y-12 ml-0 sm:ml-8">
                  {/* Role 1 */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-5">
                      <h4 className="text-xl font-bold text-[#2D1B12] dark:text-[#FFFCF7]">
                        Quality Assurance Engineer
                      </h4>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-1 sm:mt-0">
                        Feb 2025–Aug 2025
                      </span>
                    </div>
                    <ul className="space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Partnered with engineering and DevOps to create deployment rules, reducing critical production defects by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">90%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Increased NPS from <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">23 to 36</span> by preventing customer-facing issues through improved release workflows</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Drove successful launch of RunningMate platform by translating cross-functional feedback into user stories aligned with business goals</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Synthesized prototype testing insights and stakeholder feedback into intuitive features, enhancing product usability</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Transformed technical challenges into cohesive customer journeys, driving <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">30%</span> product adoption</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Pioneered AI-powered workflow automation with LLM-assisted QA processes, reducing bug triage time by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Trained cross-functional teams on AI tools, improving collaboration across engineering, product, and client services</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Accelerated product delivery from monthly to biweekly releases through unified testing frameworks, reducing validation time by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">30%</span></span>
                      </li>
                    </ul>
                  </div>

                  {/* Subtle Divider Between Roles */}
                  <div className="h-px bg-[#2D1B12]/5 dark:bg-[#FFFCF7]/5" />

                  {/* Role 2 */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-5">
                      <h4 className="text-xl font-bold text-[#2D1B12] dark:text-[#FFFCF7]">
                        Quality Assurance Analyst
                      </h4>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-1 sm:mt-0">
                        Jan 2022–Jan 2025
                      </span>
                    </div>
                    <ul className="space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Owned end-to-end product vision and feature roadmap for TextOut platform through user research and requirements definition</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Prioritized features based on impact and technical feasibility, driving <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">35%</span> increase in user engagement</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Championed product reliability initiatives achieving <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">99.999%</span> uptime through 400+ manual and automated tests</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Improved release efficiency by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">30%</span> and enhanced user digital experience across two products</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Led cross-functional pricing strategy, aligning engineering, sales, and finance teams around product value</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Conducted market analysis and built financial models, generating <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">$4M</span> in additional revenue</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Transformed client data accessibility to self-service model through GCP automation, reducing onboarding time by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">90%</span></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Open Progress */}
              <div>
                {/* Company Header */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                    <h3 className="text-3xl sm:text-4xl font-bold text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
                      OPEN PROGRESS
                    </h3>
                    <div className="text-base text-[#6B4F3D] dark:text-[#D4A88E] mt-2 sm:mt-0">
                      June 2019–December 2021
                    </div>
                  </div>
                  <p className="text-[#6B4F3D] dark:text-[#D4A88E] text-sm italic max-w-3xl">
                    Los Angeles, CA • Consultancy that crafted conversational and grassroots digital engagement strategies (acquired by Civitech)
                  </p>
                </div>

                {/* Roles */}
                <div className="space-y-12 ml-0 sm:ml-8">
                  {/* Role 1 */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-5">
                      <h4 className="text-xl font-bold text-[#2D1B12] dark:text-[#FFFCF7]">
                        Client Services Manager
                      </h4>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-1 sm:mt-0">
                        Jan 2021–Dec 2021
                      </span>
                    </div>
                    <ul className="space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Orchestrated delivery of 80+ digital programs, achieving <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">100%</span> on-time delivery across multiple channels</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Developed campaign messaging strategy through data analytics, resulting in <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">25%</span> higher engagement</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Scaled platform to reach <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">50+ million</span> voters while increasing response rates by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">20%</span></span>
                      </li>
                    </ul>
                  </div>

                  {/* Subtle Divider Between Roles */}
                  <div className="h-px bg-[#2D1B12]/5 dark:bg-[#FFFCF7]/5" />

                  {/* Role 2 */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-5">
                      <h4 className="text-xl font-bold text-[#2D1B12] dark:text-[#FFFCF7]">
                        Digital and Data Associate
                      </h4>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-1 sm:mt-0">
                        Sep 2019–Dec 2020
                      </span>
                    </div>
                    <ul className="space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Built automated ETL data pipelines with interactive dashboards (Sisense, Tableau), reducing decision-making time by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Optimized targeting strategies across 20+ campaigns, improving conversion rate by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">25%</span> and user acquisition by <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">20%</span></span>
                      </li>
                    </ul>
                  </div>

                  {/* Subtle Divider Between Roles */}
                  <div className="h-px bg-[#2D1B12]/5 dark:bg-[#FFFCF7]/5" />

                  {/* Role 3 */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-5">
                      <h4 className="text-xl font-bold text-[#2D1B12] dark:text-[#FFFCF7]">
                        Digital and Communications Intern
                      </h4>
                      <span className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mt-1 sm:mt-0">
                        Jun 2019–Aug 2019
                      </span>
                    </div>
                    <ul className="space-y-3 text-[#4A3426] dark:text-[#D4A88E] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Implemented personalized email campaigns and A/B testing, achieving <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">5x</span> growth in user base and <span className="font-semibold text-[#2D1B12] dark:text-[#FFFCF7]">50%</span> conversion increase</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Thin Separator Line */}
          <div className="h-px bg-[#2D1B12]/10 dark:bg-[#FFFCF7]/10 mb-20" />

          {/* Education Section */}
          <section className="mb-24">
            {/* Section Header - Bold, Editorial */}
            <h2 className="text-4xl sm:text-5xl font-bold mb-16 text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
              Education
            </h2>

            <div className="space-y-12 ml-0 sm:ml-8">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="mb-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                      <h3 className="text-2xl sm:text-3xl font-bold text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
                        University of California, Berkeley
                      </h3>
                      <div className="text-base text-[#6B4F3D] dark:text-[#D4A88E] mt-2 sm:mt-0">
                        May 2027
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-[#FF6B35] mb-4">
                      Master of Business Administration
                    </p>
                    <p className="text-sm text-[#6B4F3D] dark:text-[#D4A88E] mb-3">
                      Haas School of Business
                    </p>
                    <ul className="space-y-2 text-[#4A3426] dark:text-[#D4A88E] text-sm leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-3 mt-1 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Consortium Fellow, Management Leadership for Tomorrow (MLT) Professional Development Fellow, MLT Ambassador</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-3 mt-1 text-[#FF6B35] flex-shrink-0">—</span>
                        <span>Haas Tech Club (Marketing Manager), Product Management Club, Artificial Intelligence Club, Fintech Club</span>
                      </li>
                    </ul>
                  </div>

                  {/* Subtle Divider */}
                  <div className="h-px bg-[#2D1B12]/5 dark:bg-[#FFFCF7]/5 mb-10" />
                </motion.div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
                    Florida State University
                  </h3>
                  <div className="text-base text-[#6B4F3D] dark:text-[#D4A88E] mt-2 sm:mt-0">
                    December 2018
                  </div>
                </div>
                <p className="text-base text-[#6B4F3D] dark:text-[#D4A88E]">
                  Bachelor of Arts, Political Science and International Affairs
                </p>
              </div>
            </div>
          </section>

          {/* Thin Separator Line */}
          <div className="h-px bg-[#2D1B12]/10 dark:bg-[#FFFCF7]/10 mb-20" />

          {/* Skills Section */}
          <section className="mb-24">
            {/* Section Header - Bold, Editorial */}
            <h2 className="text-4xl sm:text-5xl font-bold mb-16 text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
              Skills & Expertise
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 ml-0 sm:ml-8">
              {skillCategories.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-bold text-[#FF6B35] uppercase tracking-wider mb-4">
                    {category.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill) => (
                      <span
                        key={skill.name}
                        className="px-4 py-2 border border-[#2D1B12]/10 dark:border-[#FFFCF7]/10 text-sm text-[#4A3426] dark:text-[#D4A88E] hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Thin Separator Line */}
          <div className="h-px bg-[#2D1B12]/10 dark:bg-[#FFFCF7]/10 mb-20" />

          {/* Interests Section */}
          <section>
            {/* Section Header - Bold, Editorial */}
            <h2 className="text-4xl sm:text-5xl font-bold mb-16 text-[#2D1B12] dark:text-[#FFFCF7] tracking-tight">
              Interests
            </h2>

            <div className="flex flex-wrap gap-4 ml-0 sm:ml-8">
              {["FC Barcelona", "Ferrari (F1)", "Big Foodie", "Film & TV Buff", "Travel & Cultural Immersion", "Digital Photography"].map((interest) => (
                <span
                  key={interest}
                  className="px-5 py-2.5 border-2 border-[#2D1B12]/10 dark:border-[#FFFCF7]/10 text-[#4A3426] dark:text-[#D4A88E] text-sm font-medium hover:border-[#FF6B35] hover:text-[#FF6B35] transition-all cursor-default"
                >
                  {interest}
                </span>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
