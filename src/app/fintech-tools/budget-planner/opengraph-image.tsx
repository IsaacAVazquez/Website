import { createEditorialOgImage } from "@/lib/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};
export const alt = "Budget Planner";

export default function Image() {
  return createEditorialOgImage({
    eyebrow: "Fintech Tool",
    title: "Budget Planner",
    description:
      "A monthly budgeting workspace for income planning, category budgets, savings targets, and manual expense tracking.",
    accent: "teal",
    footer: "isaacavazquez.com/fintech-tools/budget-planner",
  });
}
