"use client";

import { useState } from "react";
import { IconDownload, IconMail, IconBrandLinkedin } from "@tabler/icons-react";
import styles from "@/app/resume/resume.module.css";

interface SkillCategory {
  category: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    category: "Product Analytics",
    skills: ["Google Analytics", "Hotjar", "Looker Studio"],
  },
  {
    category: "Data & SQL",
    skills: ["SQL", "PostgreSQL", "MS SQL Server"],
  },
  {
    category: "Cloud Platforms",
    skills: ["Google Cloud Platform", "Microsoft Azure"],
  },
  {
    category: "AI & Automation",
    skills: [
      "ChatGPT Codex",
      "Claude Code",
      "Copilot",
      "Google Gemini",
      "Bolt",
      "Lovable",
      "n8n",
      "Zapier",
    ],
  },
  {
    category: "Product Development",
    skills: ["Agile", "Asana", "Figma", "Jira", "Linear", "Miro"],
  },
  {
    category: "Design & Prototyping",
    skills: ["Canva", "Lightroom", "Magic Patterns", "Photoshop"],
  },
  {
    category: "Productivity & Collaboration",
    skills: ["Cursor", "Excel", "Gamma", "Loom", "Notion", "PowerPoint"],
  },
];

interface JobEntry {
  role: string;
  company: string;
  when: string;
  description: string;
}

// Every bullet from the old list-heavy layout, condensed into one paragraph
// per role — same facts and metrics, written as prose rather than a bullet
// list (the site's writing voice avoids bullets outside catalog tables).
const experience: JobEntry[] = [
  {
    role: "Innovation Consultant Team Lead",
    company: "Haas@Work",
    when: "Jan 2026–Present",
    description:
      "Leads client engagement for a global mobility technology company, managing stakeholder communication, workflow execution, and alignment across a cross-functional consulting team.",
  },
  {
    role: "Quality Assurance Engineer",
    company: "Civitech",
    when: "Feb–Aug 2025",
    description:
      "Translated leadership and user feedback into product requirements for RunningMate, a campaign management platform, aligning engineering and product teams. Redesigned onboarding tutorials and first-time user flows after analyzing clickstream data, lifting activation 25%, and built AI-powered QA and workflow automation that cut bug triage time 40%. Standardized manual and automated testing across two core products, moving releases from monthly to biweekly and cutting release validation time 30%.",
  },
  {
    role: "Quality Assurance Analyst",
    company: "Civitech",
    when: "Jan 2022–Jan 2025",
    description:
      "Owned product vision for a peer-to-peer texting platform, prioritizing features from direct customer conversations and quantitative impact assessments that drove a 35% increase in engagement. Led a cross-functional pricing strategy across engineering, sales, and finance that generated $4M in additional revenue, and pushed release standards to 99.999% uptime, cutting critical defects 90% and improving release efficiency 50%.",
  },
  {
    role: "Client Services Manager",
    company: "Open Progress",
    when: "Jan–Dec 2021",
    description:
      "Led client digital and communication strategy, building messaging validation and audience sampling frameworks that lifted response rates 20% while scaling outreach to 50M+ voters. Analyzed voter behavior and campaign performance to brief clients on high-impact opportunities, and delivered 80+ client campaigns on time by aligning cross-functional teams around clear milestones.",
  },
  {
    role: "Digital and Data Associate",
    company: "Open Progress",
    when: "Sep 2019–Dec 2020",
    description:
      "Automated ETL and reporting pipelines, replacing manual spreadsheets with nightly data drops and interactive dashboards in Sisense and Tableau and cutting analysis time 40%. Used behavior analytics to sharpen segmentation and targeting across 20+ campaigns, improving conversion 25% and supporter efficiency 15%, and built multichannel creative and A/B tests that lifted response rates 30%.",
  },
  {
    role: "Digital and Communications Intern",
    company: "Open Progress",
    when: "Jun–Aug 2019",
    description:
      "Built a data-driven acquisition strategy with personalized email campaigns and A/B testing that grew the user base 5x and lifted conversion 50% across client platforms.",
  },
];

