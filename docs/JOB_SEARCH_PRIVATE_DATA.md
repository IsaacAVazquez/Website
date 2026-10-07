# Job search private data

The job search tracker at `/mba-internship-notifications` is a public page on a public repo, so everything personal about my search lives in a gitignored folder, `private/job-search/`, and the page only reads it when the site runs locally. Production keeps the public feed and the browser's localStorage, unchanged. This page records the folder's contract so the code, the dump script, and the Claude Code skills that write into it stay in agreement. The field definitions are read from `src/types/mba-jobs.ts` and `src/lib/mba-applications.ts`, and when this page and the code disagree, the code wins.

## Folder layout

```
private/job-search/
  profile.md        master résumé, bullet bank, story bank, standard application answers
  targets.json      role families, locations, title terms to exclude, companies to avoid, start window
  pipeline.json     tracked applications, in the same wrapper the page's export and import use
  candidates.json   sourced roles that have not been promoted into the pipeline
  inbox/            raw browser-sourcing dumps, YYYY-MM-DD-<source>.json, merged by the dump script
  roles/<company>-<slug>/   posting.md, resume.md, resume.html, resume.pdf, cover-letter.*, answers.md, prep.md, debrief-N.md, screenshots/
```

`private/` is listed in `.gitignore`. Nothing under it is ever committed, and no file in this repo holds a copy of its contents.

## pipeline.json

The wrapper is `{ "schema": "mba-applications-export", "version": 1, "exportedAt": ISO, "applications": [] }`, which is the shape `parseMBAApplications` already accepts, so the page's import and export round-trip the file unchanged. Each application is an `MBATrackedApplication`.

| Field | Type | Meaning |
| --- | --- | --- |
| `id`, `jobId` | string, string or null | The record id and the feed job id when it came from the feed |
| `jobSnapshot` | `MBAApplicationJobSnapshot` | The job as sourced, plus `capturedAt` and `source` (`live-feed` or `manual`) |
| `status` | `saved`, `applied`, `interviewing`, `offer`, `rejected`, `archived` | Pipeline stage |
| `priority` | `low`, `medium`, `high` | Set from the fit score on promote |
| `notes`, `contact`, `sourceUrl` | string | Free text, 2,000 characters for notes and 220 for the rest |
| `followUpDate`, `deadline` | `YYYY-MM-DD` or null | Drive the attention list |
| `createdAt`, `updatedAt`, `appliedAt`, `archivedAt` | ISO or null | Timestamps |
| `fit` | `{ score, rationale, scoredAt }` or null | Score is an integer 0 to 100 |
| `appliedVia` | string | The ATS or channel used to apply |
| `materialsDir` | repo-relative path or null | The role folder, no leading slash and no `..` |
| `interviewRounds` | array of `{ label, date, outcome, notes }`, 12 max | Outcome is `scheduled`, `done`, `passed`, or `failed` |

## candidates.json

The wrapper is `{ "schema": "mba-candidates", "version": 1, "exportedAt": ISO, "candidates": [] }`. Each candidate is an `MBAJobCandidate`.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Defaults to the job id |
| `job` | `MBAApplicationJobSnapshot` | The sourced posting |
| `triage` | `sourced`, `reviewed`, `dismissed` | Unscored, scored and kept for a look, or ruled out |
| `fit` | `{ score, rationale, scoredAt }` or null | Null until scored |
| `sourcedAt`, `updatedAt` | ISO | Timestamps |

## targets.json

A plain object with no wrapper, read by `parseMBAJobSearchTargets`, which falls back to every role family and no filters when a field is missing.

| Field | Type | Meaning |
| --- | --- | --- |
| `roleFamilies` | array of role family ids | Empty means all |
| `locations` | array of strings | Case-insensitive substring match on the posting's location; empty means any |
| `excludeTitleTerms` | array of strings | Whole-token match, so `chief` does not remove `chief of staff` |
| `companiesAvoid` | array of company ids | Matched against `companyId` |
| `startWindow` | string | Free text read by the skills for the fit score's timing component; the code ignores it |
| `maxPostingAgeDays` | number | Feed postings older than this are skipped by the dump script. The default is 45, and 0 turns the cap off |

The skills also read two keys the parser ignores, `savedSearches` and `promoteThresholds`, and their meaning is documented inside the skill folder.

## The updatedAt rule

Every merge in `src/lib/mba-applications.ts` is newer wins, both for applications and for candidates. So anything that edits a record, whether the page, the dump script, or a skill, sets that record's `updatedAt` to the current time, and sets the wrapper's `exportedAt` to the same. An edit that forgets this is silently overwritten by the browser's older copy on the next sync. Writers go through a temporary file and a rename so a half-written file never lands.

## The development-only route

`src/app/api/job-search/route.ts` answers `GET` and `PUT` at `/api/job-search?file=pipeline` and `?file=candidates`. It returns 404 unless `NODE_ENV` is `development`, read inside the handler, so a production build never serves or accepts the files. `GET` returns `{ revision, items }`, with the revision being the file's modification time and `{ revision: "0", items: [] }` when the file is missing. `PUT` takes `{ revision, items }`, answers 409 with the current file when the revision is stale, and otherwise sanitizes the items through the parsers and writes the wrapper. The page's `usePrivatePipelineSync` hook pulls on mount, focus, visibility change, and every 30 seconds, and pushes shortly after a local edit, merging on 409 and retrying once.

## The dump command

```
./node_modules/.bin/tsx --env-file-if-exists=.env.local scripts/jobSearch/dumpCandidates.ts [inbox files...]
```

It reads the targets, the pipeline, and the candidates, fetches the polled boards, keeps the full-time matches inside the targets that are not already known, merges them with any inbox files passed as arguments, writes `candidates.json`, and prints counts. It is called by hand or by the sourcing skill, and it is not wired to any scheduled workflow. The path is written out because `npm run` on this machine resolves to the home folder's Node 25.

## Where the skills live

The five skills (`job-search-source`, `job-search-materials`, `job-search-apply`, `job-search-interview`, `job-search-review`) and their shared references sit in `.agents/skills/job-search/`, which is gitignored, with a tracked relative symlink at `.claude/skills/job-search` matching the repo's other skill entries. The skill text holds no personal data; everything personal is in `private/`.

## Rails

The skills never click Submit, Send, Pay, Accept, or Sign, never change account settings or passwords, write Gmail drafts only, and create calendar events only after a per-event yes. They stop on CAPTCHA, two factor prompts, payment, assessment fees, background-check signatures, and any request for a Social Security number or full date of birth. One application per apply run, 150 browser actions, sourcing capped at 3 result pages and 25 postings per source and 60 per session, no parallel tabs, no retries on a 429. Writes go to `private/job-search/` and the skills' own references only. They never invent facts, numbers, employers, or dates, and unknowns become `[ASK ISAAC]`.
