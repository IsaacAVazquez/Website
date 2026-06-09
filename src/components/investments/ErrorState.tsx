"use client";

import { IconAlertTriangle, IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { ModernButton } from "@/components/ui/ModernButton";

interface ErrorStateProps {
  message: string;
  isNotFetched?: boolean;
  onRetry?: () => void;
}

export function ErrorState({ message, isNotFetched, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      {isNotFetched ? (
        <IconInfoCircle
          size={32}
          style={{ color: "var(--home-ink-soft)" }}
          aria-hidden="true"
        />
      ) : (
        <IconAlertTriangle
          size={32}
          style={{ color: "var(--color-error)" }}
          aria-hidden="true"
        />
      )}

      <p
        className="text-sm max-w-xs"
        style={{ color: isNotFetched ? "var(--home-ink-soft)" : "var(--color-error)" }}
      >
        {message}
      </p>

      {onRetry && (
        <ModernButton
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          <IconRefresh size={16} aria-hidden="true" />
          Retry
        </ModernButton>
      )}
    </div>
  );
}
