"use client";

import { motion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import {
  IconTargetArrow,
  IconChartBar,
  IconUsers,
  IconBulb,
} from "@tabler/icons-react";

const skills = [
  {
    icon: IconTargetArrow,
    title: "Product Discovery",
    description:
      "User research, problem framing, hypothesis testing, and continuous validation to ensure we're building the right thing.",
  },
  {
    icon: IconChartBar,
    title: "Data-Driven Decisions",
    description:
      "SQL, analytics dashboards, A/B testing, and metrics frameworks that turn data into actionable product insights.",
  },
  {
    icon: IconUsers,
    title: "Cross-Functional Leadership",
    description:
      "Sprint planning, stakeholder alignment, and delivery execution with engineering, design, and business teams.",
  },
  {
    icon: IconBulb,
    title: "Quality & Reliability",
    description:
      "Automated testing frameworks, performance monitoring, and systems thinking to ship with confidence.",
  },
];

const industries = [
  "Consumer Tech",
  "SaaS",
  "Analytics",
  "Political Campaigns",
  "Data Intensive Applications",
];

const experience = [
  { name: "UC Berkeley", sub: "Haas MBA" },
  { name: "Florida State", sub: "B.A. Political Science and International Affairs" },
  { name: "Civic Tech", sub: "Product & QA" },
  { name: "Political Campaigns", sub: "Analytics" },
];

export function AboutSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      id="about"
      className="py-24 md:py-32 bg-[var(--surface-secondary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-16">
            <Heading level={2} className="mb-6">
              About Me
            </Heading>
            <div className="space-y-5 text-lg text-[var(--text-secondary)] max-w-3xl">
              <p>
                I'm a product manager who started as a QA engineer, giving me a
                unique perspective on how to build reliable, scalable products.
                Over 5 years, I've shipped features reaching{" "}
                <strong className="text-[var(--text-primary)]">
                  60M+ users
                </strong>
                , led automation initiatives that improved release velocity by{" "}
                <strong className="text-[var(--text-primary)]">45%</strong>, and
                built dashboards that transformed data into actionable insights.
              </p>
              <p>
                Now pursuing my MBA at{" "}
                <strong className="text-[var(--text-primary)]">
                  UC Berkeley Haas
                </strong>
                , I'm sharpening my strategic toolkit while applying it to real
                product challenges. I thrive at the intersection of user needs,
                technical feasibility, and business impact.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-[var(--text-primary)]">
              What I Do
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {skills.map((skill) => (
                <WarmCard key={skill.title} padding="lg" hover>
                  <skill.icon className="h-8 w-8 text-[var(--color-primary)] mb-4" />
                  <h4 className="font-bold text-lg mb-2 text-[var(--text-primary)]">
                    {skill.title}
                  </h4>
                  <p className="text-[var(--text-secondary)]">
                    {skill.description}
                  </p>
                </WarmCard>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
              Industries & Domains
            </h3>
            <div className="flex flex-wrap gap-3 mb-12">
              {industries.map((industry) => (
                <span
                  key={industry}
                  className="px-4 py-2 border border-[var(--border-primary)] bg-[var(--surface-elevated)] rounded-full text-sm font-medium text-[var(--text-secondary)]"
                >
                  {industry}
                </span>
              ))}
            </div>

            <h3 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
              Experience
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {experience.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-center p-6 border border-[var(--border-primary)] bg-[var(--surface-elevated)] rounded-xl"
                >
                  <div className="text-center">
                    <p className="font-bold text-sm text-[var(--text-primary)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
