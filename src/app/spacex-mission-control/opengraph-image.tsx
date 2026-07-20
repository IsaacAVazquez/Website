import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "SpaceX Mission Control";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Data Product",
    title: "SpaceX Mission Control",
    description:
      "Mission-control launch board with next-launch visibility, upcoming and past missions, and relationship-aware detail panels from a checked-in launch snapshot.",
    accent: "cobalt",
    footer: "isaacavazquez.com/spacex-mission-control",
  });
}
