import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Best Ball Draft Tracker";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Draft Tools",
    title: "Best Ball Draft Tracker",
    description:
      "Track a best ball room pick by pick, with roster shape, stacks, and next-pick fits.",
    accent: "teal",
    footer: "isaacvazquez.com/fantasy-football/best-ball/draft-tracker",
  });
}
