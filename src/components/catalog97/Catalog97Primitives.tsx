import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

type Surface =
  | "paper"
  | "bone"
  | "ink-saffron"
  | "ink-vermilion"
  | "chocolate"
  | "ink-blue"
  | "ink-peach"
  | "espresso"
  | "stone";

interface Catalog97SlotProps {
  /**
   * The flat field the slot paints. The design specifies Stone or Vermilion for
   * an image field, and nothing else.
   */
  surface: Extract<Surface, "stone" | "ink-vermilion" | "ink-peach">;
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
  /** Sit the slot on the page's hard off-register offset, like a pasted print. */
  offset?: boolean;
}

/**
 * An image field.
 *
 * The design calls for warm 35mm photography in these positions. Where a
 * photograph exists it is laid over the field with the design's own treatment
 * (`.c97-slot-img`, which carries the saturate/sepia/contrast/brightness stack
 * the source specifies). Where one does not, the slot stays the flat Stone or
 * Vermilion field that the design's layout rules already call for, because a flat
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
  offset,
}: Catalog97SlotProps) {
  const field = (
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
      ) : (
        // No print yet, so the field prints as a flat ink with a halftone ramp.
        <span className="c97-halftone c97-halftone-corner" aria-hidden="true" />
      )}
    </div>
  );
  return (
    <div style={style}>
      {/* The offset sits outside the field, so it takes the sheet's second ink rather than the field's. */}
      {offset ? <div className="c97-offset">{field}</div> : field}
      {caption ? (
        <p className="c97-kicker" style={{ marginTop: "var(--c97-sp-2)" }}>
          {caption}
        </p>
      ) : null}
    </div>
  );
}
