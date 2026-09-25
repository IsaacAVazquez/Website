"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** The portrait's painters, in click order. Monet is the default, with no attribute. */
const PAINTERS = ["monet", "van-gogh", "seurat", "hopper"] as const;

/** Which header canvas the visitor's local hour gets (see catalog97.css). */
function daypart(hour: number): "morning" | "midday" | "evening" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "midday";
  return "evening";
}

/*
 * The site's painted hover effects, rendered once from Catalog97Header because
 * the header is on every route. The styles that use these live in
 * catalog97.css.
 *
 * `c97-monet-brush` roughens the header brand's edges into brushstrokes, and
 * `data-c97-daypart` on the root element picks which Monet canvas fills the
 * letters. Without JavaScript the attribute never lands and the header keeps
 * the midday canvas.
 *
 * Each `[data-c97-paint]` element shows its painted layer only in a circle
 * around the pointer, so the effect below writes the pointer's position,
 * relative to the element, into `--c97-mx` and `--c97-my`. The listeners sit
 * on the areas whose hover shows a layer, which is the `[data-c97-monet]`
 * section for a portrait and the parent panel for a plate, so nothing runs
 * while the pointer is anywhere else. A plate's panel sits inside the home
 * hero section, so a move there reaches both areas, as the hover does.
 *
 * Clicking a portrait hands it to the next painter in `PAINTERS` by setting
 * `data-c97-painter`, which catalog97.css maps to that painter's image.
 *
 * It only attaches where hover is real (the CSS shows the layers only under
 * `(hover: hover)`) and only when the page has a painted element. Moves are
 * coalesced into one animation frame, which reads every box before writing
 * any style. The header survives client navigation between the tool routes,
 * so the scan reruns whenever the pathname changes.
 */
export function Catalog97Monet() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.dataset.c97Daypart = daypart(new Date().getHours());
  }, []);

  useEffect(() => {
    if (!window.matchMedia?.("(hover: hover)").matches) return;
    const layersByArea = new Map<Element, HTMLElement[]>();
    document.querySelectorAll<HTMLElement>("[data-c97-paint]").forEach((layer) => {
      const area =
        layer.dataset.c97Paint === "portrait"
          ? layer.closest("[data-c97-monet]")
          : layer.parentElement;
      if (!area) return;
      layersByArea.set(area, [...(layersByArea.get(area) ?? []), layer]);
    });
    if (layersByArea.size === 0) return;

    const dirty = new Set<Element>();
    let x = 0;
    let y = 0;
    let frame = 0;

    const paint = () => {
      frame = 0;
      const layers = [...dirty].flatMap((area) => layersByArea.get(area) ?? []);
      dirty.clear();
      const boxes = layers.map((layer) => layer.getBoundingClientRect());
      layers.forEach((layer, index) => {
        layer.style.setProperty("--c97-mx", `${x - boxes[index].left}px`);
        layer.style.setProperty("--c97-my", `${y - boxes[index].top}px`);
      });
    };

    const handlers = [...layersByArea.keys()].map((area) => {
      const onMove = (event: Event) => {
        const { clientX, clientY } = event as PointerEvent;
        x = clientX;
        y = clientY;
        dirty.add(area);
        if (!frame) frame = window.requestAnimationFrame(paint);
      };
      area.addEventListener("pointermove", onMove, { passive: true });
      return () => area.removeEventListener("pointermove", onMove);
    });

    const portraits = [...layersByArea.values()]
      .flat()
      .filter((layer) => layer.dataset.c97Paint === "portrait");
    const clicks = portraits.map((portrait) => {
      const onClick = () => {
        const current = PAINTERS.indexOf(
          (portrait.dataset.c97Painter ?? "monet") as (typeof PAINTERS)[number],
        );
        portrait.dataset.c97Painter = PAINTERS[(current + 1) % PAINTERS.length];
      };
      portrait.addEventListener("click", onClick);
      return () => portrait.removeEventListener("click", onClick);
    });

    return () => {
      handlers.forEach((remove) => remove());
      clicks.forEach((remove) => remove());
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <filter id="c97-monet-brush">
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="3.5" />
        <feGaussianBlur stdDeviation="0.35" />
      </filter>
    </svg>
  );
}
