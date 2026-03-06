"use client";

import React from "react";
import { WarmCard } from "@/components/ui/WarmCard";
import { useStockData } from "@/hooks/useStockData";
import { IconExternalLink } from "@tabler/icons-react";
import type { NewsData, NewsItem } from "@/types/investment";
import { ErrorState } from "./ErrorState";

interface Props { symbol: string }

function formatDate(raw: string | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="py-3 border-b border-[var(--border-primary)] last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--color-primary)] transition line-clamp-2 flex items-center gap-1"
            >
              {item.title}
              <IconExternalLink size={12} className="shrink-0 text-[var(--text-tertiary)]" />
            </a>
          ) : (
            <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">{item.title}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {item.publisher && (
              <span className="text-xs text-[var(--text-tertiary)]">{item.publisher}</span>
            )}
            {item.reportDate && (
              <span className="text-xs text-[var(--text-tertiary)]">{formatDate(item.reportDate)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewsPanel({ symbol }: Props) {
  const { data: raw, isLoading, error, isNotFetched, refetch } = useStockData<NewsData>(symbol, "news");
  const items = Array.isArray(raw) ? raw : [];

  return (
    <WarmCard padding="sm">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Latest News</h3>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-[var(--neutral-200)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (error || items.length === 0) && (
        <ErrorState message={error ?? "No news available"} isNotFetched={isNotFetched} onRetry={refetch} />
      )}

      {!isLoading && items.length > 0 && (
        <div>
          {items.slice(0, 10).map((item, i) => (
            <NewsCard key={item.uuid ?? i} item={item} />
          ))}
        </div>
      )}
    </WarmCard>
  );
}
