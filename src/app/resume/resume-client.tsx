"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/ui/Heading";
import { Paragraph } from "@/components/ui/Paragraph";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin, IconPhone } from "@tabler/icons-react";
import Link from "next/link";

const skills = [
  "Product Strategy", "A/B Testing", "Agile/Scrum", "Data Analysis", "User Research",
  "Product Roadmapping", "Cross-functional Leadership", "Figma", "Product Analytics",
  "Stakeholder Management", "SQL", "Tableau", "Jira", "User Experience Design", "Go-to-Market Strategy", "Competitive Analysis"
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
                  <Heading level={1} className="font-extrabold text-4xl mb-2 tracking-tight gradient-text font-heading">
                    ISAAC VAZQUEZ
                  </Heading>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-300">
                    <a
                      href="tel:(850)591-0159"
                      className="flex items-center gap-2 hover:text-electric-blue transition font-terminal text-sm"
                    >
                      <IconPhone className="w-4 h-4" />
                      (850) 591-0159
                    </a>
                    <span className="hidden sm:inline text-matrix-green/50">•</span>
                    <a
                      href="mailto:isaacvazquez@mba.berkeley.edu"
                      className="flex items-center gap-2 hover:text-electric-blue transition font-terminal text-sm"
                    >
                      <IconMail className="w-4 h-4" />
                      isaacvazquez@mba.berkeley.edu
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
              <div className="text-matrix-green font-terminal text-sm uppercase tracking-wider">
                TECH-BACKED PROBLEM SOLVER // SYSTEMS THINKER // FUTURE BUILDER
              </div>
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
                I design and scale systems that work — whether it's powering tools for 60M+ voters or leading cross-functional releases across engineering, product, and security. Currently expanding my toolkit at Berkeley Haas, I'm focused on solving complex, high-impact problems at the intersection of technology, strategy, and people.
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
            <Heading level={2} className="text-2xl font-bold mb-4 text-electric-blue font-heading flex items-center gap-2">
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
                  <Heading level={3} className="font-bold text-matrix-green text-lg">University of California, Berkeley – Haas School of Business</Heading>
                  <p className="text-slate-400">Master of Business Administration, Consortium Fellow</p>
                  <p className="text-sm text-slate-500 font-terminal">Expected: May 2027</p>
                </motion.div>
              )}
              <div className="border-l-2 border-matrix-green/30 pl-4">
                <Heading level={3} className="font-bold text-matrix-green text-lg">Florida State University</Heading>
                <p className="text-slate-400">Bachelor of Arts, Political Science and International Affairs, magna cum laude</p>
                <p className="text-sm text-slate-500 font-terminal">Phi Beta Kappa, President's List, Dean's List</p>
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
            <Heading level={2} className="text-2xl font-bold mb-4 text-electric-blue font-heading flex items-center gap-2">
              <div className="w-1 h-6 bg-electric-blue" />
              EXPERIENCE
            </Heading>
            
            <div className="space-y-6">
              {/* CiviTech */}
              <div className="border-l-2 border-electric-blue/30 pl-4">
                <Heading level={3} className="font-bold text-matrix-green text-xl mb-3">CIVITECH, Austin, TX</Heading>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Heading level={4} className="font-semibold text-electric-blue text-lg">Quality Assurance Engineer</Heading>
                      <span className="text-sm text-slate-500 font-terminal">Feb 2025–Present</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Orchestrate organization-wide release-governance framework integrating QA, DevOps, and Security workflows, reducing critical production defects by 50% quarter over quarter</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Design a unified automation framework across applications, cutting end-to-end regression time by two days, enabling same-day validation of critical releases and strengthening stakeholder confidence in deployments</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Represent team in bi-weekly sprint reviews and backlog refinements with leadership, translating feedback into actionable user stories, and securing quality acceptance criteria up-front, resulting in release of RunningMate</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Heading level={4} className="font-semibold text-electric-blue text-lg">Quality Assurance Analyst</Heading>
                      <span className="text-sm text-slate-500 font-terminal">Jan 2022–Jan 2025</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Directed scalable QA strategies and executed QA processes across multiple development phases and products, collaborating with cross-functional teams, resulting in a 30% increase in release efficiency and near 100% uptime</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Increased application performance and user satisfaction by executing 400+ manual and automated tests using JMeter, Postman, and Cypress</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Served as a primary driver for identifying product opportunities by analyzing user behavior and feedback, shaping vision and feature set of TextOut, leading to a 20% increase in user engagement and outreach to 60M+ unique voters in 2024</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Open Progress */}
              <div className="border-l-2 border-electric-blue/30 pl-4">
                <Heading level={3} className="font-bold text-matrix-green text-xl mb-3">OPEN PROGRESS, Los Angeles, CA</Heading>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Heading level={4} className="font-semibold text-electric-blue text-lg">Client Services Manager</Heading>
                      <span className="text-sm text-slate-500 font-terminal">January 2021–December 2021</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Led multi-channel voter engagement campaigns, facilitating milestone alignment and maintaining 100% on-time delivery of campaign messaging across 80+ digital programs</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Leveraged data analytics to refine campaign strategies and messaging, surfacing key voter issues, leading to a 25% increase in voter engagement and campaign participation across key initiatives</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Spearheaded strategic alignment of client programs with broader organizational goals, driving over 40 million actionable voter conversations</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Heading level={4} className="font-semibold text-electric-blue text-lg">Digital and Data Associate</Heading>
                      <span className="text-sm text-slate-500 font-terminal">September 2019–December 2020</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Improved campaign decision-making speed by 40% and enhanced strategy formulation by designing and maintaining intuitive data dashboards, enabling real-time insights</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Conducted in-depth analysis of campaign metrics across 20+ client programs, uncovering trends in time-of-day engagement and audience segmentation, shaping targeting decisions and enhanced voter contact efficiency</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Heading level={4} className="font-semibold text-electric-blue text-lg">Digital and Communications Intern</Heading>
                      <span className="text-sm text-slate-500 font-terminal">June 2019–August 2019</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      <li className="flex items-start">
                        <span className="text-matrix-green mr-2">▸</span>
                        <span>Optimized email targeting, segmentation, and performance monitoring, contributing to improved fundraising outcomes for clients, growing client email fundraising lists by over 500%</span>
                      </li>
                    </ul>
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
            <Heading level={2} className="text-2xl font-bold mb-4 text-electric-blue font-heading flex items-center gap-2">
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

        {/* Additional Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8"
        >
          <GlassCard elevation={3} className="p-6">
            <Heading as="h2" className="text-2xl font-bold mb-4 text-electric-blue font-heading flex items-center gap-2">
              <div className="w-1 h-6 bg-electric-blue" />
              ADDITIONAL
            </Heading>
            
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start">
                <span className="text-matrix-green mr-2">▸</span>
                <span>Management Leadership for Tomorrow (MLT), MBA Professional Development Fellow (2025 - Present)</span>
              </div>
              <div className="flex items-start">
                <span className="text-matrix-green mr-2">▸</span>
                <span>Consortium for Graduate Study in Management, Fellow (2025 - Present)</span>
              </div>
              <div className="flex items-start">
                <span className="text-matrix-green mr-2">▸</span>
                <span>Management Leadership for Tomorrow (MLT), MBA Prep Fellow & Ambassador (2024 - 2025)</span>
              </div>
              <div className="flex items-start">
                <span className="text-matrix-green mr-2">▸</span>
                <span>Tallahassee Southern Model United Nations, Head of Home Government (2016), GA Director (2017), CND Director (2019)</span>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      </motion.div>
    </div>
  );
}