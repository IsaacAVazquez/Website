"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin, IconPhone } from "@tabler/icons-react";

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
    category: "Cloud Platforms",
    skills: [
      { name: "Azure", level: 85 },
      { name: "GCP", level: 85 }
    ]
  },
  {
    category: "AI & Automation",
    skills: [
      { name: "ChatGPT Codex", level: 95 },
      { name: "Claude Code", level: 95 },
      { name: "Copilot", level: 90 },
      { name: "Bolt", level: 85 },
      { name: "Lovable", level: 85 },
      { name: "n8n", level: 80 },
      { name: "Zapier", level: 85 }
    ]
  },
  {
    category: "Product & Workflow",
    skills: [
      { name: "Agile", level: 90 },
      { name: "Jira", level: 90 },
      { name: "Asana", level: 85 },
      { name: "Miro", level: 80 },
      { name: "Figma", level: 85 },
      { name: "Canva", level: 85 }
    ]
  },
  {
    category: "Creative Tools",
    skills: [
      { name: "Photoshop", level: 75 },
      { name: "Lightroom", level: 75 }
    ]
  }
];

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
    <div className="min-h-screen bg-[var(--surface-primary)]">
      <div className="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <header className="mb-12 sm:mb-16">
            <h1 className="font-bold text-6xl sm:text-7xl lg:text-8xl mb-8 tracking-tighter text-[var(--text-primary)] leading-[0.9]">
              ISAAC<br />VAZQUEZ
            </h1>

            <div className="mb-6">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[var(--text-primary)] text-[var(--text-primary)] text-sm font-semibold tracking-wider uppercase transition-all hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
              >
                <IconDownload className="w-4 h-4" />
                Download PDF
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-6 text-[var(--text-secondary)] text-sm">
              <span className="flex items-center gap-2">
                <IconPhone className="w-4 h-4" />
                (850) 591-0159
              </span>
              <a
                href="mailto:isaacvazquez@berkeley.edu"
                className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors"
              >
                <IconMail className="w-4 h-4" />
                isaacvazquez@berkeley.edu
              </a>
              <a
                href="https://linkedin.com/in/isaac-vazquez"
                className="flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBrandLinkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </div>

            {showMBA && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="inline-block px-6 py-2 border-2 border-[var(--color-primary)] text-[var(--color-primary)] text-sm font-semibold tracking-wide">
                  Berkeley Haas MBA &apos;27 • Consortium Fellow • MLT Fellow
                </div>
              </motion.div>
            )}
          </header>

          <section className="mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-10 text-[var(--text-primary)] tracking-tight">
              Experience
            </h2>

            <div className="space-y-14">
              <div>
                <div className="mb-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                    <h3 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                      CIVITECH
                    </h3>
                    <div className="text-base text-[var(--text-secondary)] mt-2 sm:mt-0">
                      January 2022–August 2025
                    </div>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm italic max-w-3xl">
                    Austin, TX • Civitech is a SaaS tech company that builds software and tools for political candidates to improve voter engagement
                  </p>
                </div>

                <div className="space-y-8 ml-0 sm:ml-8">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold text-[var(--text-primary)]">
                        Quality Assurance Engineer
                      </h4>
                      <span className="text-sm text-[var(--text-secondary)] mt-1 sm:mt-0">
                        Feb 2025–Aug 2025
                      </span>
                    </div>
                    <ul className="space-y-3 text-[var(--text-secondary)] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Translated leadership and user feedback into product requirements for RunningMate, driving cross-functional alignment between engineering and product teams</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Conducted user interviews and analyzed user clickstream data to identify onboarding obstacles, implementing targeted improvements that increased activation rates by <span className="font-semibold text-[var(--text-primary)]">25%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Built and deployed AI-powered QA and product workflow automation using LLM-assisted processes, reducing bug triage time by <span className="font-semibold text-[var(--text-primary)]">40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Designed and implemented structured manual and automated QA testing frameworks, accelerating delivery from monthly to biweekly releases and reducing validation time by <span className="font-semibold text-[var(--text-primary)]">30%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Built a real-time event-generation system in Google Cloud, transitioning clients to a self-service model and reducing onboarding time by <span className="font-semibold text-[var(--text-primary)]">60%</span></span>
                      </li>
                    </ul>
                  </div>

                  <div className="h-px bg-[var(--text-primary)]/5" />

                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold text-[var(--text-primary)]">
                        Quality Assurance Analyst
                      </h4>
                      <span className="text-sm text-[var(--text-secondary)] mt-1 sm:mt-0">
                        Jan 2022–Jan 2025
                      </span>
                    </div>
                    <ul className="space-y-3 text-[var(--text-secondary)] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Owned product vision for peer-to-peer texting platform, prioritizing features based on quantitative impact assessments that drove a <span className="font-semibold text-[var(--text-primary)]">35%</span> increase in engagement</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Generated <span className="font-semibold text-[var(--text-primary)]">$4M</span> in additional revenue by leading a cross-functional pricing strategy initiative through market analysis, competitor research, and financial modeling</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Championed product reliability and release standards, achieving <span className="font-semibold text-[var(--text-primary)]">99.999%</span> uptime, reducing critical defects by <span className="font-semibold text-[var(--text-primary)]">90%</span>, and improving release efficiency by <span className="font-semibold text-[var(--text-primary)]">50%</span></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                    <h3 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                      OPEN PROGRESS
                    </h3>
                    <div className="text-base text-[var(--text-secondary)] mt-2 sm:mt-0">
                      June 2019–December 2021
                    </div>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm italic max-w-3xl">
                    Los Angeles, CA • Consultancy that built digital engagement solutions through innovative peer-to-peer outreach (acquired by Civitech)
                  </p>
                </div>

                <div className="space-y-8 ml-0 sm:ml-8">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold text-[var(--text-primary)]">
                        Client Services Manager
                      </h4>
                      <span className="text-sm text-[var(--text-secondary)] mt-1 sm:mt-0">
                        Jan 2021–Dec 2021
                      </span>
                    </div>
                    <ul className="space-y-3 text-[var(--text-secondary)] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Led client digital and communication strategy by developing data-driven messaging validation frameworks, boosting response rates <span className="font-semibold text-[var(--text-primary)]">20%</span> while scaling outreach to <span className="font-semibold text-[var(--text-primary)]">50M+</span> voters</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Analyzed voter behavior and campaign performance to surface high-impact opportunities, presenting findings to senior leadership that shaped strategic program priorities</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Orchestrated successful delivery of <span className="font-semibold text-[var(--text-primary)]">80+</span> client campaigns, achieving <span className="font-semibold text-[var(--text-primary)]">100%</span> on-time delivery while maintaining consistency across multiple channels</span>
                      </li>
                    </ul>
                  </div>

                  <div className="h-px bg-[var(--text-primary)]/5" />

                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold text-[var(--text-primary)]">
                        Digital and Data Associate
                      </h4>
                      <span className="text-sm text-[var(--text-secondary)] mt-1 sm:mt-0">
                        Sep 2019–Dec 2020
                      </span>
                    </div>
                    <ul className="space-y-3 text-[var(--text-secondary)] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Automated ETL processes and reporting pipelines, replacing manual spreadsheet workflows with nightly data drops and interactive dashboards (Sisense, Tableau), reducing analysis time by <span className="font-semibold text-[var(--text-primary)]">40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Leveraged user behavior analytics to optimize segmentation across 20+ campaigns, improving conversion rates by <span className="font-semibold text-[var(--text-primary)]">25%</span> and supporter conversion efficiency by <span className="font-semibold text-[var(--text-primary)]">15%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Created compelling visual content for multichannel campaigns (email, SMS, events), driving engagement improvements that increased response rates by <span className="font-semibold text-[var(--text-primary)]">30%</span></span>
                      </li>
                    </ul>
                  </div>

                  <div className="h-px bg-[var(--text-primary)]/5" />

                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold text-[var(--text-primary)]">
                        Digital and Communications Intern
                      </h4>
                      <span className="text-sm text-[var(--text-secondary)] mt-1 sm:mt-0">
                        Jun 2019–Aug 2019
                      </span>
                    </div>
                    <ul className="space-y-3 text-[var(--text-secondary)] text-base leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Developed data-driven user acquisition strategy by implementing personalized email campaigns and A/B testing frameworks, resulting in <span className="font-semibold text-[var(--text-primary)]">5x</span> growth in user base and <span className="font-semibold text-[var(--text-primary)]">50%</span> increase in conversion rates across client platforms</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-[var(--text-primary)]/10 mb-14" />

          <section className="mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-10 text-[var(--text-primary)] tracking-tight">
              Education
            </h2>

            <div className="space-y-8 ml-0 sm:ml-8">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                      <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                        University of California, Berkeley
                      </h3>
                      <div className="text-base text-[var(--text-secondary)] mt-2 sm:mt-0">
                        May 2027
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-[var(--color-primary)] mb-4">
                      Master of Business Administration
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      Haas School of Business
                    </p>
                    <ul className="space-y-2 text-[var(--text-secondary)] text-sm leading-relaxed">
                      <li className="flex items-start">
                        <span className="mr-3 mt-1 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>Consortium Fellow, Management Leadership for Tomorrow (MLT) Professional Development Fellow, MLT Ambassador</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-3 mt-1 text-[var(--color-primary)] flex-shrink-0">—</span>
                        <span>VP of Marketing, Haas Tech Club; VP of Admissions, Consortium; Product Management Club, AI Club, Fintech Club</span>
                      </li>
                    </ul>
                  </div>

                  <div className="h-px bg-[var(--text-primary)]/5 mb-6" />
                </motion.div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    Florida State University
                  </h3>
                  <div className="text-base text-[var(--text-secondary)] mt-2 sm:mt-0">
                    December 2018
                  </div>
                </div>
                <p className="text-base text-[var(--text-secondary)]">
                  Bachelor of Arts, Political Science and International Affairs
                </p>
              </div>
            </div>
          </section>

          <div className="h-px bg-[var(--text-primary)]/10 mb-14" />

          <section className="mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-10 text-[var(--text-primary)] tracking-tight">
              Skills &amp; Expertise
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ml-0 sm:ml-8">
              {skillCategories.map((category) => (
                <div key={category.category}>
                  <h3 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-4">
                    {category.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill) => (
                      <span
                        key={skill.name}
                        className="px-4 py-2 border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px bg-[var(--text-primary)]/10 mb-14" />

          <section>
            <h2 className="text-4xl sm:text-5xl font-bold mb-10 text-[var(--text-primary)] tracking-tight">
              Interests
            </h2>

            <div className="flex flex-wrap gap-3 ml-0 sm:ml-8">
              {["FC Barcelona", "Ferrari (F1)", "Big Foodie", "Film & TV Buff", "Travel & Cultural Immersion", "Digital Photography"].map((interest) => (
                <span
                  key={interest}
                  className="px-5 py-2.5 border-2 border-[var(--border-primary)] text-[var(--text-secondary)] text-sm font-medium hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all cursor-default"
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
