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
      className="py-20 md:py-28"
      style={{ backgroundColor: "var(--surface-secondary)" }}
    >
      <div className="container-wide max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="mb-12">
            <Heading level={2} className="mb-6">
              About Me
            </Heading>
            <div className="space-y-6 text-lg max-w-3xl" style={{ color: "var(--text-secondary)" }}>
              <p>
                I'm a product manager who started as a QA engineer, giving me a unique perspective
                on how to build reliable, scalable products. Over 5 years, I've shipped features
                reaching <strong style={{ color: "var(--text-primary)" }}>60M+ users</strong>,
                led automation initiatives that improved release velocity by <strong style={{ color: "var(--text-primary)" }}>45%</strong>,
                and built dashboards that transformed data into actionable insights.
              </p>
              <p>
                Now pursuing my MBA at <strong style={{ color: "var(--text-primary)" }}>UC Berkeley Haas</strong>,
                I'm sharpening my strategic toolkit while applying it to real product challenges. I thrive
                at the intersection of user needs, technical feasibility, and business impact.
              </p>
            </div>
          </motion.div>

          {/* What I Do - Grid */}
          <motion.div variants={itemVariants} className="mb-12">
            <h3
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              What I Do
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <WarmCard padding="lg">
                <IconTargetArrow className="h-8 w-8 mb-4" style={{ color: "var(--color-primary)" }} />
                <h4
                  className="font-bold text-lg mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Product Discovery
                </h4>
                <p style={{ color: "var(--text-secondary)" }}>
                  User research, problem framing, hypothesis testing, and continuous validation
                  to ensure we're building the right thing.
                </p>
              </WarmCard>

              <WarmCard padding="lg">
                <IconChartBar className="h-8 w-8 mb-4" style={{ color: "var(--color-primary)" }} />
                <h4
                  className="font-bold text-lg mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Data-Driven Decisions
                </h4>
                <p style={{ color: "var(--text-secondary)" }}>
                  SQL, analytics dashboards, A/B testing, and metrics frameworks that turn
                  data into actionable product insights.
                </p>
              </WarmCard>

              <WarmCard padding="lg">
                <IconUsers className="h-8 w-8 mb-4" style={{ color: "var(--color-primary)" }} />
                <h4
                  className="font-bold text-lg mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Cross-Functional Leadership
                </h4>
                <p style={{ color: "var(--text-secondary)" }}>
                  Sprint planning, stakeholder alignment, and delivery execution with
                  engineering, design, and business teams.
                </p>
              </WarmCard>

              <WarmCard padding="lg">
                <IconBulb className="h-8 w-8 mb-4" style={{ color: "var(--color-primary)" }} />
                <h4
                  className="font-bold text-lg mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Quality & Reliability
                </h4>
                <p style={{ color: "var(--text-secondary)" }}>
                  Automated testing frameworks, performance monitoring, and systems thinking
                  to ship with confidence.
                </p>
              </WarmCard>
            </div>
          </motion.div>

          {/* Industries & Experience */}
          <motion.div variants={itemVariants}>
            <h3
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Industries & Domains
            </h3>
            <div className="flex flex-wrap gap-3 mb-10">
              {["Civic Tech", "SaaS", "Analytics", "Political Campaigns", "EdTech"].map((industry) => (
                <span
                  key={industry}
                  className="px-4 py-2 border rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: "var(--surface-elevated)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {industry}
                </span>
              ))}
            </div>

            <h3
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Experience
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { name: "UC Berkeley", sub: "Haas MBA" },
                { name: "Florida State", sub: "B.A. Poli Sci" },
                { name: "Civic Tech", sub: "Product & QA" },
                { name: "Political Campaigns", sub: "Analytics" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-center p-6 border rounded-lg"
                  style={{
                    backgroundColor: "var(--surface-elevated)",
                    borderColor: "var(--border-primary)",
                  }}
                >
                  <div className="text-center">
                    <p
                      className="font-bold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
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
