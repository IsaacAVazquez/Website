import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Interchange IQ";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Payments Tool",
    title: "Interchange IQ",
    description:
      "Compare flat-rate and interchange-plus processor economics with live fee scenarios and breakeven logic.",
    accent: "teal",
    footer: "isaacavazquez.com/fintech-tools/interchange-iq",
  });
}
