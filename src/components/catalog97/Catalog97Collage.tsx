import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import styles from "./Catalog97Collage.module.css";
import { Catalog97Reveal } from "./Catalog97Reveal";

type InkSurface =
  "ink-blue" | "ink-saffron" | "ink-vermilion" | "ink-peach" | "bone";

export interface CollagePanel {
  /** A finished riso plate. Leave it out and the panel is an ink block. */
  src?: string;
  /**
   * A painted version of the plate at the same aspect ratio, shown in a circle
   * around the pointer while the panel is hovered (the paint reveal in
   * catalog97.css).
   */
  paint?: string;
  /** The ink block's surface, when there is no plate. */
  surface?: InkSurface;
  /** A word printed large on an ink block, in poster type. */
  word?: string;
  sizes?: string;
  position?: string;
  caption?: ReactNode;
  /** Plates only: dark captions on saffron and peach grounds, light ones on blue and vermilion. */
  captionTone?: "dark" | "light";
  captionAt?: "top-left" | "top-right";
  /** Makes the panel a link. */
  href?: string;
  /** The link's name when there is no card to name it. */
  label?: string;
  /** A paper label pasted on the panel, carrying what the link leads to. */
  card?: ReactNode;
}

/**
 * A finished print that fills its frame and scales in as it reveals. Given a
 * `paint`, it carries the paint reveal, cropped to the photo's own position.
 */
export function Catalog97PrintPlate({
  src,
  sizes,
  alt = "",
  position,
  paint,
}: {
  src: string;
  sizes: string;
  alt?: string;
  position?: string;
  paint?: string;
}) {
  return (
    <div
      className={styles.plate}
      data-reveal=""
      data-c97-paint={paint ? "plate" : undefined}
      style={
        paint
          ? ({
              "--c97-paint": `url("${paint}")`,
              "--c97-paint-pos": position,
            } as CSSProperties)
          : undefined
      }
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={styles.plateImage}
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}

/**
 * The cut-paper hero: three sheets pasted edge to edge on black, each one a
 * riso plate or a flat ink block with a halftone ramp. A collage of plain art
 * is hidden from assistive tech. One whose panels are links is not, and each
 * panel then carries a pasted card so it never repeats something else on the
 * page.
 */
export function Catalog97Collage({ panels }: { panels: CollagePanel[] }) {
  const linked = panels.some((panel) => panel.href);
  return (
    <div className={styles.collage} aria-hidden={linked ? undefined : true}>
      <Catalog97Reveal />
      {panels.map((panel, index) => {
        const captionClass = panel.src
          ? panel.captionTone === "dark"
            ? styles.captionDark
            : styles.captionLight
          : styles.captionInk;
        const surface = panel.src ? undefined : (panel.surface ?? "ink-blue");
        const body = (
          <>
            {panel.src ? (
              <Catalog97PrintPlate
                src={panel.src}
                sizes={panel.sizes ?? "(max-width: 880px) 100vw, 34vw"}
                position={panel.position}
                paint={panel.paint}
              />
            ) : (
              <>
                <span className="c97-halftone c97-halftone-corner" />
                {panel.word ? (
                  <span
                    className={`c97-poster ${styles.word}`}
                    aria-hidden="true"
                  >
                    {panel.word}
                  </span>
                ) : null}
              </>
            )}
            {panel.caption ? (
              <span
                className={`${styles.caption} ${captionClass}`}
                data-at={panel.captionAt ?? "top-left"}
              >
                {panel.caption}
              </span>
            ) : null}
            {panel.card ? (
              <div
                className={`c97-offset ${styles.card}`}
                data-c97-surface="paper"
              >
                {panel.card}
              </div>
            ) : null}
          </>
        );
        return panel.href ? (
          <Link
            key={index}
            href={panel.href}
            className={`${styles.panel} ${styles.link}`}
            aria-label={panel.card ? undefined : panel.label}
            data-c97-surface={surface}
          >
            {body}
          </Link>
        ) : (
          <div key={index} className={styles.panel} data-c97-surface={surface}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
