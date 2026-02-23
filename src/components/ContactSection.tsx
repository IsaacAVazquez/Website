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

const contactMethods = [
  {
    icon: IconMail,
    label: "Email",
    value: "IsaacVazquez@berkeley.edu",
    href: "mailto:IsaacVazquez@berkeley.edu",
  },
  {
    icon: IconBrandLinkedin,
    label: "LinkedIn",
    value: "/in/isaac-vazquez",
    href: "https://linkedin.com/in/isaac-vazquez",
    external: true,
  },
  {
    icon: IconBrandGithub,
    label: "GitHub",
    value: "@isaacavazquez",
    href: "https://github.com/isaacavazquez",
    external: true,
  },
];

export function ContactSection() {
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
      id="contact"
      className="py-16 md:py-24 bg-[var(--surface-primary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-12">
            <Heading level={2} className="mb-6">
              Let's Work Together
            </Heading>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              Open to PM roles, advisory projects, and conversations about
              building great products.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                {...(method.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="block"
              >
                <WarmCard padding="md" hover className="text-center h-full">
                  <method.icon className="h-10 w-10 text-[var(--color-primary)] mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">
                    {method.label}
                  </h3>
                  <span className="text-[var(--text-secondary)] text-sm">
                    {method.value}
                  </span>
                </WarmCard>
              </a>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link
              href="/Isaac_Vazquez_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ModernButton variant="outline" size="lg">
                <IconDownload className="h-5 w-5" />
                Download Resume
              </ModernButton>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
