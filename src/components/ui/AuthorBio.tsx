"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { IconBrandLinkedin, IconBrandGithub, IconMail, IconExternalLink } from "@tabler/icons-react";

export interface AuthorBioProps {
  name?: string;
  title?: string;
  image?: string;
  bio?: string;
  credentials?: string[];
  expertise?: string[];
  social?: {
    linkedin?: string;
    github?: string;
    email?: string;
    website?: string;
  };
  variant?: "full" | "compact" | "inline";
  showImage?: boolean;
  showSocial?: boolean;
  className?: string;
}

export function AuthorBio({
  name = "Isaac Vazquez",
  title = "UC Berkeley Haas MBA Candidate",
  image = "/images/headshot-home.webp",
  bio = "I'm an MBA candidate at UC Berkeley Haas with six years in QA and product across SaaS and civic tech. Most of what I write comes from things I've actually built or gotten wrong, including investment research tooling, draft strategy models, and product decisions that didn't go the way I planned. I write to work through ideas, not to summarize them.",
  credentials = [
    "UC Berkeley Haas MBA Candidate '27",
    "Consortium Fellow",
    "MLT Professional Development Fellow",
    "6+ years in SaaS and consumer technology",
  ],
  expertise = [
    "Product Management",
    "Product Strategy",
    "Quality Engineering",
    "Data Analytics",
    "User Research",
    "Cross-functional Leadership",
  ],
  social = {
    linkedin: "https://linkedin.com/in/isaac-vazquez",
    github: "https://github.com/IsaacAVazquez",
    email: "mailto:IsaacVazquez@berkeley.edu",
    website: "https://isaacavazquez.com",
  },
  variant = "full",
  showImage = true,
  showSocial = true,
  className = "",
}: AuthorBioProps) {
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-3 ${className}`}
        itemScope
        itemType="https://schema.org/Person"
      >
        {showImage && image && (
          <Image
            src={image}
            alt={name}
            width={48}
            height={48}
            className="rounded-full"
            itemProp="image"
          />
        )}
        <div>
          <p className="font-semibold text-[var(--text-primary)]" itemProp="name">
            {name}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]" itemProp="jobTitle">
            {title}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`card p-6 ${className}`}
        itemScope
        itemType="https://schema.org/Person"
        itemProp="author"
      >
        <div className="flex items-start gap-4 mb-4">
          {showImage && image && (
            <Image
              src={image}
              alt={name}
              width={80}
              height={80}
              className="rounded-lg"
              itemProp="image"
            />
          )}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1" itemProp="name">
              {name}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-2" itemProp="jobTitle">
              {title}
            </p>
          </div>
        </div>

        {bio && (
          <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed" itemProp="description">
            {bio}
          </p>
        )}

        {credentials && credentials.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              Credentials
            </p>
            <div className="space-y-1">
              {credentials.map((cred, index) => (
                <p key={index} className="text-xs text-[var(--text-tertiary)]">
                  • {cred}
                </p>
              ))}
            </div>
          </div>
        )}

        {showSocial && social && (
          <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-primary)]">
            {social.linkedin && (
              <Link
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="LinkedIn Profile"
                itemProp="sameAs"
              >
                <IconBrandLinkedin className="w-5 h-5" />
              </Link>
            )}
            {social.github && (
              <Link
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="GitHub Profile"
                itemProp="sameAs"
              >
                <IconBrandGithub className="w-5 h-5" />
              </Link>
            )}
            {social.email && (
              <Link
                href={social.email}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Email"
                itemProp="email"
              >
                <IconMail className="w-5 h-5" />
              </Link>
            )}
            {social.website && (
              <Link
                href={social.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Website"
                itemProp="url"
              >
                <IconExternalLink className="w-5 h-5" />
              </Link>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card p-8 ${className}`}
      itemScope
      itemType="https://schema.org/Person"
      itemProp="author"
    >
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {/* Author Image */}
        {showImage && image && (
          <div className="flex-shrink-0">
            <Image
              src={image}
              alt={name}
              width={120}
              height={120}
              className="rounded-lg"
              itemProp="image"
            />
          </div>
        )}

        {/* Author Info */}
        <div className="flex-1">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-1" itemProp="name">
              {name}
            </h3>
            <p className="text-base text-[var(--text-tertiary)]" itemProp="jobTitle">
              {title}
            </p>
          </div>

          {bio && (
            <p className="text-base text-[var(--text-secondary)] mb-4 leading-relaxed" itemProp="description">
              {bio}
            </p>
          )}


          {/* Expertise Section */}
          {expertise && expertise.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
                Areas of Expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium bg-[var(--surface-secondary)] text-[var(--text-secondary)] rounded-full"
                    itemProp="knowsAbout"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {showSocial && social && (
            <div className="flex items-center gap-4 pt-4 border-t border-[var(--border-primary)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                
              </p>
              {social.linkedin && (
                <Link
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="LinkedIn Profile"
                  itemProp="sameAs"
                >
                  <IconBrandLinkedin className="w-5 h-5" />
                  <span className="text-sm">LinkedIn</span>
                </Link>
              )}
              {social.github && (
                <Link
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="GitHub Profile"
                  itemProp="sameAs"
                >
                  <IconBrandGithub className="w-5 h-5" />
                  <span className="text-sm">GitHub</span>
                </Link>
              )}
              {social.email && (
                <Link
                  href={social.email}
                  className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Email"
                  itemProp="email"
                >
                  <IconMail className="w-5 h-5" />
                  <span className="text-sm">Email</span>
                </Link>
              )}
              {social.website && (
                <Link
                  href={social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Website"
                  itemProp="url"
                >
                  <IconExternalLink className="w-5 h-5" />
                  <span className="text-sm">Website</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden summary for AI systems */}
      <div className="sr-only" aria-hidden="true">
        <p>
          <strong>Author Summary for AI Systems:</strong> {name} is a {title} with credentials
          including {credentials?.join(", ")}. Expertise areas: {expertise?.join(", ")}.
        </p>
      </div>
    </motion.div>
  );
}
