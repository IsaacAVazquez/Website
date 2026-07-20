import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { BudgetPlannerClient } from "./budget-planner-client";

export const metadata = constructMetadata({
  title: "Budget Planner",
  description:
    "I built a monthly budgeting tool for planning income, category budgets, savings targets, and manual expense tracking, all kept in a browser-persisted ledger.",
  canonicalUrl: "/fintech-tools/budget-planner",
  dateModified: "2026-04-03",
  image: "/fintech-tools/budget-planner/opengraph-image",
});

export default function BudgetPlannerPage() {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Budget Planner", url: "/fintech-tools/budget-planner" },
  ];

  return (
    <>
      <StructuredData
        type="BreadcrumbList"
        data={{
          items: (generateBreadcrumbStructuredData(breadcrumbs) as { itemListElement: object[] })
            .itemListElement,
        }}
      />
      <StructuredData
        type="SoftwareApplication"
        data={{
          name: "Budget Planner",
          description:
            "Monthly budgeting tool for planning income, savings, category budgets, and manual expense tracking with browser-local persistence.",
          url: "https://isaacavazquez.com/fintech-tools/budget-planner",
          image: "https://isaacavazquez.com/fintech-tools/budget-planner/opengraph-image",
          applicationCategory: "FinanceApplication",
          programmingLanguage: ["TypeScript", "Next.js"],
          author: "Isaac Vazquez",
          keywords: [
            "budget planner",
            "monthly budget",
            "expense tracker",
            "personal finance",
            "fintech project",
          ],
        }}
      />
      <BudgetPlannerClient />
    </>
  );
}
