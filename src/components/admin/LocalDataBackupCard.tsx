"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ModernButton } from "@/components/ui/ModernButton";
import {
  createLocalDataBackup,
  restoreLocalDataBackup,
} from "@/lib/localDataBackup";

export function LocalDataBackupCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function exportData() {
    try {
      const backup = createLocalDataBackup(window.localStorage);
      const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `site-data-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(`Exported ${Object.keys(backup.entries).length} saved data entries.`);
    } catch {
      setMessage("The browser blocked access to saved data, so I could not export it.");
    }
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const result = restoreLocalDataBackup(
        window.localStorage,
        JSON.parse(await file.text()) as unknown
      );
      setMessage(
        `Restored ${result.restoredKeys.length} saved data entries. Reload the relevant tool to see them.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The backup could not be restored.");
    }
  }

  return (
    <article className="c97-panel md:col-span-2">
      <p className="c97-kicker">Browser data</p>
      <h2 className="c97-serif c97-h3" style={{ marginTop: "var(--c97-sp-1)" }}>
        Export or restore saved tool data
      </h2>
      <p
        className="c97-prose"
        style={{ marginTop: "var(--c97-sp-1)", marginBottom: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}
      >
        This covers fantasy queues and drafts, MBA tracking, investments,
        retirement, budgets, travel, wine, museums, recipes, and deal alerts saved
        in this browser. The file does not include sign-in or unrelated site data.
      </p>
      <div className="flex flex-wrap gap-3">
        <ModernButton type="button" variant="primary" size="sm" onClick={exportData}>
          Export saved data
        </ModernButton>
        <ModernButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Restore from file
        </ModernButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={importData}
        />
      </div>
      {message ? (
        <p role="status" className="c97-prose" style={{ marginTop: "var(--c97-sp-3)", color: "var(--c97-ink-2)" }}>
          {message}
        </p>
      ) : null}
    </article>
  );
}
