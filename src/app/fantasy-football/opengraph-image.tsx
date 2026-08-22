import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Fantasy Football Rankings";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Draft Tools",
    title: "Fantasy Football Rankings",
    description:
      "Tier-first consensus rankings with expert spread bars, rank cliffs, scoring toggles, and dated sources.",
    accent: "amber",
    footer: "isaacvazquez.com/fantasy-football",
  });
}
