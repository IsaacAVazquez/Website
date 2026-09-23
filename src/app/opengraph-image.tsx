import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";

export const alt = "Isaac Vazquez, product manager and Berkeley Haas MBA '27";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return createEditorialOgImage({
    eyebrow: "Product and analytics",
    title: "I build test harnesses, and dashboards that run on public data.",
    description:
      "Product manager and builder at Berkeley Haas, MBA '27, who came to product through quality engineering at Civitech.",
  });
}
