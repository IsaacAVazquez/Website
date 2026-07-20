import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Earthquake Pulse";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Science Product",
    title: "Earthquake Pulse",
    description:
      "Global seismic monitor for the past 24 hours, the most significant quakes worldwide, and the busiest regions from a checked-in USGS snapshot.",
    accent: "amber",
    footer: "isaacavazquez.com/earthquake-pulse",
  });
}
