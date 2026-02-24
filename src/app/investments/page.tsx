import type { Metadata } from "next";
import InvestmentsClient from "./investments-client";

export const metadata: Metadata = {
  title: "Investment Portfolio Tracker | Isaac Vazquez",
  description:
    "Track your investment portfolio in real-time with live Yahoo Finance data. Monitor gains, losses, daily changes, and compare stocks side by side.",
  keywords: [
    "investment tracker",
    "portfolio tracker",
    "stock tracker",
    "Yahoo Finance",
    "real-time stock data",
    "gain loss calculator",
  ],
  openGraph: {
    title: "Investment Portfolio Tracker",
    description:
      "Real-time investment tracking with live stock data, portfolio analytics, and stock comparison tools.",
    type: "website",
    url: "https://isaacavazquez.com/investments",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investment Portfolio Tracker",
    description:
      "Track investments with live Yahoo Finance data, portfolio analytics, and stock comparison.",
  },
};

export default function InvestmentsPage() {
  return <InvestmentsClient />;
}
