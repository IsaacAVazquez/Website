import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Best Ball Board";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Draft Tools",
    title: "Best Ball Board",
    description:
      "Contest-aware best ball rankings with Underdog ADP, bye coverage, and Week 17 matchups.",
    accent: "teal",
    footer: "isaacvazquez.com/fantasy-football/best-ball",
  });
}
