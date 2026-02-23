import type { Metadata } from "next";
import { StockComparisonTool } from "@/components/investments/StockComparisonTool";
import { IconScaleOutline, IconBuildingBank, IconTrendingUp } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Stock Comparison Tool | Isaac Vazquez",
  description:
    "Compare stocks side by side with live prices, analyst ratings from top banks, financial metrics, and more.",
  keywords: [
    "stock comparison",
    "stock analysis",
    "analyst ratings",
    "stock screener",
    "investment comparison",
    "financial metrics",
    "buy sell hold ratings",
  ],
  openGraph: {
    title: "Stock Comparison Tool",
    description:
      "Compare up to 4 stocks side-by-side with analyst consensus ratings, price targets, and key financial metrics.",
    type: "website",
    url: "https://isaacavazquez.com/investments/compare",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stock Comparison Tool",
    description:
      "Compare stocks with analyst ratings, price targets, and financial metrics.",
  },
};

const FEATURES = [
  {
    icon: IconTrendingUp,
    label: "Live Prices",
    desc: "Real-time quotes via Yahoo Finance",
  },
  {
    icon: IconBuildingBank,
    label: "Analyst Ratings",
    desc: "Bank consensus with price targets",
  },
  {
    icon: IconScaleOutline,
    label: "Side-by-Side Metrics",
    desc: "Valuation, growth, and profitability",
  },
];

export default function StockComparePage() {
  return (
    <div className="min-h-screen bg-[var(--surface-primary)]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--border-primary)]">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-primary)] text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden />
              Live Data
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              Powered by Yahoo Finance
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-primary)] mb-4 leading-[1.05]">
            Stock{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--color-primary), #7c3aed)",
              }}
            >
              Comparison
            </span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
            Compare up to 4 stocks side-by-side. See live prices, Wall Street analyst
            consensus ratings, price targets, and financial metrics — all in one view.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-elevated)] text-sm"
              >
                <Icon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">{label}</span>
                  <span className="text-[var(--text-tertiary)] ml-1.5 text-xs hidden sm:inline">
                    {desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main tool ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <StockComparisonTool />
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <p className="text-xs text-[var(--text-tertiary)] border-t border-[var(--border-primary)] pt-6 leading-relaxed">
          <strong className="font-semibold">Disclaimer:</strong> Data is sourced from Yahoo Finance
          and may be delayed or inaccurate. Analyst ratings reflect aggregated third-party opinions
          and are provided for informational purposes only. Nothing on this page constitutes
          financial advice. Always conduct your own research before making investment decisions.
        </p>
      </section>
    </div>
  );
}
