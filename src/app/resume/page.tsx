"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/Container";
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
    <Container className="max-w-2xl mx-auto px-6 py-12 bg-white/80 dark:bg-neutral-900/80 rounded-2xl shadow-2xl backdrop-blur-md transition-colors">
      <div className="relative flex items-center mb-10">
        <span className="text-6xl mr-6 animate-wiggle drop-shadow-lg select-none">💼</span>
        <div>
          <Heading className="font-extrabold text-3xl mb-1 tracking-tight bg-gradient-to-r from-blue-600 via-teal-400 to-purple-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-indigo-200 dark:to-purple-400">
            Isaac Vazquez
          </Heading>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-700 dark:text-gray-200 text-sm">
            <a
              href="mailto:isaacvazquez@mba.berkeley.edu"
              className="underline hover:text-blue-500 dark:hover:text-teal-300 transition"
            >
              isaacvazquez@mba.berkeley.edu
            </a>
            <span className="hidden sm:inline">&bull;</span>
            <a
              href="https://linkedin.com/in/isaac-vazquez"
              className="underline hover:text-blue-500 dark:hover:text-teal-300 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <Paragraph className="mb-10 text-gray-800 dark:text-teal-100 text-lg">
        {showMBA ? (
          <span className="block font-semibold text-gray-900 dark:text-white text-xl">
            MBA Candidate at University of California, Berkeley, Haas School of Business
          </span>
        ) : null}
        <span className="block">
          QA Engineer with a record of advancing product quality, release velocity, and cross-functional team collaboration in high-growth tech and civic engagement organizations.
        </span>
      </Paragraph>

      <section className="mb-10">
        <Heading as="h2" className="text-xl font-semibold mb-3 text-blue-900 dark:text-teal-200">
          Education
        </Heading>
        <div className="space-y-2">
          {showMBA ? (
            <Paragraph className="mb-0">
              <span className="font-bold text-gray-900 dark:text-white">University of California, Berkeley – Haas School of Business</span>
              <br />
              <span className="text-gray-700 dark:text-gray-300">Master of Business Administration, Consortium Fellow (May 2027)</span>
            </Paragraph>
          ) : null}
          <Paragraph className="mb-0">
            <span className="font-bold text-gray-900 dark:text-white">Florida State University</span>
            <br />
            <span className="text-gray-700 dark:text-gray-300">B.A., Political Science and International Affairs, magna cum laude (Dec 2018)</span>
          </Paragraph>
        </div>
      </section>

      <section className="mb-10">
        <Heading as="h2" className="text-xl font-semibold mb-3 text-blue-900 dark:text-teal-200">
          Experience
        </Heading>
        <div className="space-y-6">
          <div>
            <Heading as="h3" className="font-bold text-gray-800 dark:text-white">
              Civitech, Austin, TX
            </Heading>
            <Paragraph className="mb-1">
              <span className="font-semibold text-gray-900 dark:text-teal-100">Quality Assurance Engineer</span>
              <span className="text-gray-500 dark:text-gray-400"> (Feb 2025–Present)</span>
              <br />
              Orchestrated release-governance framework integrating QA, DevOps, and Security workflows—cutting critical production defects by 50% quarter over quarter. Designed unified automation framework, enabling same-day validation of releases and faster stakeholder sign-off. Represented QA in sprint reviews and backlog refinement, driving quality criteria and on-time launches.
            </Paragraph>
            <Paragraph>
              <span className="font-semibold text-gray-900 dark:text-teal-100">Quality Assurance Analyst</span>
              <span className="text-gray-500 dark:text-gray-400"> (Jan 2022–Jan 2025)</span>
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
              <span className="text-gray-500 dark:text-gray-400"> (Jan 2021–Dec 2021)</span>
              <br />
              Led digital voter engagement campaigns for 80+ programs, achieving 100% on-time delivery and driving 40M+ voter conversations.
            </Paragraph>
            <Paragraph className="mb-1">
              <span className="font-semibold text-gray-900 dark:text-teal-100">Digital & Data Associate</span>
              <span className="text-gray-500 dark:text-gray-400"> (Sep 2019–Dec 2020)</span>
              <br />
              Developed campaign dashboards and analytics for 20+ clients, improving decision speed by 40% and optimizing engagement strategy.
            </Paragraph>
            <Paragraph>
              <span className="font-semibold text-gray-900 dark:text-teal-100">Digital & Communications Intern</span>
              <span className="text-gray-500 dark:text-gray-400"> (Jun 2019–Aug 2019)</span>
              <br />
              Enhanced email targeting and performance monitoring, boosting client fundraising list growth by 500%.
            </Paragraph>
          </div>
        </div>
      </section>

      <section>
        <Heading as="h2" className="text-xl font-semibold mb-3 text-blue-900 dark:text-teal-200">
          Additional
        </Heading>
        {showMBA && (
          <Paragraph className="mb-2 text-gray-700 dark:text-gray-300">
            Coming soon: MBA-related achievements and fellowships.
          </Paragraph>
        )}
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 mb-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 text-xs font-semibold shadow transition hover:scale-105 hover:bg-blue-200 dark:hover:bg-teal-800"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>
      <div className="mt-12 text-center text-xs text-gray-500 dark:text-gray-600">
        2025 — Built by Isaac Vazquez
      </div>
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
    </Container>
  );
}
