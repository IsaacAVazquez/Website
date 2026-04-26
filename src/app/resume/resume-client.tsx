"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconDownload, IconMail, IconBrandLinkedin } from "@tabler/icons-react";

const skillCategories = [
  {
    category: "Product Analytics",
    skills: [
      { name: "Google Analytics", level: 85 },
      { name: "Hotjar", level: 80 },
      { name: "Looker Studio", level: 85 }
    ]
  },
  {
    category: "Data & SQL",
    skills: [
      { name: "SQL", level: 90 },
      { name: "PostgreSQL", level: 85 },
      { name: "MS SQL Server", level: 80 }
    ]
  },
  {
    category: "Cloud Platforms",
    skills: [
      { name: "Google Cloud Platform", level: 85 },
      { name: "Microsoft Azure", level: 85 }
    ]
  },
  {
    category: "AI & Automation",
    skills: [
      { name: "ChatGPT Codex", level: 95 },
      { name: "Claude Code", level: 95 },
      { name: "Copilot", level: 90 },
      { name: "Google Gemini", level: 90 },
      { name: "Bolt", level: 85 },
      { name: "Lovable", level: 85 },
      { name: "n8n", level: 80 },
      { name: "Zapier", level: 85 }
    ]
  },
  {
    category: "Product Development",
    skills: [
      { name: "Agile", level: 90 },
      { name: "Asana", level: 85 },
      { name: "Figma", level: 85 },
      { name: "Jira", level: 90 },
      { name: "Linear", level: 80 },
      { name: "Miro", level: 80 }
    ]
  },
  {
    category: "Design & Prototyping",
    skills: [
      { name: "Canva", level: 85 },
      { name: "Lightroom", level: 75 },
      { name: "Magic Patterns", level: 80 },
      { name: "Photoshop", level: 75 }
    ]
  },
  {
    category: "Productivity & Collaboration",
    skills: [
      { name: "Cursor", level: 90 },
      { name: "Excel", level: 85 },
      { name: "Gamma", level: 80 },
      { name: "Loom", level: 85 },
      { name: "Notion", level: 85 },
      { name: "PowerPoint", level: 85 }
    ]
  }
];

const mbaRevealDate = new Date(2025, 0, 1);

