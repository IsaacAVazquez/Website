import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Waiver Targets";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "In Season",
    title: "Waiver Targets",
    description:
      "The adds where the weekly expert consensus runs ahead of how widely a player is rostered.",
    accent: "teal",
    footer: "isaacvazquez.com/fantasy-football/waivers",
  });
}
