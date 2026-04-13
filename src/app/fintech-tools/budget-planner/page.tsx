/* eslint-disable react-refresh/only-export-components */
import { StructuredData } from "@/components/StructuredData";
import { constructMetadata, generateBreadcrumbStructuredData } from "@/lib/seo";
import { BudgetPlannerClient } from "./budget-planner-client";

export const metadata = constructMetadata({
  title: "Budget Planner | Isaac Vazquez",
  description:
    "Monthly budgeting tool for planning income, category budgets, savings targets, and manual expense tracking in a browser-persisted ledger.",
  canonicalUrl: "/fintech-tools/budget-planner",
  dateModified: "2026-04-03",
  image: "/fintech-tools/budget-planner/opengraph-image",
  aiMetadata: {
    profession: "Product Manager",
    specialty: "Budgeting UX, fintech product thinking, and personal finance workflow design",
    expertise: [
      "Budget Planning",
      "Fintech Product Design",
      "Client-side Persistence",
      "Financial Workflow UX",
      "Next.js",
    ],
    industry: ["Fintech", "Personal Finance", "Product Management"],
    topics: [
      "Monthly budgeting tool",
      "Expense tracking",
      "Category budgets",
      "Savings planning",
    ],
    contentType: "Software Application",
    context:
      "Standalone budgeting tool built as a public product project that demonstrates practical personal finance UX and browser-persisted state design.",
    summary:
      "Budget planner for monthly income allocation, category budgeting, savings targets, and manual expense tracking.",
    primaryFocus:
      "Budget planning, cash-flow awareness, and transparent client-side budgeting workflows",
  },
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
