import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "La Liga Pulse";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Sports Product",
    title: "La Liga Pulse",
    description:
      "La Liga dashboard for the standings, the title race, European qualification, and relegation pressure from a checked-in official snapshot.",
    accent: "cobalt",
    footer: "isaacavazquez.com/la-liga",
  });
}