export default function Resume() {
  const showMBA = new Date() >= mbaRevealDate;
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = () => {
    if (downloading) return;
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/Isaac_Vazquez_Resume.pdf';
    link.download = 'Isaac_Vazquez_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Re-enable after a short tick — the browser handles the download
    // asynchronously; keeping the button disabled briefly prevents the
    // double-click-queues-multiple-downloads pattern.
    setTimeout(() => setDownloading(false), 1200);
  };

  return (
    <div className="home-page min-h-screen">
      <div className="home-shell home-section">
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header panel */}
          <header className="resume-panel">
            <h1 className="home-wordmark mb-6">
              ISAAC VAZQUEZ
            </h1>

            <div className="mb-5">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                aria-busy={downloading}
                className="resume-outline-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                <IconDownload className="w-4 h-4" />
                {downloading ? "Downloading…" : "Download PDF"}
              </button>
            </div>

            <div
              className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-5 text-sm"
              style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
            >
      
              <a
                href="mailto:IsaacVazquez@berkeley.edu"
                className="flex items-center gap-2 transition-colors"
                style={{ color: "var(--home-ink-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--home-ink)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--home-ink-muted)")}
              >
                <IconMail className="w-4 h-4" />
                IsaacVazquez@berkeley.edu
              </a>
              <a
                href="https://linkedin.com/in/isaac-vazquez"
                className="flex items-center gap-2 transition-colors"
                style={{ color: "var(--home-ink-muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--home-ink)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--home-ink-muted)")}
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
                className="mb-5"
              >
                <span className="home-pill">
                  Berkeley Haas MBA &apos;27 · Consortium Fellow · MLT Fellow
                </span>
              </motion.div>
            )}

            <p className="home-body mb-0 max-w-none">
              Six years across QA, analytics, and client strategy in civic tech. I&apos;m an MBA candidate at Berkeley Haas looking for product and growth roles where analytical rigor and delivery speed feed each other.
            </p>
          </header>

          {/* Experience */}
          <section className="resume-panel">
            <h2 className="resume-section-title">
              Experience
            </h2>

            <div className="space-y-14">
              {/* Haas@Work */}
              <div>
                <div className="mb-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                    <h3
                      className="text-3xl sm:text-4xl font-bold tracking-tighter"
                      style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                    >
                      HAAS@WORK
                    </h3>
                    <div
                      className="text-base mt-2 sm:mt-0"
                      style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                    >
                      January 2026–Present
                    </div>
                  </div>
                  <p
                    className="text-sm italic max-w-3xl"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Berkeley, CA · UC Berkeley&apos;s innovation consulting agency
                  </p>
                </div>

                <div className="space-y-8 ml-0">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4
                        className="text-xl font-bold"
                        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                      >
                        Innovation Consultant Team Lead
                      </h4>
                      <span
                        className="text-sm mt-1 sm:mt-0"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        Jan 2026–Present
                      </span>
                    </div>
                    <ul className="space-y-3 text-base leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Lead client engagement for a global mobility technology company, managing stakeholder communication, internal workflow execution, and alignment across a cross-functional consulting team</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Civitech */}
              <div>
                <div className="mb-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                    <h3
                      className="text-3xl sm:text-4xl font-bold tracking-tighter"
                      style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                    >
                      CIVITECH
                    </h3>
                    <div
                      className="text-base mt-2 sm:mt-0"
                      style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}
                    >
                      January 2022–August 2025
                    </div>
                  </div>
                  <p
                    className="text-sm italic max-w-3xl"
                    style={{ color: "var(--home-ink-muted)" }}
                  >
                    Austin, TX · Civitech is a SaaS tech company that builds software and tools for political candidates to improve voter engagement
                  </p>
                </div>

                <div className="space-y-8 ml-0">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4
                        className="text-xl font-bold"
                        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                      >
                        Quality Assurance Engineer
                      </h4>
                      <span
                        className="text-sm mt-1 sm:mt-0"
                        style={{ color: "var(--home-ink-muted)" }}
                      >
                        Feb 2025–Aug 2025
                      </span>
                    </div>
                    <ul className="space-y-3 text-base leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span style={{ color: "var(--home-ink-muted)" }}>Translated leadership and user feedback into product requirements for RunningMate, a platform that helps political campaigns manage voter engagement, data analytics, and campaign strategy, aligning engineering and product teams</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Conducted user interviews and analyzed user clickstream data to identify onboarding obstacles and technical challenges, leading to a redesign of product tutorials and first-time user flows that increased activation rates by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>25%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Built and deployed AI-powered QA and product workflow automation to solve operational challenges, increasing transparency between engineering, product, and client services teams while reducing bug triage time by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Designed and implemented structured manual and automated QA testing and planning processes across two core products, accelerating delivery cycles from monthly to biweekly releases and reducing release validation time by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>30%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Built a real-time event-generation system in Google Cloud, improving client onboarding and delivering instant access to campaign performance metrics, transitioning clients to a self-service model and reducing onboarding time by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>60%</span></span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4
                        className="text-xl font-bold"
                        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                      >
                        Quality Assurance Analyst
                      </h4>
                      <span className="text-sm mt-1 sm:mt-0" style={{ color: "var(--home-ink-muted)" }}>
                        Jan 2022–Jan 2025
                      </span>
                    </div>
                    <ul className="space-y-3 text-base leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Owned product vision for peer-to-peer texting platform by connecting directly with customers to understand pain points and prioritizing features based on quantitative impact assessments that drove a <span className="font-semibold" style={{ color: "var(--home-ink)" }}>35%</span> increase in engagement</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Generated <span className="font-semibold" style={{ color: "var(--home-ink)" }}>$4M</span> in additional revenue by leading a cross-functional pricing strategy initiative, aligning engineering, sales, and finance teams around product value through market analysis, competitor research, and financial modeling</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Championed product reliability and release standards, achieving <span className="font-semibold" style={{ color: "var(--home-ink)" }}>99.999%</span> uptime, reducing critical defects by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>90%</span>, and improving release efficiency by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>50%</span> through new deployment rules and strategic test planning and implementation</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Open Progress */}
              <div>
                <div className="mb-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                    <h3
                      className="text-3xl sm:text-4xl font-bold tracking-tighter"
                      style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                    >
                      OPEN PROGRESS
                    </h3>
                    <div className="text-base mt-2 sm:mt-0" style={{ color: "var(--home-ink-muted)", fontFamily: "var(--font-home-sans)" }}>
                      June 2019–December 2021
                    </div>
                  </div>
                  <p className="text-sm italic max-w-3xl" style={{ color: "var(--home-ink-muted)" }}>
                    Los Angeles, CA · Consultancy that built digital engagement solutions through innovative peer-to-peer outreach (acquired by Civitech)
                  </p>
                </div>

                <div className="space-y-8 ml-0">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold" style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}>
                        Client Services Manager
                      </h4>
                      <span className="text-sm mt-1 sm:mt-0" style={{ color: "var(--home-ink-muted)" }}>
                        Jan 2021–Dec 2021
                      </span>
                    </div>
                    <ul className="space-y-3 text-base leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Led client digital and communication strategy by developing data-driven messaging validation and audience sampling frameworks, aligning content with client goals and boosting response rates <span className="font-semibold" style={{ color: "var(--home-ink)" }}>20%</span> while scaling outreach to <span className="font-semibold" style={{ color: "var(--home-ink)" }}>50M+</span> voters</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Analyzed voter behavior and campaign performance to surface high-impact opportunities, presenting findings in client meetings and delivering concise summaries that informed targeting choices and shaped strategic program priorities</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Orchestrated successful delivery of <span className="font-semibold" style={{ color: "var(--home-ink)" }}>80+</span> client campaigns by establishing clear milestones and aligning cross-functional teams, achieving <span className="font-semibold" style={{ color: "var(--home-ink)" }}>100%</span> on-time delivery while maintaining consistency and performance across multiple channels</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold" style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}>
                        Digital and Data Associate
                      </h4>
                      <span className="text-sm mt-1 sm:mt-0" style={{ color: "var(--home-ink-muted)" }}>
                        Sep 2019–Dec 2020
                      </span>
                    </div>
                    <ul className="space-y-3 text-base leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Automated ETL processes and reporting pipelines, replacing manual spreadsheet workflows with nightly data drops and interactive dashboards (Sisense, Tableau), reducing analysis time by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>40%</span></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Leveraged user behavior analytics to optimize segmentation and targeting features across 20+ campaigns, improving conversion rates by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>25%</span> and supporter conversion efficiency by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>15%</span> through data-driven program enhancements</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Created compelling visual content for multichannel campaigns including email, SMS, and events, applying design principles and A/B testing to enhance visual appeal and messaging clarity, increasing response rates by <span className="font-semibold" style={{ color: "var(--home-ink)" }}>30%</span></span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-4">
                      <h4 className="text-xl font-bold" style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}>
                        Digital and Communications Intern
                      </h4>
                      <span className="text-sm mt-1 sm:mt-0" style={{ color: "var(--home-ink-muted)" }}>
                        Jun 2019–Aug 2019
                      </span>
                    </div>
                    <ul className="space-y-3 text-base leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                      <li className="flex items-start">
                        <span className="mr-4 mt-1.5 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Developed data-driven user acquisition strategy by implementing personalized email campaigns and A/B testing frameworks, resulting in <span className="font-semibold" style={{ color: "var(--home-ink)" }}>5x</span> growth in user base and <span className="font-semibold" style={{ color: "var(--home-ink)" }}>50%</span> increase in conversion rates across client platforms</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="resume-panel">
            <h2 className="resume-section-title">
              Education
            </h2>

            <div className="space-y-8 ml-0">
              {showMBA && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                      <h3
                        className="text-2xl sm:text-3xl font-bold tracking-tight"
                        style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                      >
                        University of California, Berkeley
                      </h3>
                      <div className="text-base mt-2 sm:mt-0" style={{ color: "var(--home-ink-muted)" }}>
                        May 2027
                      </div>
                    </div>
                    <p className="text-lg font-semibold mb-4" style={{ color: "var(--home-haze)" }}>
                      Master of Business Administration
                    </p>
                    <p className="text-sm mb-3" style={{ color: "var(--home-ink-muted)" }}>
                      Haas School of Business
                    </p>
                    <ul className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--home-ink-muted)" }}>
                      <li className="flex items-start">
                        <span className="mr-3 mt-1 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>Consortium Fellow; Management Leadership for Tomorrow (MLT) Professional Development Fellow; MLT Ambassador</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-3 mt-1 flex-shrink-0" style={{ color: "var(--home-ink)" }}>—</span>
                        <span>VP of Marketing, Haas Tech Club; VP of Admissions, Consortium; Product Management Club, AI Club, Fintech Club</span>
                      </li>
                    </ul>
                  </div>

                </motion.div>
              )}

              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-3">
                  <h3
                    className="text-2xl sm:text-3xl font-bold tracking-tight"
                    style={{ color: "var(--home-ink)", fontFamily: "var(--font-home-sans)" }}
                  >
                    Florida State University
                  </h3>
                  <div className="text-base mt-2 sm:mt-0" style={{ color: "var(--home-ink-muted)" }}>
                    December 2018
                  </div>
                </div>
                <p className="text-base" style={{ color: "var(--home-ink-muted)" }}>
                  Bachelor of Arts, Political Science and International Affairs
                </p>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section className="resume-panel">
            <h2 className="resume-section-title">
              Skills &amp; Expertise
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ml-0">
              {skillCategories.map((category) => (
                <div key={category.category}>
                  <p className="home-kicker mb-4">{category.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.skills.map((skill) => (
                      <span key={skill.name} className="resume-chip">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interests */}
          <section className="resume-panel">
            <h2 className="resume-section-title">
              Interests
            </h2>

            <div className="flex flex-wrap gap-3 ml-0">
              {["FC Barcelona", "Ferrari (F1)", "Big Foodie", "Film & TV Buff", "Travel & Cultural Immersion", "Digital Photography"].map((interest) => (
                <span key={interest} className="resume-chip cursor-default">
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
