"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/Heading";
import { Paragraph } from "@/components/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin } from "@tabler/icons-react";
import Link from "next/link";

const skills = [
  "A/B Testing", "Agile/Scrum", "Charting & Data Visualization", "Cypress", "Data Analysis",
  "Figma", "JavaScript", "Jira", "JMeter", "Postman", "Product Analytics",
  "Product Roadmapping", "SQL", "Stakeholder Management", "Tableau", "User Research"
];

// Set your reveal date (YYYY, MM-1, DD)
const mbaRevealDate = new Date(2025, 7, 1); // August 1, 2025

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
    <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900/50 via-slate-800/30 to-slate-700/20">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
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
        className="relative max-w-4xl mx-auto"
      >
        {/* Header Section */}
        <GlassCard
          elevation={4}
          interactive={false}
          className="p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-electric-blue/10 to-matrix-green/10" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-6">
                <motion.span 
                  className="text-6xl drop-shadow-lg select-none"
                  animate={{ rotate: [-7, 8, -7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚡
                </motion.span>
                <div>
                  <Heading className="font-extrabold text-4xl mb-2 tracking-tight gradient-text font-heading">
                    ISAAC VAZQUEZ
                  </Heading>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300">
                    <a
                      href="mailto:isaacavazquez95@gmail.com"
                      className="flex items-center gap-2 hover:text-electric-blue transition font-terminal text-sm"
                    >
                      <IconMail className="w-4 h-4" />
                      isaacavazquez95@gmail.com
                    </a>
                    <span className="hidden sm:inline text-matrix-green/50">•</span>
                    <a
                      href="https://linkedin.com/in/isaac-vazquez"
                      className="flex items-center gap-2 hover:text-electric-blue transition font-terminal text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconBrandLinkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDownloadPDF}
                className="morph-button flex items-center gap-2 text-sm"
              >
                <IconDownload className="w-4 h-4" />
                <span>DOWNLOAD PDF</span>
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              {showMBA && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-semibold text-electric-blue text-lg"
                >
                  MBA Candidate at University of California, Berkeley, Haas School of Business
                </motion.p>
              )}
              <p className="text-base leading-relaxed">
                QA Engineer with a record of advancing product quality, release velocity, and cross-functional team collaboration in high-growth tech and civic engagement organizations.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Education Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard elevation={3} className="p-6">
            <Heading as="h2" className="text-2xl font-bold mb-4 text-electric-blue font-heading flex items-center gap-2">
              <div className="w-1 h-6 bg-electric-blue" />
              EDUCATION
            </Heading>
            <div className="space-y-4">
              {showMBA && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-2 border-matrix-green/30 pl-4"
                >
                  <h3 className="font-bold text-matrix-green text-lg">University of California, Berkeley – Haas School of Business</h3>
                  <p className="text-slate-400">Master of Business Administration, Consortium Fellow</p>
                  <p className="text-sm text-slate-500 font-terminal">Expected: May 2027</p>
                </motion.div>
              )}
              <div className="border-l-2 border-matrix-green/30 pl-4">
                <h3 className="font-bold text-matrix-green text-lg">Florida State University</h3>
                <p className="text-slate-400">B.A., Political Science and International Affairs, magna cum laude</p>
                <p className="text-sm text-slate-500 font-terminal">December 2018</p>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Experience Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <GlassCard elevation={3} className="p-6">
            <Heading as="h2" className="text-2xl font-bold mb-4 text-electric-blue font-heading flex items-center gap-2">
              <div className="w-1 h-6 bg-electric-blue" />
              EXPERIENCE
            </Heading>
            
            <div className="space-y-6">
              {/* CiviTech */}
              <div className="border-l-2 border-electric-blue/30 pl-4">
                <h3 className="font-bold text-matrix-green text-xl mb-3">CIVITECH, AUSTIN, TX</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-electric-blue text-lg">Quality Assurance Engineer</h4>
                      <span className="text-sm text-slate-500 font-terminal">Feb 2025–Present</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Orchestrated release-governance framework integrating QA, DevOps, and Security workflows—cutting critical production defects by 50% quarter over quarter.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Designed unified automation framework, enabling same-day validation of releases and faster stakeholder sign-off.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Represented QA in sprint reviews and backlog refinement, driving quality criteria and on-time launches.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-electric-blue text-lg">Quality Assurance Analyst</h4>
                      <span className="text-sm text-slate-500 font-terminal">Jan 2022–Jan 2025</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Directed scalable QA strategies for multiple products, increasing release efficiency by 30% and achieving near 100% uptime.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Executed 400+ manual and automated tests with JMeter, Postman, and Cypress.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Used data insights to boost user engagement for outreach to 60M+ voters.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Open Progress */}
              <div className="border-l-2 border-electric-blue/30 pl-4">
                <h3 className="font-bold text-matrix-green text-xl mb-3">Open Progress, Los Angeles, CA</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-electric-blue text-lg">Client Services Manager</h4>
                      <span className="text-sm text-slate-500 font-terminal">Jan 2021–Dec 2021</span>
                    </div>
                    <p className="text-slate-300">
                      Led digital voter engagement campaigns for 80+ programs, achieving 100% on-time delivery and driving 40M+ voter conversations.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-electric-blue text-lg">Digital & Data Associate</h4>
                      <span className="text-sm text-slate-500 font-terminal">Sep 2019–Dec 2020</span>
                    </div>
                    <p className="text-slate-300">
                      Developed campaign dashboards and analytics for 20+ clients, improving decision speed by 40% and optimizing engagement strategy.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-electric-blue text-lg">Digital & Communications Intern</h4>
                      <span className="text-sm text-slate-500 font-terminal">Jun 2019–Aug 2019</span>
                    </div>
                    <p className="text-slate-300">
                      Enhanced email targeting and performance monitoring, boosting client fundraising list growth by 500%.
                    </p>
                  </div>
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
          <GlassCard elevation={3} className="p-6">
            <Heading as="h2" className="text-2xl font-bold mb-4 text-electric-blue font-heading flex items-center gap-2">
              <div className="w-1 h-6 bg-electric-blue" />
              SKILLS & EXPERTISE
            </Heading>
            
            {showMBA && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 text-slate-400 font-terminal text-sm"
              >
                Coming soon: MBA-related achievements and fellowships.
              </motion.p>
            )}
            
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-3 py-1 rounded-full bg-terminal-bg/70 border border-matrix-green/30 text-matrix-green text-xs font-semibold shadow transition hover:scale-105 hover:border-matrix-green hover:bg-matrix-green/10 font-terminal"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </GlassCard>
        </motion.section>
      </motion.div>
    </div>
  );
}