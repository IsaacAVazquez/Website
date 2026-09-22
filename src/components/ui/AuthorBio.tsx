import { BrandGithub, BrandLinkedin, Mail } from "@/components/ui/ServerIcons";
import Image from "next/image";
import Link from "next/link";

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
  /**
   * `light` is the end-of-article block: portrait, one paragraph, and the
   * three ways to reach me. `inline` is the byline-sized version for a header.
   * `full` adds the job title and the expertise chips; `compact` is `full`
   * without the chips.
   */
  variant?: "full" | "compact" | "inline" | "light";
  showImage?: boolean;
  showSocial?: boolean;
  className?: string;
}

/*
 * The portrait sits on a square stone field with the 35mm treatment, the same
 * slot every other photograph on the site uses. Catalog 97 draws no circles or
 * rounded frames, so the avatar is a small square.
 */
function Portrait({ src, alt, size }: { src: string; alt: string; size: number }) {
  return (
    <div
      data-c97-surface="stone"
      className="c97-slot"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <Image
        className="c97-slot-img"
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        itemProp="image"
      />
    </div>
  );
}

function SocialLinks({
  social,
}: {
  social: NonNullable<AuthorBioProps["social"]>;
}) {
  const linkStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--c97-sp-1)",
    color: "var(--c97-ink)",
  } as const;

  return (
    <ul
      aria-label="Elsewhere"
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: "var(--c97-sp-3)",
        rowGap: "var(--c97-sp-2)",
        listStyle: "none",
        margin: 0,
        padding: 0,
      }}
    >
      {social.linkedin ? (
        <li>
          <Link
            href={social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="c97-microlink"
            style={linkStyle}
            itemProp="sameAs"
          >
            <BrandLinkedin size={16} aria-hidden="true" />
            LinkedIn
          </Link>
        </li>
      ) : null}
      {social.github ? (
        <li>
          <Link
            href={social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="c97-microlink"
            style={linkStyle}
            itemProp="sameAs"
          >
            <BrandGithub size={16} aria-hidden="true" />
            GitHub
          </Link>
        </li>
      ) : null}
      {social.email ? (
        <li>
          <Link
            href={social.email}
            className="c97-microlink"
            style={linkStyle}
            itemProp="email"
          >
            <Mail size={16} aria-hidden="true" />
            Email
          </Link>
        </li>
      ) : null}
    </ul>
  );
}

/**
 * The author block, in the Catalog 97 language.
 *
 * It renders no heading of its own. The name is a paragraph at the h3 step,
 * because the block can land straight after an article's h1 when a post has
 * no related pieces, and an h3 there would skip a level.
 */
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
        className={className}
        style={{ display: "flex", alignItems: "center", gap: "var(--c97-sp-2)" }}
        itemScope
        itemType="https://schema.org/Person"
      >
        {showImage && image ? <Portrait src={image} alt={name} size={44} /> : null}
        <div>
          <p className="c97-prose" style={{ fontWeight: 600 }} itemProp="name">
            {name}
          </p>
          <p className="c97-kicker" itemProp="jobTitle">
            {title}
          </p>
        </div>
      </div>
    );
  }

  const showTitle = variant !== "light";
  const showExpertise = variant === "full" && expertise.length > 0;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--c97-sp-3)",
        maxWidth: "var(--c97-column)",
      }}
      itemScope
      itemType="https://schema.org/Person"
      itemProp="author"
    >
      {showImage && image ? (
        <Portrait src={image} alt={name} size={variant === "light" ? 64 : 96} />
      ) : null}
      <div style={{ minWidth: 0, flex: 1, display: "grid", gap: "var(--c97-sp-2)" }}>
        <div>
          <p className="c97-kicker">Written by</p>
          <p
            className="c97-serif c97-h3"
            style={{ marginTop: "var(--c97-sp-1)" }}
            itemProp="name"
          >
            {name}
          </p>
          {showTitle ? (
            <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-1)" }} itemProp="jobTitle">
              {title}
            </p>
          ) : null}
        </div>
        {bio ? (
          <p
            className="c97-prose"
            style={{ color: "var(--c97-ink-2)", maxWidth: "none" }}
            itemProp="description"
          >
            {bio}
          </p>
        ) : null}
        {showExpertise ? (
          <ul
            aria-label="Expertise"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--c97-sp-1)",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {expertise.map((skill) => (
              <li key={skill} className="c97-chip" itemProp="knowsAbout">
                {skill}
              </li>
            ))}
          </ul>
        ) : null}
        {showSocial && social ? <SocialLinks social={social} /> : null}
      </div>
    </div>
  );
}
