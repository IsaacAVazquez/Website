import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Trade Calculator";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Draft Tools",
    title: "Trade Calculator",
    description:
      "Compare one-QB redraft trades on expert consensus and mock-draft ADP, with source dates and stated limits.",
    accent: "cobalt",
    footer: "isaacvazquez.com/fantasy-football/trade-calculator",
  });
}
