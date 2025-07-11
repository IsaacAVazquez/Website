"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/Heading";
import { Paragraph } from "@/components/Paragraph";

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

  return (
    <div className="min-h-screen w-full py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto p-8 bg-terminal-bg/50 rounded-2xl shadow-2xl backdrop-blur-md border border-electric-blue/20">
        <div className="relative flex items-center mb-10">
          <span className="text-6xl mr-6 animate-wiggle drop-shadow-lg select-none">⚡</span>
          <div>
            <Heading className="font-extrabold text-3xl mb-1 tracking-tight gradient-text font-heading">
              ISAAC VAZQUEZ
            </Heading>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-terminal text-sm">
            <a
              href="mailto:isaacavazquez95@gmail.com"
              className="underline hover:text-electric-blue transition"
            >
              isaacavazquez95@gmail.com
            </a>
            <span className="hidden sm:inline text-matrix-green">&bull;</span>
            <a
              href="https://linkedin.com/in/isaac-vazquez"
              className="underline hover:text-electric-blue transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <Paragraph className="mb-10 text-slate-300 font-terminal text-lg">
        {showMBA ? (
          <span className="block font-semibold text-electric-blue text-xl">
            MBA Candidate at University of California, Berkeley, Haas School of Business
          </span>
        ) : null}
        <span className="block">
          QA Engineer with a record of advancing product quality, release velocity, and cross-functional team collaboration in high-growth tech and civic engagement organizations.
        </span>
      </Paragraph>

      <section className="mb-10">
        <Heading as="h2" className="text-xl font-semibold mb-3 text-electric-blue font-heading">
          EDUCATION
        </Heading>
        <div className="space-y-2">
          {showMBA ? (
            <Paragraph className="mb-0 font-terminal">
              <span className="font-bold text-matrix-green">University of California, Berkeley – Haas School of Business</span>
              <br />
              <span className="text-slate-400">Master of Business Administration, Consortium Fellow (May 2027)</span>
            </Paragraph>
          ) : null}
          <Paragraph className="mb-0 font-terminal">
            <span className="font-bold text-matrix-green">Florida State University</span>
            <br />
            <span className="text-slate-400">B.A., Political Science and International Affairs, magna cum laude (Dec 2018)</span>
          </Paragraph>
        </div>
      </section>

      <section className="mb-10">
        <Heading as="h2" className="text-xl font-semibold mb-3 text-electric-blue font-heading">
          EXPERIENCE
        </Heading>
        <div className="space-y-6">
          <div>
            <Heading as="h3" className="font-bold text-matrix-green font-heading">
              CIVITECH, AUSTIN, TX
            </Heading>
            <Paragraph className="mb-1 font-terminal">
              <span className="font-semibold text-electric-blue">Quality Assurance Engineer</span>
              <span className="text-slate-600"> (Feb 2025–Present)</span>
              <br />
              Orchestrated release-governance framework integrating QA, DevOps, and Security workflows—cutting critical production defects by 50% quarter over quarter. Designed unified automation framework, enabling same-day validation of releases and faster stakeholder sign-off. Represented QA in sprint reviews and backlog refinement, driving quality criteria and on-time launches.
            </Paragraph>
            <Paragraph>
              <span className="font-semibold text-gray-900 dark:text-teal-100">Quality Assurance Analyst</span>
              <span className="text-gray-600 dark:text-gray-400"> (Jan 2022–Jan 2025)</span>
              <br />
              Directed scalable QA strategies for multiple products, increasing release efficiency by 30% and achieving near 100% uptime. Executed 400+ manual and automated tests with JMeter, Postman, and Cypress, and used data insights to boost user engagement for outreach to 60M+ voters.
            </Paragraph>
          </div>
          <div>
            <Heading as="h3" className="font-bold text-gray-800 dark:text-white">
              Open Progress, Los Angeles, CA
            </Heading>
            <Paragraph className="mb-1">
              <span className="font-semibold text-gray-900 dark:text-teal-100">Client Services Manager</span>
              <span className="text-gray-600 dark:text-gray-400"> (Jan 2021–Dec 2021)</span>
              <br />
              Led digital voter engagement campaigns for 80+ programs, achieving 100% on-time delivery and driving 40M+ voter conversations.
            </Paragraph>
            <Paragraph className="mb-1">
              <span className="font-semibold text-gray-900 dark:text-teal-100">Digital & Data Associate</span>
              <span className="text-gray-600 dark:text-gray-400"> (Sep 2019–Dec 2020)</span>
              <br />
              Developed campaign dashboards and analytics for 20+ clients, improving decision speed by 40% and optimizing engagement strategy.
            </Paragraph>
            <Paragraph>
              <span className="font-semibold text-gray-900 dark:text-teal-100">Digital & Communications Intern</span>
              <span className="text-gray-600 dark:text-gray-400"> (Jun 2019–Aug 2019)</span>
              <br />
              Enhanced email targeting and performance monitoring, boosting client fundraising list growth by 500%.
            </Paragraph>
          </div>
        </div>
      </section>

      <section>
        <Heading as="h2" className="text-xl font-semibold mb-3 text-electric-blue font-heading">
          SKILLS
        </Heading>
        {showMBA && (
          <Paragraph className="mb-2 text-slate-400 font-terminal">
            Coming soon: MBA-related achievements and fellowships.
          </Paragraph>
        )}
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 mb-1 rounded-full bg-terminal-bg/70 border border-matrix-green/30 text-matrix-green text-xs font-semibold shadow transition hover:scale-105 hover:border-matrix-green hover:bg-matrix-green/10 font-terminal"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-7deg) scale(1);}
          25% { transform: rotate(6deg) scale(1.08);}
          50% { transform: rotate(-4deg) scale(1);}
          75% { transform: rotate(8deg) scale(1.06);}
        }
        .animate-wiggle {
          animation: wiggle 2s infinite;
        }
      `}</style>
      </div>
    </div>
  );
}
