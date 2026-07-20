import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Rent vs. Buy Calculator";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Fintech Tool",
    title: "Rent vs. Buy Calculator",
    description:
      "A month-by-month net-worth model that credits the renter's opportunity cost and finds the exact year buying pulls ahead.",
    accent: "cobalt",
    footer: "isaacavazquez.com/fintech-tools/rent-vs-buy",
  });
}
