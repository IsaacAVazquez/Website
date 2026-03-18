"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { WarmCard } from "@/components/ui/WarmCard";
import { ModernButton } from "@/components/ui/ModernButton";
import {
  IconMail,
  IconBrandLinkedin,
  IconBrandGithub,
  IconDownload,
} from "@tabler/icons-react";
import { SectionIntro } from "@/components/ui/SectionIntro";

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
      className="page-section bg-[var(--surface-primary)]"
    >
      <div className="page-shell text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-12">
            <SectionIntro
              eyebrow="Contact"
              align="center"
              title="Interested in working together?"
              description="If you&apos;re hiring for product work or want to talk through a project, I&apos;d be glad to connect."
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mb-12 grid gap-6 md:grid-cols-3"
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
                <WarmCard padding="md" hover className="h-full text-center shadow-sm">
                  <method.icon className="mx-auto mb-4 h-10 w-10 text-[var(--color-primary)]" />
                  <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
                    {method.label}
                  </h3>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {method.value}
                  </span>
                </WarmCard>
              </a>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <ModernButton href="/contact" variant="accent" size="lg">
              <IconMail className="h-5 w-5" />
              Get in touch
            </ModernButton>
            <Link
              href="/Isaac_Vazquez_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ModernButton variant="outline" size="lg">
                <IconDownload className="h-5 w-5" />
                Download resume
              </ModernButton>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
