import type { Metadata } from "next";
import { Catalog97LayoutsCanvas } from "@/components/catalog97/Catalog97LayoutsCanvas";

/**
 * The Catalog 97 layouts canvas, at /design/catalog-pages.
 *
 * This is a design-review surface rather than a destination, so it is kept out
 * of the index and out of the nav. It exists to answer one question in a single
 * scroll, which is whether the seven designed routes still hold the layout
 * rules together, and that question is worth asking against the real routes
 * rather than against a mock of them.
 *
 * It deliberately sits outside `catalog97NavLinks`, so `isCatalog97Route` stays
 * an exact match on the seven and both `StaticHeader` and `ConditionalLayout`
 * behave here exactly as they do on any ordinary route.
 */
export const metadata: Metadata = {
  title: "Catalog 97 layouts",
  description:
    "Every route in the Catalog 97 design language, stacked in one scroll with the layout rules the set holds.",
  robots: { index: false, follow: false },
};

export default function Catalog97LayoutsPage() {
  return <Catalog97LayoutsCanvas />;
}
