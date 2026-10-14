import type { ReactNode } from "react";
import { Archivo } from "next/font/google";

import { FantasyProductBar } from "@/components/fantasy/FantasyProductBar";
import "@/components/fantasy/fantasy.css";

/*
 * The fantasy product's own face: Archivo as one variable file with its width
 * axis, which sets the condensed sticker and label type. The site already
 * loads Archivo at 400 and 500 in normal width under the same family name,
 * and the browser takes this file for a condensed or heavy request.
 */
const ffbArchivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-ffb-archivo",
});

/**
 * The product shell around all eight fantasy routes: the kit's token scope
 * (`ffb-root`), the product bar, then the route. It renders no `main` (the
 * site frame owns that), reads no clock (three of these routes are cached at
 * the CDN), and puts no transform, filter, or containment on the wrapper,
 * because the drawer, the tray, and the modals inside are `position: fixed`.
 * `data-tooltip-scope` tells a portalled `MetricTooltip` to carry the kit's
 * tokens with it.
 */
export default function FantasyFootballLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`ffb-root ${ffbArchivo.variable}`} data-tooltip-scope="ffb-scope">
      <FantasyProductBar />
      {children}
    </div>
  );
}
