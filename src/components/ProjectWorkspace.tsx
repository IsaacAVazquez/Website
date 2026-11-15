"use client";

import type { ReactNode } from "react";
import "./project-workspace.css";

export function ProjectWorkspace({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="pw-root" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p className="pw-note">{description}</p>
      {children}
    </section>
  );
}

export function FollowPicker({
  options,
  ids,
  onToggle,
  label,
}: {
  options: { id: string; name: string }[];
  ids: string[];
  onToggle: (id: string) => void;
  label: string;
}) {
  return (
    <div className="pw-follow">
      <label className="pw-field">
        {label}
        <select
          aria-label={label}
          value=""
          disabled={ids.length >= 20}
          onChange={(event) => {
            if (event.target.value) onToggle(event.target.value);
          }}
        >
          <option value="">Choose to follow</option>
          {options
            .filter((item) => !ids.includes(item.id))
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </label>
      {ids.length >= 20 ? (
        <p className="pw-note">The limit is 20. Remove an item to make room.</p>
      ) : null}
      {ids.length ? (
        <ul className="pw-followed">
          {ids.map((id) => (
            <li key={id}>
              <span>
                {options.find((item) => item.id === id)?.name ??
                  `${id} (unavailable in this snapshot)`}
              </span>
              <button
                type="button"
                onClick={() => onToggle(id)}
                aria-label={`Unfollow ${options.find((item) => item.id === id)?.name ?? id}`}
              >
                Unfollow
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pw-note">
          Nothing followed yet. Choose an item above to keep it here.
        </p>
      )}
    </div>
  );
}

export function StorageNotice({ status }: { status: string }) {
  return status === "memory-only" ? (
    <p role="status" className="pw-note">
      Browser storage is unavailable. Changes will last only while this page
      stays open.
    </p>
  ) : null;
}
