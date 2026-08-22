import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Draft Tracker";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Draft Tools",
    title: "Draft Tracker",
    description:
      "Live board, tier columns, and reach-or-value reads against the published market while your draft runs.",
    accent: "amber",
    footer: "isaacvazquez.com/fantasy-football/draft-tracker",
  });
}
