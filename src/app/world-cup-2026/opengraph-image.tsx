import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "World Cup Pulse";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Sports Product",
    title: "World Cup Pulse",
    description:
      "A 2026 FIFA World Cup hub: group standings, the new 32-team knockout bracket, the full match schedule, and host venues across three nations.",
    accent: "teal",
    footer: "isaacavazquez.com/world-cup-2026",
  });
}
