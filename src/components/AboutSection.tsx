"use client";

import { motion } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import {
  IconTargetArrow,
  IconChartBar,
  IconUsers,
  IconBulb
} from "@tabler/icons-react";

export function AboutSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
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
      className="py-24 md:py-32 bg-neutral-50 dark:bg-neutral-900"
    >
      <div className="container-wide max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="mb-16">
            <Heading level={2} className="mb-6">
              About Me
            </Heading>
            <div className="space-y-6 text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl">
              <p>
                I'm a product manager who started as a QA engineer, giving me a unique perspective
                on how to build reliable, scalable products. Over 5 years, I've shipped features
                reaching <strong className="text-neutral-900 dark:text-neutral-100">60M+ users</strong>,
                led automation initiatives that improved release velocity by <strong className="text-neutral-900 dark:text-neutral-100">45%</strong>,
                and built dashboards that transformed data into actionable insights.
              </p>
              <p>
                Now pursuing my MBA at <strong className="text-neutral-900 dark:text-neutral-100">UC Berkeley Haas</strong>,
                I'm sharpening my strategic toolkit while applying it to real product challenges. I thrive
                at the intersection of user needs, technical feasibility, and business impact.
              </p>
            </div>
          </motion.div>

          {/* What I Do - Grid */}
          <motion.div variants={itemVariants} className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-neutral-900 dark:text-neutral-100">
              What I Do
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <WarmCard padding="lg" className="border border-neutral-200 dark:border-neutral-700">
                <IconTargetArrow className="h-8 w-8 text-[#FF6B35] mb-4" />
                <h4 className="font-bold text-lg mb-2 text-neutral-900 dark:text-neutral-100">
                  Product Discovery
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  User research, problem framing, hypothesis testing, and continuous validation
                  to ensure we're building the right thing.
                </p>
              </WarmCard>

              <WarmCard padding="lg" className="border border-neutral-200 dark:border-neutral-700">
                <IconChartBar className="h-8 w-8 text-[#FF6B35] mb-4" />
                <h4 className="font-bold text-lg mb-2 text-neutral-900 dark:text-neutral-100">
                  Data-Driven Decisions
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  SQL, analytics dashboards, A/B testing, and metrics frameworks that turn
                  data into actionable product insights.
                </p>
              </WarmCard>

              <WarmCard padding="lg" className="border border-neutral-200 dark:border-neutral-700">
                <IconUsers className="h-8 w-8 text-[#FF6B35] mb-4" />
                <h4 className="font-bold text-lg mb-2 text-neutral-900 dark:text-neutral-100">
                  Cross-Functional Leadership
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Sprint planning, stakeholder alignment, and delivery execution with
                  engineering, design, and business teams.
                </p>
              </WarmCard>

              <WarmCard padding="lg" className="border border-neutral-200 dark:border-neutral-700">
                <IconBulb className="h-8 w-8 text-[#FF6B35] mb-4" />
                <h4 className="font-bold text-lg mb-2 text-neutral-900 dark:text-neutral-100">
                  Quality & Reliability
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Automated testing frameworks, performance monitoring, and systems thinking
                  to ship with confidence.
                </p>
              </WarmCard>
            </div>
          </motion.div>

          {/* Industries & Experience */}
          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
              Industries & Domains
            </h3>
            <div className="flex flex-wrap gap-3 mb-12">
              {["Civic Tech", "SaaS", "Analytics", "Political Campaigns", "EdTech"].map((industry) => (
                <span
                  key={industry}
                  className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {industry}
                </span>
              ))}
            </div>

            {/* Company Logos / Experience */}
            <h3 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-100">
              Experience
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* UC Berkeley Haas */}
              <div className="flex items-center justify-center p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="text-center">
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">UC Berkeley</p>
                  <p className="text-xs text-neutral-500">Haas MBA</p>
                </div>
              </div>

              {/* Florida State University */}
              <div className="flex items-center justify-center p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="text-center">
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Florida State</p>
                  <p className="text-xs text-neutral-500">B.S. Biology</p>
                </div>
              </div>

              {/* Previous Companies - Placeholder */}
              <div className="flex items-center justify-center p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="text-center">
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Civic Tech</p>
                  <p className="text-xs text-neutral-500">Product & QA</p>
                </div>
              </div>

              <div className="flex items-center justify-center p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="text-center">
                  <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">Political Campaigns</p>
                  <p className="text-xs text-neutral-500">Analytics</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
