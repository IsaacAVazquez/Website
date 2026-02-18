"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import {
  IconMail,
  IconBrandLinkedin,
  IconBrandGithub,
  IconDownload,
} from "@tabler/icons-react";

export function ContactSection() {
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
      id="contact"
      className="py-24 md:py-32"
      style={{ backgroundColor: "var(--surface-primary)" }}
    >
      <div className="container-wide max-w-4xl mx-auto text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="mb-12">
            <Heading level={2} className="mb-6">
              Let's Work Together
            </Heading>
            <p
              className="text-xl max-w-2xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              I'm currently pursuing my MBA at UC Berkeley Haas and exploring
              product management opportunities for Summer 2026 internships and
              beyond.
            </p>
          </motion.div>

          {/* Contact Methods */}
          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <WarmCard padding="lg" className="text-center">
              <IconMail
                className="h-10 w-10 mx-auto mb-4"
                style={{ color: "var(--color-primary)" }}
              />
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Email
              </h3>
              <a
                href="mailto:isaacavazquez95@gmail.com"
                className="text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                isaacavazquez95@gmail.com
              </a>
            </WarmCard>

            <WarmCard padding="lg" className="text-center">
              <IconBrandLinkedin
                className="h-10 w-10 mx-auto mb-4"
                style={{ color: "var(--color-primary)" }}
              />
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                LinkedIn
              </h3>
              <a
                href="https://linkedin.com/in/isaac-vazquez"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                /in/isaac-vazquez
              </a>
            </WarmCard>

            <WarmCard padding="lg" className="text-center">
              <IconBrandGithub
                className="h-10 w-10 mx-auto mb-4"
                style={{ color: "var(--color-primary)" }}
              />
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                GitHub
              </h3>
              <a
                href="https://github.com/isaacavazquez"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                @isaacavazquez
              </a>
            </WarmCard>
          </motion.div>

          {/* Resume Download */}
          <motion.div variants={itemVariants}>
            <Link
              href="/Isaac_Vazquez_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ModernButton variant="outline" size="lg">
                <IconDownload className="h-5 w-5 mr-2" />
                Download Resume
              </ModernButton>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
