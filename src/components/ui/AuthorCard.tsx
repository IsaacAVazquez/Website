"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { IconBriefcase, IconSchool, IconMapPin, IconCheck } from "@tabler/icons-react";

export interface AuthorCardProps {
  name?: string;
  title?: string;
  bio?: string;
  image?: string;
  location?: string;
  credentials?: string[];
  experience?: string;
  education?: string;
  variant?: "full" | "compact" | "inline";
  showCTA?: boolean;
  className?: string;
}

export function AuthorCard({
  name = "Isaac Vazquez",
  title = "Technical Product Manager & UC Berkeley Haas MBA Candidate",
  bio = "Product-focused technologist with 6+ years of experience in civic tech and SaaS, specializing in data-driven product strategy and cross-functional leadership.",
  image = "/images/headshot-new.jpg",
  location = "Bay Area, CA",
  credentials = [
    "UC Berkeley Haas MBA Candidate '27",
    "Consortium Fellow & MLT Professional Development Fellow",
    "6+ years in civic tech and SaaS",
    "Led initiatives reaching 60M+ users",
  ],
  experience = "6+ years",
  education = "UC Berkeley Haas School of Business",
  variant = "full",
  showCTA = true,
  className = "",
}: AuthorCardProps) {

  // Inline variant - minimal display
  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {name}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
        </div>
      </div>
    );
  }

  // Compact variant - minimal card
  if (variant === "compact") {
    return (
      <div className={`pentagram-card ${className}`}>
        <div className="flex gap-4">
          <div className="relative w-16 h-16 rounded-sm overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <Image
              src={image}
              alt={name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
              {name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              {title}
            </p>
            {location && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500">
                <IconMapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full variant - comprehensive card with all details
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`pentagram-card ${className}`}
      itemScope
      itemType="https://schema.org/Person"
    >
      {/* Header with Image and Basic Info */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Author Image */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-sm overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(min-width: 768px) 112px, 96px"
            className="object-cover"
            itemProp="image"
          />
        </div>

        {/* Basic Info */}
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2" itemProp="name">
            {name}
          </h3>
          <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 mb-3" itemProp="jobTitle">
            {title}
          </p>

          {/* Location, Experience, Education */}
          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
            {location && (
              <div className="flex items-center gap-1.5" itemProp="workLocation">
                <IconMapPin className="w-4 h-4" aria-hidden="true" />
                <span>{location}</span>
              </div>
            )}
            {experience && (
              <div className="flex items-center gap-1.5">
                <IconBriefcase className="w-4 h-4" aria-hidden="true" />
                <span>{experience} experience</span>
              </div>
            )}
            {education && (
              <div className="flex items-center gap-1.5" itemProp="alumniOf">
                <IconSchool className="w-4 h-4" aria-hidden="true" />
                <span>{education}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="editorial-body text-neutral-700 dark:text-neutral-300 mb-6" itemProp="description">
          {bio}
        </p>
      )}

      {/* Credentials and Expertise */}
      {credentials && credentials.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3">
            Credentials & Expertise
          </h4>
          <ul className="space-y-2">
            {credentials.map((credential, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <IconCheck className="w-4 h-4 mt-0.5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" aria-hidden="true" />
                <span>{credential}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      {showCTA && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Link
            href="/about"
            className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
          >
            View Full Profile →
          </Link>
          <Link
            href="/contact"
            className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
          >
            Get In Touch →
          </Link>
        </div>
      )}

      {/* Microdata for search engines */}
      <meta itemProp="url" content="https://isaacavazquez.com" />
      <meta itemProp="knowsAbout" content="Product Management, Quality Assurance, Civic Tech, SaaS" />
    </motion.div>
  );
}