const INTERESTS = [
  "FC Barcelona",
  "Ferrari (F1)",
  "Big Foodie",
  "Film & TV Buff",
  "Travel & Cultural Immersion",
  "Digital Photography",
];

const mbaRevealDate = new Date(2025, 0, 1);

export default function Resume() {
  const showMBA = new Date() >= mbaRevealDate;
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = () => {
    if (downloading) return;
    setDownloading(true);
    const link = document.createElement("a");
    link.href = "/Isaac_Vazquez_Resume.pdf";
    link.download = "Isaac_Vazquez_Resume.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Re-enable after a short tick — the browser handles the download
    // asynchronously; keeping the button disabled briefly prevents the
    // double-click-queues-multiple-downloads pattern.
    setTimeout(() => setDownloading(false), 1200);
  };

  const education = [
    ...(showMBA
      ? [
          {
            role: "MBA Candidate",
            company: "UC Berkeley Haas",
            when: "2025–27",
            description:
              "Consortium Fellow · MLT Professional Development Fellow · MLT Ambassador. VP of Marketing (Haas Tech Club), VP of Admissions (Consortium), and active in the Product Management, AI, and Fintech clubs.",
          },
        ]
      : []),
    {
      role: "BA, Political Science & International Affairs",
      company: "Florida State University",
      when: "2018",
      description: "",
    },
  ];

  return (
    <div className={styles.page}>
      {/* Masthead */}
      <section className={styles.masthead}>
        <div className={styles.shell}>
          <div className={styles.mastheadRow}>
            <div>
              <p className={styles.kicker}>
                Isaac Vazquez · résumé · product manager &amp; builder
              </p>
              <h1 className={styles.title}>
                Product, <em>reliability</em>, and data.
              </h1>
            </div>
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

          <p className={styles.dek}>
            Six years across QA, analytics, and client strategy in civic tech.
            I&apos;m an MBA candidate at Berkeley Haas looking for product and
            growth roles where analytical rigor and delivery speed feed each
            other.
          </p>

          <div className={styles.metaRow}>
            <a className={styles.metaLink} href="mailto:IsaacVazquez@berkeley.edu">
              <IconMail className="w-4 h-4" />
              IsaacVazquez@berkeley.edu
            </a>
            <a
              className={styles.metaLink}
              href="https://www.linkedin.com/in/isaac-vazquez/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconBrandLinkedin className="w-4 h-4" />
              LinkedIn
            </a>
            {showMBA && (
              <span className="resume-chip">
                Berkeley Haas MBA &apos;27 · Consortium Fellow · MLT Fellow
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Two-column ledger */}
      <div className={styles.shell}>
        <div className={styles.resumeGrid}>
          <div>
            <div className={styles.rblock}>
              <p className={styles.rblockTitle}>Experience</p>
              {experience.map((job) => (
                <div className={styles.job} key={`${job.company}-${job.role}`}>
                  <div className={styles.jobHead}>
                    <h3 className={styles.jobRole}>{job.role}</h3>
                    <span className={styles.jobWhen}>{job.when}</span>
                  </div>
                  <p className={styles.jobCo}>{job.company}</p>
                  <p className={styles.jobDesc}>{job.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className={styles.rblock}>
              <p className={styles.rblockTitle}>Skills</p>
              {skillCategories.map((category) => (
                <div className={styles.skillGroup} key={category.category}>
                  <p className={styles.skillLbl}>{category.category}</p>
                  <div className={styles.chipRow}>
                    {category.skills.map((skill) => (
                      <span key={skill} className="resume-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.rblock}>
              <p className={styles.rblockTitle}>Education</p>
              {education.map((entry) => (
                <div className={styles.job} key={entry.role}>
                  <div className={styles.jobHead}>
                    <h3 className={styles.jobRole}>{entry.role}</h3>
                    <span className={styles.jobWhen}>{entry.when}</span>
                  </div>
                  <p className={styles.jobCo}>{entry.company}</p>
                  {entry.description ? (
                    <p className={styles.jobDesc}>{entry.description}</p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className={styles.rblock}>
              <p className={styles.rblockTitle}>Interests</p>
              <div className={styles.chipRow}>
                {INTERESTS.map((interest) => (
                  <span key={interest} className="resume-chip cursor-default">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
