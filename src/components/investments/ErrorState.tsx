"use client";

import { Info, RefreshCw, TriangleAlert } from "lucide-react";
import { ModernButton } from "@/components/ui/ModernButton";

interface ErrorStateProps {
  message: string;
  isNotFetched?: boolean;
  onRetry?: () => void;
}

export function ErrorState({ message, isNotFetched, onRetry }: ErrorStateProps) {
  return (
    // Polite rather than an alert: several research panels can fail at once
    // (offline, say), and a burst of assertive announcements helps no one.
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      {isNotFetched ? (
        <Info
          size={32}
          style={{ color: "var(--c97-label)" }}
          aria-hidden="true"
        />
      ) : (
        <TriangleAlert
          size={32}
          style={{ color: "var(--c97-negative)" }}
          aria-hidden="true"
        />
      )}

      <p
        className="text-sm max-w-xs"
        style={{ color: isNotFetched ? "var(--c97-label)" : "var(--c97-negative)" }}
      >
        {message}
      </p>

      {onRetry && (
        <ModernButton
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Retry
        </ModernButton>
      )}
    </div>
  );
}
