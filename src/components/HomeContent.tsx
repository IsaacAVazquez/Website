"use client";

import { ModernHero } from "@/components/ModernHero";
import { motion } from "framer-motion";
import { personalMetrics } from "@/constants/personal";
import Image from "next/image";
import { IconCode } from "@tabler/icons-react";

// Clean Timeline Item Component - Pentagram Style
const TimelineItem = ({ item, index }: { item: typeof personalMetrics.careerTimeline[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="pentagram-card pentagram-card-hover group"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between gap-6 mb-4">
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-[#2D1B12] dark:text-[#FFFCF7] mb-2 leading-tight">
            {item.role}
          </h3>
          <p className="text-lg md:text-xl text-[#FF6B35] dark:text-[#FF8E53] font-semibold">
            {item.company}
          </p>
        </div>
        {item.logo && (
          <div className="w-16 h-16 rounded-sm overflow-hidden border border-black/[0.08] dark:border-white/[0.1] flex-shrink-0">
            <Image
              src={item.logo}
              alt={`${item.company} logo`}
              width={64}
              height={64}
              className="object-contain w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Year */}
      <p className="editorial-caption mb-3 text-[#6B4F3D] dark:text-[#9C7A5F] font-mono">
        {item.year}
      </p>

      {/* Description */}
      <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E] mb-4">
        {item.description}
      </p>

      {/* Tech Stack */}
      {item.techStack && item.techStack.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <IconCode className="w-4 h-4 text-[#FF6B35] dark:text-[#FF8E53]" aria-hidden="true" />
            <span className="text-sm font-semibold text-[#FF6B35] dark:text-[#FF8E53] uppercase tracking-wider">
              Technologies
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1.5 text-sm bg-[#FFFCF7] dark:bg-[#2D1B12] border border-black/[0.08] dark:border-white/[0.1] text-[#4A3426] dark:text-[#D4A88E] font-mono rounded-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function HomeContent() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#1C1410]">
      {/* Editorial Hero Section */}
      <ModernHero />

      {/* Visual Divider */}
      <div className="pentagram-divider" aria-hidden="true" />

      {/* Overview Section - Clean Editorial Layout */}
      <section className="pentagram-section bg-white dark:bg-[#1C1410]">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <h2 className="editorial-heading text-[#2D1B12] dark:text-[#FFFCF7] mb-6">
              Overview
            </h2>

            {/* Content Grid */}
            <div className="space-y-5">
              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E]">
                I’m a product-focused technologist who translates QA rigor and analytics into clearer roadmaps. Over the last six years at Civitech I’ve led testing initiatives for voter engagement platforms that reach millions of voters, pairing technical execution with accountable product outcomes.
              </p>

              {/* Core Competencies */}
              <div className="pentagram-card">
                <h3 className="editorial-subheading text-[#2D1B12] dark:text-[#FFFCF7] mb-4">
                  Core Competencies
                </h3>
                <div className="pentagram-grid pentagram-grid-2">
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Product & Strategy
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      Run discovery, prioritize features, and keep cross-functional teams locked on the same bet.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Technical
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      Build Cypress suites, dive into SQL, validate APIs, and anchor delivery rituals in Agile best practices.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Analytics
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      Define the metrics that matter, wire up experimentation, and translate insights into roadmap changes.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#FF6B35] dark:text-[#FF8E53] mb-2">
                      Leadership
                    </h4>
                    <p className="text-base text-[#4A3426] dark:text-[#D4A88E] leading-relaxed">
                      Coach teams, remove project friction, and advocate for inclusive, mission-driven work.
                    </p>
                  </div>
                </div>
              </div>

              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E]">
                Before Civitech I analyzed statewide datasets for the State of Florida, packaging dashboards that made policy decisions faster. At Open Progress I converted campaign goals into digital programs that actually resonated with voters and volunteers.
              </p>

              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E]">
                I’m now pursuing an MBA at UC Berkeley Haas to sharpen product strategy and explore how to support civic tech, SaaS, and mission-driven founders as an operator or investor.
              </p>

              <p className="text-xl md:text-2xl text-[#2D1B12] dark:text-[#FFFCF7] font-semibold mt-6">
                Let’s connect if you’re shipping meaningful tech or want to jam on product, QA, or social impact.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visual Divider */}
      <div className="pentagram-divider" aria-hidden="true" />

      {/* Career Journey Section - Structured Grid */}
      <section className="pentagram-section bg-white dark:bg-[#1C1410]">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="editorial-heading text-[#2D1B12] dark:text-[#FFFCF7] mb-4">
                Career Journey
              </h2>
              <p className="editorial-body text-[#4A3426] dark:text-[#D4A88E] max-w-4xl">
                From Political Science graduate to QA engineer, and now an MBA candidate at UC Berkeley, my career has been a journey of continuous learning and impact. Here's a snapshot of my professional timeline.
              </p>
            </div>

            {/* Timeline Grid */}
            <div className="pentagram-grid">
              {personalMetrics.careerTimeline.map((item, index) => (
                <TimelineItem
                  key={`${item.year}-${item.role}`}
                  item={item}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom Spacing */}
      <div className="h-8" aria-hidden="true" />
    </div>
  );
}
