import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Mock Draft Room";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Draft Tools",
    title: "Mock Draft Room",
    description:
      "Practice a full snake draft against the consensus board before the real room starts.",
    accent: "amber",
    footer: "isaacvazquez.com/fantasy-football/mock-draft",
  });
}
