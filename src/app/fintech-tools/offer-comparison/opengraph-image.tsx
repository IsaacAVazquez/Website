import { createEditorialOgImage } from "@/lib/og";

export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Offer Comparison Calculator";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Fintech Tool",
    title: "Offer Comparison Calculator",
    description:
      "Two or three job offers lined up year by year across a four year vest, from base and bonus to signing cash and equity.",
    accent: "cobalt",
    footer: "isaacvazquez.com/fintech-tools/offer-comparison",
  });
}
