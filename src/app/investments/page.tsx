import type { Metadata } from "next";
import { InvestmentsClient } from "./investments-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investments | Isaac Vazquez",
  description:
    "Personal portfolio tracker and stock research tool. Track holdings, analyze fundamentals, review earnings transcripts, and explore DCF valuations.",
  robots: { index: false, follow: false },
};

export default function InvestmentsPage() {
  return <InvestmentsClient />;
}
