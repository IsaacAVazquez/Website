"use client";

import { useEffect, useState } from "react";
import { WarmCard } from "./WarmCard";
import { IconActivity, IconClock, IconEye, IconZoomCode } from "@tabler/icons-react";

interface WebVital {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  unit: string;
}

interface WebVitalsData {
  FCP: WebVital | null; // First Contentful Paint
  LCP: WebVital | null; // Largest Contentful Paint
  CLS: WebVital | null; // Cumulative Layout Shift
  INP: WebVital | null; // Interaction to Next Paint
  TTFB: WebVital | null; // Time to First Byte
}

// Thresholds based on web.dev guidelines
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
};

const getRating = (name: keyof typeof THRESHOLDS, value: number): "good" | "needs-improvement" | "poor" => {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
};

const getMetricIcon = (name: string) => {
  switch (name) {
    case "FCP":
      return IconEye;
    case "LCP":
      return IconZoomCode;
    case "CLS":
      return IconActivity;
    case "INP":
    case "TTFB":
      return IconClock;
    default:
      return IconActivity;
  }
};

const getMetricDescription = (name: string) => {
  switch (name) {
    case "FCP":
      return "Time until first content renders";
    case "LCP":
      return "Time until largest content renders";
    case "CLS":
      return "Visual stability score";
    case "INP":
      return "Interaction responsiveness";
    case "TTFB":
      return "Server response time";
    default:
      return "";
  }
};

const formatValue = (value: number, unit: string) => {
  if (unit === "ms") {
    return `${Math.round(value)}ms`;
  }
  return value.toFixed(4);
};

export function WebVitalsDashboard() {
  const [vitals, setVitals] = useState<WebVitalsData>({
    FCP: null,
    LCP: null,
    CLS: null,
    INP: null,
    TTFB: null,
  });

  useEffect(() => {
    // Import web-vitals dynamically
    import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      onFCP((metric) => {
        setVitals((prev) => ({
          ...prev,
          FCP: {
            name: "FCP",
            value: metric.value,
            rating: getRating("FCP", metric.value),
            unit: "ms",
          },
        }));
      });

      onLCP((metric) => {
        setVitals((prev) => ({
          ...prev,
          LCP: {
            name: "LCP",
            value: metric.value,
            rating: getRating("LCP", metric.value),
            unit: "ms",
          },
        }));
      });

      onCLS((metric) => {
        setVitals((prev) => ({
          ...prev,
          CLS: {
            name: "CLS",
            value: metric.value,
            rating: getRating("CLS", metric.value),
            unit: "",
          },
        }));
      });

      onINP((metric) => {
        setVitals((prev) => ({
          ...prev,
          INP: {
            name: "INP",
            value: metric.value,
            rating: getRating("INP", metric.value),
            unit: "ms",
          },
        }));
      });

      onTTFB((metric) => {
        setVitals((prev) => ({
          ...prev,
          TTFB: {
            name: "TTFB",
            value: metric.value,
            rating: getRating("TTFB", metric.value),
            unit: "ms",
          },
        }));
      });
    });
  }, []);

  const getRatingColor = (rating: "good" | "needs-improvement" | "poor") => {
    switch (rating) {
      case "good":
        return "text-matrix-green";
      case "needs-improvement":
        return "text-warning-amber";
      case "poor":
        return "text-error-red";
    }
  };

  const getRatingBg = (rating: "good" | "needs-improvement" | "poor") => {
    switch (rating) {
      case "good":
        return "bg-matrix-green/10 border-matrix-green/20";
      case "needs-improvement":
        return "bg-warning-amber/10 border-warning-amber/20";
      case "poor":
        return "bg-error-red/10 border-error-red/20";
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-electric-blue mb-2">Core Web Vitals</h2>
        <p className="text-slate-400 text-sm">
          Real-time performance metrics for this page
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(vitals).map(([key, vital]) => {
          if (!vital) {
            return (
              <WarmCard hover={false} padding="md" key={key} className="p-6 animate-pulse">
                <div className="h-24 flex items-center justify-center">
                  <span className="text-slate-500 text-sm">Measuring {key}...</span>
                </div>
              </WarmCard>
            );
          }

          const Icon = getMetricIcon(vital.name);

          return (
            <WarmCard hover={false} padding="md"
              key={key}
              className={`p-6 border-2 ${getRatingBg(vital.rating)}`}
              ariaLabel={`${vital.name} metric: ${formatValue(vital.value, vital.unit)}, ${vital.rating}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getRatingBg(vital.rating)}`}>
                    <Icon className={`w-5 h-5 ${getRatingColor(vital.rating)}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{vital.name}</h3>
                    <p className="text-xs text-slate-400">{getMetricDescription(vital.name)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className={`text-3xl font-bold ${getRatingColor(vital.rating)}`}>
                    {formatValue(vital.value, vital.unit)}
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase px-2 py-1 rounded ${getRatingBg(
                      vital.rating
                    )} ${getRatingColor(vital.rating)}`}
                  >
                    {vital.rating === "needs-improvement" ? "Needs Work" : vital.rating}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      vital.rating === "good"
                        ? "bg-matrix-green"
                        : vital.rating === "needs-improvement"
                        ? "bg-warning-amber"
                        : "bg-error-red"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (vital.value /
                          THRESHOLDS[vital.name as keyof typeof THRESHOLDS].poor) *
                          100
                      )}%`,
                    }}
                    role="progressbar"
                    aria-valuenow={vital.value}
                    aria-valuemin={0}
                    aria-valuemax={THRESHOLDS[vital.name as keyof typeof THRESHOLDS].poor}
                    aria-label={`${vital.name} performance indicator`}
                  />
                </div>

                {/* Threshold indicators */}
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span className="text-matrix-green">
                    {vital.unit === "ms"
                      ? `${THRESHOLDS[vital.name as keyof typeof THRESHOLDS].good}ms`
                      : THRESHOLDS[vital.name as keyof typeof THRESHOLDS].good}
                  </span>
                  <span className="text-error-red">
                    {vital.unit === "ms"
                      ? `${THRESHOLDS[vital.name as keyof typeof THRESHOLDS].poor}ms`
                      : THRESHOLDS[vital.name as keyof typeof THRESHOLDS].poor}
                  </span>
                </div>
              </div>
            </WarmCard>
          );
        })}
      </div>

      {/* Performance Summary */}
      <WarmCard hover={false} padding="md" className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Performance Summary</h3>
        <div className="space-y-3 text-sm text-slate-300">
          {Object.values(vitals).filter(Boolean).length === 5 ? (
            <>
              <p>
                <strong className="text-electric-blue">Overall Status:</strong>{" "}
                {Object.values(vitals).every((v) => v?.rating === "good") ? (
                  <span className="text-matrix-green font-semibold">Excellent Performance ✓</span>
                ) : Object.values(vitals).some((v) => v?.rating === "poor") ? (
                  <span className="text-error-red font-semibold">
                    Performance Issues Detected
                  </span>
                ) : (
                  <span className="text-warning-amber font-semibold">Room for Improvement</span>
                )}
              </p>
              <p className="text-slate-400 text-xs">
                Metrics are measured in real-time based on your current browsing session and may
                vary depending on network conditions, device performance, and browser cache state.
              </p>
            </>
          ) : (
            <p className="text-slate-400">Collecting metrics...</p>
          )}
        </div>
      </WarmCard>
    </div>
  );
}
