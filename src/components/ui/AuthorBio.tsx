import { BrandGithub, BrandLinkedin, Mail } from "@/components/ui/ServerIcons";
import Image from "next/image";
import Link from "next/link";

const NAME = "Isaac Vazquez";
const BIO =
  "I'm a second-year MBA candidate at Berkeley Haas moving into product, after six years in campaign data and QA and a summer on Juno's MBA growth team. Most of my product writing comes from things I've actually built or gotten wrong, and writing is how I work out what I think about them.";

const LINK_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--c97-sp-1)",
  color: "var(--c97-ink)",
} as const;

/**
 * The end-of-article author block, in the Catalog 97 language: portrait, one
 * paragraph, and the three ways to reach me.
 *
 * It renders no heading of its own. The name is a paragraph at the h3 step,
 * because the block can land straight after an article's h1 when a post has
 * no related pieces, and an h3 there would skip a level.
 */
export function AuthorBio() {
  return (
    <div
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
      {/* The portrait sits on a square stone field with the 35mm treatment, the
          same slot every other photograph on the site uses. Catalog 97 draws no
          circles or rounded frames, so the avatar is a small square. */}
      <div data-c97-surface="stone" className="c97-slot" style={{ width: 64, height: 64, flexShrink: 0 }}>
        <Image
          className="c97-slot-img"
          src="/images/headshot-home.webp"
          alt={NAME}
          fill
          sizes="64px"
          itemProp="image"
        />
      </div>
      <div style={{ minWidth: 0, flex: 1, display: "grid", gap: "var(--c97-sp-2)" }}>
        <div>
          <p className="c97-kicker">Written by</p>
          <p className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }} itemProp="name">
            {NAME}
          </p>
        </div>
        <p className="c97-prose" style={{ color: "var(--c97-ink-2)", maxWidth: "none" }} itemProp="description">
          {BIO}
        </p>
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
          <li>
            <Link
              href="https://www.linkedin.com/in/isaac-vazquez/"
              target="_blank"
              rel="noopener noreferrer"
              className="c97-microlink"
              style={LINK_STYLE}
              itemProp="sameAs"
            >
              <BrandLinkedin size={16} aria-hidden="true" />
              LinkedIn
            </Link>
          </li>
          <li>
            <Link
              href="https://github.com/IsaacAVazquez"
              target="_blank"
              rel="noopener noreferrer"
              className="c97-microlink"
              style={LINK_STYLE}
              itemProp="sameAs"
            >
              <BrandGithub size={16} aria-hidden="true" />
              GitHub
            </Link>
          </li>
          <li>
            <Link href="mailto:IsaacVazquez@berkeley.edu" className="c97-microlink" style={LINK_STYLE} itemProp="email">
              <Mail size={16} aria-hidden="true" />
              Email
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
