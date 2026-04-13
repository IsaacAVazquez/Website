import type { MissionLaunchCard } from "@/types/spacex";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
});

export function humanizeMissionPrecision(precision: string): string {
  switch (precision) {
    case "hour":
      return "hour";
    case "day":
      return "day";
    case "month":
      return "month";
    case "year":
      return "year";
    case "quarter":
      return "quarter";
    case "half":
      return "half-year";
    default:
      return precision;
  }
}

export function formatMissionMoment(launch: Pick<MissionLaunchCard, "dateUtc" | "datePrecision">): string {
  const date = new Date(launch.dateUtc);

  switch (launch.datePrecision) {
    case "hour":
      return DATE_TIME_FORMATTER.format(date);
    case "day":
      return DATE_FORMATTER.format(date);
    case "month":
    case "quarter":
    case "half":
      return MONTH_FORMATTER.format(date);
    case "year":
      return YEAR_FORMATTER.format(date);
    default:
      return DATE_FORMATTER.format(date);
  }
}

export function formatMissionScheduleLabel(launch: MissionLaunchCard): string {
  if (launch.isStaleSchedule) {
    return "Awaiting refreshed schedule from upstream API";
  }

  if (launch.tbd) {
    return `Date TBD (${humanizeMissionPrecision(launch.datePrecision)} precision)`;
  }

  if (launch.datePrecision === "hour") {
    return formatMissionMoment(launch);
  }

  return `Scheduled for ${formatMissionMoment(launch)}`;
}

export function formatInteger(value: number | null): string {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function formatCompactMagnitude(value: number): string {
  const absoluteValue = Math.abs(value);
  const units = [
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 1_000, suffix: "K" },
  ] as const;

  for (const unit of units) {
    if (absoluteValue < unit.threshold) {
      continue;
    }

    const scaledValue = Math.round((value / unit.threshold) * 10) / 10;
    const scaledLabel = Number.isInteger(scaledValue)
      ? scaledValue.toString()
      : scaledValue.toFixed(1);

    return `${scaledLabel}${unit.suffix}`;
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrencyCompact(value: number | null): string {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  const amount = value ?? 0;

  if (Math.abs(amount) < 1_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return `$${formatCompactMagnitude(amount)}`;
}
