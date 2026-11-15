# Job search private data

The job search tracker at `/mba-internship-notifications` is a public page on a public repo, so everything personal about my search lives in a gitignored folder, `private/job-search/`, and the page only reads it when the site runs locally through `npm run dev`. Production keeps the public feed and the browser's localStorage, unchanged. This page records the folder's contract so the code, the dump script, and the Claude Code skills that write into it stay in agreement. The field definitions are read from `src/types/mba-jobs.ts` and `src/lib/mba-applications.ts`, and when this page and the code disagree, the code wins.

## Folder layout

```
private/job-search/
  profile.md        master résumé, bullet bank, story bank, standard application answers
  targets.json      role families, locations, title terms to exclude, companies to avoid, start window, posting age cap
  pipeline.json     tracked applications, in the same wrapper the page's export and import use
  candidates.json   sourced roles that have not been promoted into the pipeline
  .write.lock       present only while a writer holds the save lock, described under the development-only route
  inbox/            raw browser-sourcing dumps, YYYY-MM-DD-<source>.json, merged by the dump script when named on its command line
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
| `priority` | `low`, `medium`, `high` | Defaults to `medium`. The page's Save to pipeline button on a candidate leaves it as it is and copies the candidate's fit, and the sourcing skill sets it from the fit score when it promotes |
| `notes`, `contact` | string | Free text, 2,000 characters for notes and 220 for contact |
| `sourceUrl` | string | An http or https URL, which falls back to the posting's apply URL when it is missing or invalid |
| `followUpDate`, `deadline` | `YYYY-MM-DD` or null | Drive the attention list, which leaves out archived records and counts a deadline only while the status is `saved`. A date that is not on the calendar, such as February 30, reads as null |
| `createdAt`, `updatedAt`, `appliedAt`, `archivedAt` | ISO, and only `appliedAt` and `archivedAt` can be null | Timestamps |
| `fit` | `{ score, rationale, scoredAt }` or null | Score is an integer 0 to 100 |
| `appliedVia` | string | The ATS or channel used to apply |
| `materialsDir` | repo-relative path or null | The role folder, for example `private/job-search/roles/acme-pm`, with no leading slash, no `..`, at most 220 characters, and nothing but letters, digits, spaces, `_`, `.`, `/`, and `-` |
| `interviewRounds` | array of `{ label, date, outcome, notes }`, 12 max | Outcome is `scheduled`, `done`, `passed`, or `failed`, and anything else reads as `scheduled`. A round without a label is dropped. Read-only on the dashboard |
| `facts` | array of `{ label, value }`, 12 max | Posting facts to reference on the card, such as base pay, work arrangement, program length, close date. Read-only on the dashboard |
| `statusHistory` | array of `{ status, at, kind }` | Dated status records. `changed` records a change in the dashboard; `observed` preserves a status from an imported or older record without claiming its transition date |

## candidates.json

The wrapper is `{ "schema": "mba-candidates", "version": 1, "exportedAt": ISO, "candidates": [] }`. Each candidate is an `MBAJobCandidate`. The page's Save to pipeline button adds a candidate to the pipeline, or updates the application that already matches it, and removes it from this file with the same click.

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Defaults to the job id |
| `job` | `MBAApplicationJobSnapshot` | The sourced posting |
| `triage` | `sourced`, `reviewed`, `dismissed` | Unscored, scored and kept for a look, or ruled out. The page's Restore button moves a dismissed candidate back to `reviewed` |
| `fit` | `{ score, rationale, scoredAt }` or null | Null until scored |
| `sourcedAt`, `updatedAt` | ISO | Timestamps |

## targets.json

A plain object with no wrapper, read by `parseMBAJobSearchTargets`, which falls back to every role family, no location, title, or company filters, and the 45-day posting age cap when a field or the whole file is missing. A file that is not valid JSON gets the same defaults, and the dump script carries on with them instead of stopping.

| Field | Type | Meaning |
| --- | --- | --- |
| `roleFamilies` | array of role family ids from `MBA_ROLE_FAMILIES` in `src/constants/mba-role-taxonomy.ts` | Unknown ids are dropped, and an empty list, or one with no known id left, means all |
| `locations` | array of strings | Case-insensitive whole-word match on the posting's location, so `CA` does not match `Canada` and `SF` does not match `San Francisco`; empty means any |
| `excludeTitleTerms` | array of strings | Case-insensitive whole-word phrase match on the title, so `chief product officer` removes Chief Product Officer and leaves Chief of Staff, while `chief` alone would remove both |
| `companiesAvoid` | array of company ids | Matched against `companyId` |
| `startWindow` | string | Free text read by the skills for the fit score's timing component; the code ignores it |
| `maxPostingAgeDays` | number | Feed postings older than this are skipped by the dump script, and a posting with no readable date is kept. The default is 45, and 0 turns the cap off |

The skills also read two keys the parser ignores, `savedSearches` and `promoteThresholds`, and their meaning is documented inside the skill folder.

## The updatedAt rule

The dashboard records status changes and merges known history from both copies of an application. Pipeline rates count archived applications too, and they read the stages recorded in this history, interview rounds, and applied dates, though an archived record's applied date alone does not count it as submitted, since it cannot say whether it heard back. Older records without that evidence rely on their current status. Since the history has no way to remove an event, a move back to an earlier stage reads as a correction, and the later stages and any rejection it walked back stop counting. Scheduled interview rounds dated today through six days ahead appear in the seven-day agenda unless the application is archived, rejected, or at offer, and for a record with a `materialsDir` the agenda can copy the path of its `prep.md` for use in a local editor.

Every merge in `src/lib/mba-applications.ts` is newer wins, both for applications and for candidates. So anything that edits a record, whether the page, the dump script, or a skill, sets that record's `updatedAt` to the current time, and sets the wrapper's `exportedAt` to the same. An edit that forgets this is silently overwritten by the browser's older copy on the next sync. Writers go through a temporary file and a rename so a half-written file never lands.

## The development-only route

`src/app/api/job-search/route.ts` answers `GET` and `PUT` at `/api/job-search?file=pipeline` and `?file=candidates`. I start it through `npm run dev`, whose launcher (`scripts/dev.cjs`) binds to `localhost` and turns private sync on for that listener. An explicit hostname override turns it off, including `npm run dev -- --hostname 0.0.0.0`, and so does an inherited `JOB_SEARCH_PRIVATE_SYNC=0`, which is how Playwright starts its server outside CI (in CI it runs `npm run start`, where the route is a 404 anyway). Starting Next directly also leaves it off. The launcher passes the same setting to the page as `NEXT_PUBLIC_JOB_SEARCH_PRIVATE_SYNC`, so in any other dev server the tracker runs on localStorage alone, as it does in production, and never calls the route. The route requires both development mode and the launcher's flag, validates the raw Host header, and rejects an unrelated Origin. Production returns 404. The route has no authentication of its own, so using it over a network would need one added first.

`GET` returns `{ revision, items }`, with an opaque SHA-256 revision calculated from the bytes read, or `{ revision: "0", items: [] }` when the file is missing. A file that is not valid JSON makes both methods fail with an error naming it, so a hand edit that breaks the file is never read as empty and replaced. A concurrent rename cannot pair old contents with a new revision. `PUT` takes `{ revision, items }`, requires an array of valid, unique records, and returns 400 without writing when the envelope or records are invalid. An explicit empty array clears the selected file, and the page sends one only after its last application or candidate is removed, since a browser whose storage was cleared pulls the pipeline file back instead of pushing its empty copy. A stale revision returns 409 with the current file. The page's `usePrivatePipelineSync` hook pulls on mount, focus, visibility change, and every 30 seconds while the tab is visible, and pushes shortly after a local edit, merging on 409 and retrying once. The candidates hook, `useMBAJobCandidates`, pulls on the same schedule but keeps no local copy to merge, so on a 409 it replays the page's edit on the server's copy and retries once, which keeps a candidate removed in the page removed.

API saves and the sourcing script share `private/job-search/.write.lock`. Each writer holds it only during its synchronous read, revision check, and atomic replacement. A competing writer waits briefly, then reports that the files are busy without changing them (the route answers 503), and the error names the lock and the process ID recorded in it. A lock left by a process that was killed while holding it is removed by the next writer once that process is gone and the lock is two seconds old.

## The dump command

```
./node_modules/.bin/tsx --env-file-if-exists=.env.local scripts/jobSearch/dumpCandidates.ts [inbox files...]
```

It reads the targets and fetches the board of every company in `src/constants/mba-companies.ts` whose `atsType` is not `manual`, plus Adzuna's external leads when `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are set. When the fetch still reports an error after the script asks again up to 24 times, it prints the errors and exits without writing. Otherwise it acquires the write lock and reads the latest pipeline and candidates. It keeps the full-time matches inside the targets that are not already known, merges them with any inbox files passed as arguments, writes `candidates.json`, and prints how many roles came from the feed and from the inbox, the new total, and the boards that failed. An inbox file has the same shape as `candidates.json`, either the wrapper or a bare array of candidates, and one that is not valid JSON adds nothing. Decisions saved in the page while the boards were being fetched survive this final merge for roles from the feed. Inbox entries skip the check against known roles, and each one merges by its own `updatedAt`, with an undated entry counting as new, so an inbox file that names a role already in the pipeline adds it back to the candidates, and one that names a triaged candidate replaces that triage. A pipeline or candidates file that is not valid JSON stops the run before anything is written. It is called by hand or by the sourcing skill, and it is not wired to any scheduled workflow. The path is written out because `npm run` on this machine resolves to the home folder's Node 25.

## Where the skills live

The five skills (`job-search-source`, `job-search-materials`, `job-search-apply`, `job-search-interview`, `job-search-review`) and their shared references sit in `.agents/skills/job-search/`, which is gitignored, and are reached through a relative symlink at `.claude/skills/job-search`. Since 2026-10-20 (commit 76e5118ed) `.gitignore` lists `.claude/skills/` too, so that link is local like the repo's other skill links, and a fresh clone has neither the skills nor the link. The skill text holds no personal data; everything personal is in `private/`.

## Rails

The skills never click Submit, Send, Pay, Accept, or Sign, never change account settings or passwords, write Gmail drafts only, and create calendar events only after a per-event yes. They stop on CAPTCHA, two factor prompts, payment, assessment fees, background-check signatures, and any request for a Social Security number or full date of birth. One application per apply run, 150 browser actions, sourcing capped at 3 result pages and 25 postings per source and 60 per session, no parallel tabs, no retries on a 429. Writes go to `private/job-search/` and the skills' own references only. They never invent facts, numbers, employers, or dates, and unknowns become `[ASK ISAAC]`.
