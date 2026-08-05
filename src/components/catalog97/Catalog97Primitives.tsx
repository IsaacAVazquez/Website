import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

type Surface =
  | "paper"
  | "bone"
  | "camel"
  | "tobacco"
  | "chocolate"
  | "pine"
  | "espresso"
  | "stone";

interface Catalog97PlateProps {
  /** The ordinal itself, zero-padded by the caller (`"01"`). */
  value: string;
  style?: CSSProperties;
}

/**
 * An Anton plate numeral.
 *
 * The rule is that Anton draws numerals at `--c97-fs-plate` and nothing else.
 * Running text and headings are barred from it outright, and there is no
 * smaller numeral step, which is why this component takes no size prop: every
 * plate on the site is the same size, and a page may carry as many as its
 * sections need. That replaces the earlier one-Anton-per-view rule, which the
 * plate numbering made unworkable.
 *
 * These are section ordinals rather than data, so they are hidden from
 * assistive technology — the heading beside each one already names the
 * section.
 *
 * `--c97-plate` is the only place the warm mid-tones are allowed as ink, which
 * works precisely because a plate is never below 64px. See the token's note in
 * `catalog97.css`.
 */
export function Catalog97Plate({ value, style }: Catalog97PlateProps) {
  return (
    <div
      aria-hidden="true"
      className="c97-numeral c97-tabular"
      style={{ color: "var(--c97-plate)", ...style }}
    >
      {value}
    </div>
  );
}

interface Catalog97SlotProps {
  /**
   * The flat field the slot paints. The design specifies Stone or Tobacco for
   * an image field, and nothing else.
   */
  surface: Extract<Surface, "stone" | "tobacco">;
  /** CSS `aspect-ratio`, e.g. `"4 / 5"` for a portrait or `"3 / 2"` for a card. */
  ratio: string;
  /** Rendered underneath the field, in the label step. */
  caption?: ReactNode;
  /**
   * Photograph to lay over the field. Omit it and the slot stays the flat
   * band the design specifies for a position that has no picture yet.
   */
  src?: string;
  /**
   * Required whenever `src` is set. The photograph carries meaning here, since
   * it is the one dominant image of the view, so it is never decorative.
   */
  alt?: string;
  /** Set on an above-the-fold slot so the photograph is not lazy-loaded. */
  priority?: boolean;
  /** Passed to `next/image` so it can pick a candidate from the srcset. */
  sizes?: string;
  style?: CSSProperties;
}

/**
 * An image field.
 *
 * The design calls for warm 35mm photography in these positions. Where a
 * photograph exists it is laid over the field with the design's own treatment
 * (`.c97-slot-img`, which carries the saturate/sepia/contrast/brightness stack
 * the source specifies). Where one does not, the slot stays the flat Stone or
 * Tobacco field that the design's layout rules already call for, because a flat
 * color block reads as part of the composition while a grey rectangle with a
 * broken image icon reads as unfinished.
 *
 * The field is painted underneath either way rather than being swapped out, so
 * a photograph that is still decoding, or that fails outright, leaves the
 * composition intact instead of punching a hole in the band.
 */
export function Catalog97Slot({
  surface,
  ratio,
  caption,
  src,
  alt,
  priority,
  sizes,
  style,
}: Catalog97SlotProps) {
  return (
    <div style={style}>
      <div
        data-c97-surface={surface}
        className="c97-slot"
        style={{ aspectRatio: ratio }}
      >
        {src ? (
          <Image
            className="c97-slot-img"
            src={src}
            alt={alt ?? ""}
            fill
            priority={priority}
            sizes={sizes ?? "(max-width: 790px) 100vw, 50vw"}
          />
        ) : null}
      </div>
      {caption ? (
        <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
          {caption}
        </p>
      ) : null}
    </div>
  );
}
