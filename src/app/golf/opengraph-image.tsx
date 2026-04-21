/* eslint-disable react-refresh/only-export-components -- Next.js route modules export runtime metadata alongside the image component. */
import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "PGA Tour Pulse";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Sports Product",
    title: "PGA Tour Pulse",
    description:
      "Tournament dashboard for leaderboard scanning, player drilldowns, and round-by-round movement from a checked-in golf snapshot.",
    accent: "amber",
    footer: "isaacavazquez.com/golf",
  });
}
