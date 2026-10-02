import { createEditorialOgImage } from "@/lib/og";

export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Before You Buy";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Product Concept",
    title: "Before You Buy",
    description:
      "See what a stock would do to your portfolio before you buy it. An independent concept by Isaac Vazquez, not affiliated with or endorsed by Google.",
    accent: "cobalt",
    footer: "isaacvazquez.com/investments/before-you-buy",
  });
}
