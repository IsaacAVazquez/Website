"use client";

import Image from "next/image";
import Link from "next/link";
import { IconBrandLinkedin, IconBrandGithub, IconMail } from "@tabler/icons-react";

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
  /** `light` is the reading-discipline variant for the end of an article:
   * a circular avatar, one paragraph, no expertise grid, minimal social. */
  variant?: "full" | "compact" | "inline" | "light";
  showImage?: boolean;
  showSocial?: boolean;
  className?: string;
}

export function AuthorBio({
  name = "Isaac Vazquez",
  title = "UC Berkeley Haas MBA Candidate",
  image = "/images/headshot-home.webp",
  bio = "I'm an MBA candidate at UC Berkeley Haas with six years in QA and product across SaaS and civic tech. Most of what I write comes from things I've actually built or gotten wrong, including investment research tooling, draft strategy models, and product decisions that didn't go the way I planned. I write to work through ideas, not to summarize them.",
  expertise = [
    "Product Management",
    "Product Strategy",
    "Quality Engineering",
    "Data Analytics",
    "User Research",
    "Cross-functional Leadership",
  ],
  social = {
    linkedin: "https://www.linkedin.com/in/isaac-vazquez/",
    github: "https://github.com/IsaacAVazquez",
    email: "mailto:IsaacVazquez@berkeley.edu",
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
          <p
            className="font-semibold"
            style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink)" }}
            itemProp="name"
          >
            {name}
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
            itemProp="jobTitle"
          >
            {title}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "light") {
    return (
      <div
        className={`home-card-static flex items-start gap-4 p-5 ${className}`}
        style={{ maxWidth: "65ch" }}
        itemScope
        itemType="https://schema.org/Person"
        itemProp="author"
      >
        {showImage && image && (
          <Image
            src={image}
            alt={name}
            width={56}
            height={56}
            className="flex-shrink-0 rounded-full"
            style={{ border: "1px solid var(--home-rule)", objectFit: "cover" }}
            itemProp="image"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3
            className="mb-1 font-semibold"
            style={{ fontFamily: "var(--font-home-sans)", fontSize: "1.05rem", color: "var(--home-ink)" }}
            itemProp="name"
          >
            {name}
          </h3>
          {bio && (
            <p
              className="mb-0 text-sm leading-relaxed"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
              itemProp="description"
            >
              {bio}
            </p>
          )}
          {showSocial && social && (
            <div className="mt-3 flex items-center gap-3">
              {social.linkedin && (
                <Link
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{ color: "var(--home-ink-muted)" }}
                  aria-label="LinkedIn"
                  itemProp="sameAs"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
                >
                  <IconBrandLinkedin className="h-4 w-4" />
                </Link>
              )}
              {social.github && (
                <Link
                  href={social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{ color: "var(--home-ink-muted)" }}
                  aria-label="GitHub"
                  itemProp="sameAs"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
                >
                  <IconBrandGithub className="h-4 w-4" />
                </Link>
              )}
              {social.email && (
                <Link
                  href={social.email}
                  className="transition-colors"
                  style={{ color: "var(--home-ink-muted)" }}
                  aria-label="Email"
                  itemProp="email"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
                >
                  <IconMail className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`home-card home-project-card ${className}`}
        itemScope
        itemType="https://schema.org/Person"
        itemProp="author"
      >
        <div className="flex items-start gap-4 mb-4">
          {showImage && image && (
            <Image
              src={image}
              alt={name}
              width={72}
              height={72}
              className="rounded-[var(--radius-xl)] flex-shrink-0"
              itemProp="image"
            />
          )}
          <div className="flex-1">
            <h3
              className="font-bold mb-0.5"
              style={{ fontFamily: "var(--font-home-sans)", fontSize: "1.1rem", color: "var(--home-ink)" }}
              itemProp="name"
            >
              {name}
            </h3>
            <p
              className="text-sm"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
              itemProp="jobTitle"
            >
              {title}
            </p>
          </div>
        </div>

        {bio && (
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
            itemProp="description"
          >
            {bio}
          </p>
        )}

        {showSocial && social && (
          <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--home-rule)" }}>
            {social.linkedin && (
              <Link href={social.linkedin} target="_blank" rel="noopener noreferrer"
                className="transition-colors" style={{ color: "var(--home-ink-muted)" }}
                aria-label="LinkedIn" itemProp="sameAs"
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
              >
                <IconBrandLinkedin className="w-5 h-5" />
              </Link>
            )}
            {social.github && (
              <Link href={social.github} target="_blank" rel="noopener noreferrer"
                className="transition-colors" style={{ color: "var(--home-ink-muted)" }}
                aria-label="GitHub" itemProp="sameAs"
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
              >
                <IconBrandGithub className="w-5 h-5" />
              </Link>
            )}
            {social.email && (
              <Link href={social.email}
                className="transition-colors" style={{ color: "var(--home-ink-muted)" }}
                aria-label="Email" itemProp="email"
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
              >
                <IconMail className="w-5 h-5" />
              </Link>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={`home-card home-project-card ${className}`}
      itemScope
      itemType="https://schema.org/Person"
      itemProp="author"
    >
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {showImage && image && (
          <div className="flex-shrink-0">
            <Image
              src={image}
              alt={name}
              width={100}
              height={100}
              className="rounded-[var(--radius-xl)]"
              itemProp="image"
            />
          </div>
        )}

        <div className="flex-1">
          <h3
            className="font-bold mb-0.5"
            style={{
              fontFamily: "var(--font-home-sans)",
              fontSize: "1.15rem",
              letterSpacing: "-0.02em",
              color: "var(--home-ink)",
            }}
            itemProp="name"
          >
            {name}
          </h3>
          <p
            className="mb-4 text-sm"
            style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
            itemProp="jobTitle"
          >
            {title}
          </p>

          {bio && (
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)", lineHeight: 1.65 }}
              itemProp="description"
            >
              {bio}
            </p>
          )}

          {expertise && expertise.length > 0 && (
            <div className="mb-4">
              <p className="home-kicker mb-2">Expertise</p>
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill, index) => (
                  <span key={index} className="resume-chip" itemProp="knowsAbout">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showSocial && social && (
            <div className="flex items-center gap-4 pt-4" style={{ borderTop: "1px solid var(--home-rule)" }}>
              {social.linkedin && (
                <Link href={social.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm transition-colors"
                  style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                  aria-label="LinkedIn" itemProp="sameAs"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
                >
                  <IconBrandLinkedin className="w-4 h-4" />
                  LinkedIn
                </Link>
              )}
              {social.github && (
                <Link href={social.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm transition-colors"
                  style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                  aria-label="GitHub" itemProp="sameAs"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
                >
                  <IconBrandGithub className="w-4 h-4" />
                  GitHub
                </Link>
              )}
              {social.email && (
                <Link href={social.email}
                  className="flex items-center gap-2 text-sm transition-colors"
                  style={{ fontFamily: "var(--font-home-sans)", color: "var(--home-ink-muted)" }}
                  aria-label="Email" itemProp="email"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--home-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--home-ink-muted)")}
                >
                  <IconMail className="w-4 h-4" />
                  Email
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
