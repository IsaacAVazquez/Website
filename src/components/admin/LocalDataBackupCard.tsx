"use client";

import { useRef, useState, type ChangeEvent } from "react";
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
    <article className="home-card p-6 md:col-span-2">
      <p className="home-kicker mb-2">Browser data</p>
      <h2 className="mb-2 text-xl font-semibold">Export or restore saved tool data</h2>
      <p className="mb-4 text-sm leading-6 text-[var(--home-ink-muted)]">
        This covers fantasy queues and drafts, MBA tracking, investments,
        retirement, budgets, travel, wine, museums, recipes, and deal alerts saved
        in this browser. The file does not include sign-in or unrelated site data.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportData}
          className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--home-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--home-paper)]"
        >
          Export saved data
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--home-rule)] bg-[var(--home-paper-alt)] px-5 py-2.5 text-sm font-semibold text-[var(--home-ink)]"
        >
          Restore from file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={importData}
        />
      </div>
      {message ? (
        <p role="status" className="mb-0 mt-4 text-sm text-[var(--home-ink-muted)]">
          {message}
        </p>
      ) : null}
    </article>
  );
}
