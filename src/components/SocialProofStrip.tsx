"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MetricCallout } from "@/components/ui/MetricCallout";
import { ExpertSignal } from "@/components/ui/ExpertSignal";

const metrics = [
  { value: "60M+", label: "Users Reached" },
  { value: "99.9%", label: "Uptime" },
  { value: "$4M", label: "Revenue Impact" },
  { value: "90%", label: "Defect Reduction" },
];

const credentials = [
  { label: "UC Berkeley Haas MBA", type: "education" as const },
  { label: "Consortium Fellow", type: "award" as const },
  { label: "MLT Fellow", type: "award" as const },
];

export function SocialProofStrip() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <section
      className="py-12 md:py-16 bg-[var(--surface-secondary)]"
      aria-label="Key achievements and credentials"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {metrics.map((metric) => (
              <MetricCallout
                key={metric.label}
                value={metric.value}
                label={metric.label}
                size="sm"
                variant="primary"
              />
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {credentials.map((cred) => (
              <ExpertSignal
                key={cred.label}
                label={cred.label}
                type={cred.type}
                variant="badge"
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
