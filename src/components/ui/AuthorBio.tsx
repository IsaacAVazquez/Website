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

/**
 * AuthorBio - AI-optimized author component
 *
 * Displays author information with E-E-A-T signals (Expertise, Experience,
 * Authoritativeness, Trustworthiness) for AI search engines. Includes
 * schema.org Person microdata for better AI parsing and citation.
 *
 * Features:
 * - Schema.org Person microdata
 * - E-E-A-T credibility signals
 * - Multiple display variants
 * - Social proof links
 * - Citation-friendly formatting
 */
export function AuthorBio({
  name = "Isaac Vazquez",
  title = "Technical Product Manager & UC Berkeley Haas MBA Candidate",
  image = "/images/isaac-headshot.jpg",
  bio = "Product manager with 6+ years in civic tech and SaaS, currently pursuing MBA at UC Berkeley Haas. Building mission-driven products that balance user insight, data-driven decisions, and cross-functional collaboration.",
  credentials = [
    "UC Berkeley Haas MBA Candidate '27",
    "Consortium Fellow",
    "MLT Professional Development Fellow",
    "6+ years in civic tech and SaaS",
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
    email: "mailto:isaacavazquez95@gmail.com",
    website: "https://isaacavazquez.com",
  },
  variant = "full",
  showImage = true,
  showSocial = true,
  className = "",
}: AuthorBioProps) {
  // Inline variant - minimal, for article bylines
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
          <p className="font-semibold text-neutral-900 dark:text-neutral-100" itemProp="name">
            {name}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400" itemProp="jobTitle">
            {title}
          </p>
        </div>
      </div>
    );
  }

  // Compact variant - for sidebars or smaller spaces
  if (variant === "compact") {
    return (
      <div
        className={`pentagram-card p-6 ${className}`}
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
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1" itemProp="name">
              {name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2" itemProp="jobTitle">
              {title}
            </p>
          </div>
        </div>

        {bio && (
          <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3 leading-relaxed" itemProp="description">
            {bio}
          </p>
        )}

        {credentials && credentials.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
              Credentials
            </p>
            <div className="space-y-1">
              {credentials.map((cred, index) => (
                <p key={index} className="text-xs text-neutral-600 dark:text-neutral-400">
                  • {cred}
                </p>
              ))}
            </div>
          </div>
        )}

        {showSocial && social && (
          <div className="flex items-center gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            {social.linkedin && (
              <Link
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                aria-label="GitHub Profile"
                itemProp="sameAs"
              >
                <IconBrandGithub className="w-5 h-5" />
              </Link>
            )}
            {social.email && (
              <Link
                href={social.email}
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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

  // Full variant - comprehensive author information
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`pentagram-card p-8 ${className}`}
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
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2" itemProp="name">
              About the Author
            </h3>
            <h4 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              {name}
            </h4>
            <p className="text-base text-neutral-600 dark:text-neutral-400" itemProp="jobTitle">
              {title}
            </p>
          </div>

          {bio && (
            <p className="text-base text-neutral-700 dark:text-neutral-300 mb-4 leading-relaxed" itemProp="description">
              {bio}
            </p>
          )}

          {/* Credentials Section */}
          {credentials && credentials.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
                Credentials & Experience
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {credentials.map((cred, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2"
                    itemProp="hasCredential"
                    itemScope
                    itemType="https://schema.org/EducationalOccupationalCredential"
                  >
                    <span className="text-neutral-900 dark:text-neutral-100">•</span>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300" itemProp="name">
                      {cred}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expertise Section */}
          {expertise && expertise.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
                Areas of Expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full"
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
            <div className="flex items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Connect:
              </p>
              {social.linkedin && (
                <Link
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
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
