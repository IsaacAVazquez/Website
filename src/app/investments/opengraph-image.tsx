import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Investment Research Platform";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Fintech Product",
    title: "Investment Research Platform",
    description:
      "Snapshot-backed company analysis, valuation review, and browser-saved portfolio tracking in one research workspace.",
    accent: "teal",
    footer: "isaacavazquez.com/investments",
  });
}
