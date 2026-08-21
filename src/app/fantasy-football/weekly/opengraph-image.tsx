import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Weekly Board";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "In Season",
    title: "Weekly Board",
    description:
      "Weekly flex and quarterback consensus, and the adds where rank runs ahead of rostered rate.",
    accent: "teal",
    footer: "isaacvazquez.com/fantasy-football/weekly",
  });
}
