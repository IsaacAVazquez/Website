"use client";

import { useEffect, useRef, useState } from "react";
import {
  FollowPicker,
  ProjectWorkspace,
  StorageNotice,
} from "@/components/ProjectWorkspace";
import { useBrowserRecord } from "@/hooks/useBrowserRecord";
import {
  isSourceUrl,
  parseFollowedIds,
  toggleFollowedId,
} from "@/lib/personalFollowing";
import { prefixedId } from "@/lib/utils";
import type { TechStartup, TechStartupSnapshot } from "@/types/techStartup";
import {
  appendResearchRound,
  COMPANY_RESEARCH_KEY,
  FOLLOWED_COMPANIES_KEY,
  parseCompanyResearch,
  type CompanyResearchRecord,
} from "./companyResearch";

const money = (value: number | null) =>
  value === null
    ? "Amount undisclosed"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);

export function CompanyResearch({
  snapshot,
}: {
  snapshot: TechStartupSnapshot;
}) {
  const followed = useBrowserRecord(FOLLOWED_COMPANIES_KEY, parseFollowedIds);
  const research = useBrowserRecord(COMPANY_RESEARCH_KEY, parseCompanyResearch);
  const [activeId, setActiveId] = useState("");
  const companies = snapshot.startups.filter((company) =>
    followed.value.includes(company.id),
  );
  const active =
    companies.find((company) => company.id === activeId) ?? companies[0];
  return (
    <ProjectWorkspace
      id="company-research"
      title="Your company research"
      description="Follow up to 20 companies, keep notes, and collect dated funding announcements with source links. Your research stays in this browser."
    >
      <FollowPicker
        label="Follow a company"
        options={snapshot.startups}
        ids={followed.value}
        onToggle={(id) =>
          followed.update((latest) => toggleFollowedId(latest, id))
        }
      />
      {active ? (
        <>
          <label className="pw-field">
            Research company
            <select
              aria-label="Research company"
              value={active.id}
              onChange={(event) => setActiveId(event.target.value)}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <CompanyResearchForm
            key={active.id}
            company={active}
            record={research.value.find((item) => item.id === active.id)}
            update={research.update}
          />
          <p className="pw-note">
            The catalog round uses the catalog&apos;s {snapshot.asOf} review.
            Additional rounds and their source links are entered by you and are
            personal research.
          </p>
        </>
      ) : null}
      <StorageNotice
        status={
          followed.status === "memory-only" ? followed.status : research.status
        }
      />
    </ProjectWorkspace>
  );
}

function CompanyResearchForm({
  company,
  record,
  update,
}: {
  company: TechStartup;
  record?: CompanyResearchRecord;
  update: (
    edit: (latest: CompanyResearchRecord[]) => CompanyResearchRecord[],
  ) => CompanyResearchRecord[];
}) {
  const [noteDraft, setNotes] = useState<string | null>(null);
  const notes = noteDraft ?? record?.notes ?? "";
  const [message, setMessage] = useState("");
  const hadRecord = useRef(false);
  useEffect(() => {
    if (record) hadRecord.current = true;
  }, [record]);
  return (
    <>
      <form
        className="pw-list"
        onSubmit={(event) => {
          event.preventDefault();
          let saved = false;
          update((latest) => {
            const current = latest.find((item) => item.id === company.id);
            if (hadRecord.current && !current) return latest;
            if (!current && latest.length >= 20) return latest;
            const next = {
              id: company.id,
              notes,
              rounds: current?.rounds ?? [],
            };
            saved = true;
            return current
              ? latest.map((item) => (item.id === company.id ? next : item))
              : [...latest, next];
          });
          setMessage(
            saved
              ? "Notes saved."
              : "The record was deleted in another tab or the 20-company limit was reached. Reload to start a new record, or delete an older one to make room.",
          );
        }}
      >
        <label className="pw-field">
          Research notes
          <textarea
            maxLength={4000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <div className="pw-actions">
          <button type="submit">Save notes</button>
          <button
            type="button"
            onClick={() => {
              update((latest) =>
                latest.filter((item) => item.id !== company.id),
              );
              setNotes("");
              hadRecord.current = false;
              setMessage("Personal notes and rounds deleted.");
            }}
          >
            Delete personal research
          </button>
        </div>
      </form>
      <h3>Funding timeline for {company.name}</h3>
      <ul className="pw-list">
        {[
          {
            id: "catalog",
            date: company.lastRound.date,
            stage: company.lastRound.stage,
            amount: company.lastRound.amount,
            sourceUrl: company.lastRound.sourceUrl,
            personal: false,
          },
          ...(record?.rounds ?? []).map((round) => ({
            ...round,
            personal: true,
          })),
        ]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((round) => (
            <li key={round.id}>
              <p>
                {round.date} · {round.stage} · {money(round.amount)} ·{" "}
                {round.personal ? "Your research" : "Catalog round"}
              </p>
              <div className="pw-actions">
                {isSourceUrl(round.sourceUrl) ? (
                  <a
                    className="pw-source"
                    href={round.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read announcement
                  </a>
                ) : (
                  <span className="pw-note">No source link in the catalog</span>
                )}
                {round.personal ? (
                  <button
                    type="button"
                    aria-label={`Delete ${round.stage} round on ${round.date}`}
                    onClick={() =>
                      update((latest) =>
                        latest.map((item) =>
                          item.id === company.id
                            ? {
                                ...item,
                                rounds: item.rounds.filter(
                                  (r) => r.id !== round.id,
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  >
                    Delete round
                  </button>
                ) : null}
              </div>
            </li>
          ))}
      </ul>
      <form
        className="pw-fields"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const amountText = String(data.get("amount") ?? "").trim();
          const round = parseCompanyResearch(
            JSON.stringify([
              {
                id: company.id,
                notes: "",
                rounds: [
                  {
                    id: prefixedId("round"),
                    stage: data.get("stage"),
                    date: data.get("date"),
                    amount: amountText ? Number(amountText) : null,
                    sourceUrl: String(data.get("source") ?? "").trim(),
                  },
                ],
              },
            ]),
          )[0]?.rounds[0];
          if (!round) {
            setMessage(
              "Enter a round name, a real date, a valid amount or blank, and an https source link.",
            );
            return;
          }
          let saved = false;
          update((latest) => {
            if (
              hadRecord.current &&
              !latest.some((item) => item.id === company.id)
            )
              return latest;
            const next = appendResearchRound(latest, company.id, round);
            saved = next !== latest;
            return next;
          });
          setMessage(
            saved
              ? "Funding round saved."
              : "The limit is 30 rounds per company and 20 research records.",
          );
          if (saved) event.currentTarget.reset();
        }}
      >
        <label className="pw-field">
          Round name
          <input name="stage" maxLength={80} required placeholder="Series B" />
        </label>
        <label className="pw-field">
          Announcement date
          <input name="date" type="date" required />
        </label>
        <label className="pw-field">
          Round amount in USD (blank if undisclosed)
          <input name="amount" type="number" min={0} max={1e12} step="0.01" />
        </label>
        <label className="pw-field">
          Announcement source link
          <input
            name="source"
            type="url"
            maxLength={1500}
            required
            placeholder="https://"
          />
        </label>
        <button type="submit">Add funding round</button>
      </form>
      <p role="status" className="pw-note">
        {message}
      </p>
    </>
  );
}
