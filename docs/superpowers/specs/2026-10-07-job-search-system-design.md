# Job search system design

**Date:** 2026-10-07
**Status:** Approved in conversation on 2026-10-07. Implementation on `feat/job-search-system`.

## What this is

The tracker at `/mba-internship-notifications` polled public ATS boards for internship postings and kept applications in the browser's localStorage. I am recruiting now for a full-time role starting summer 2027, so the tool has to do more than list postings. It has to source roles, score how well each one fits, tailor my résumé, fill applications for me, prepare me for interviews, and keep the whole pipeline in one place.

Three decisions shape the design. The site page stays the dashboard and Claude Code skills do the work, so there is no server-side model call and no scheduler. The repo is public, so every piece of personal data lives in a gitignored `private/job-search/` folder that the page reads through a development-only route when the site runs locally, and production keeps the public feed with localStorage exactly as before. Applying fills everything and stops before the submit button, which I click myself.

## Shape

Two halves. The in-repo half is a data contract, a local sync route, and a few dashboard additions. The skill half is five project-scoped skills under `.agents/skills/job-search/`, gitignored and symlinked from `.claude/skills/job-search` the way the repo's other skills are, that read and write the private folder.

### Private folder

```
private/job-search/
  profile.md        master résumé, bullet bank, story bank, standard application answers
  targets.json      role families, locations, title exclusions, companies to avoid, start window
  pipeline.json     the tracked applications, in the existing export wrapper
  candidates.json   sourced roles not yet promoted, with triage and fit
  inbox/            raw browser-sourcing dumps, merged by the script
  roles/<company>-<slug>/   posting, tailored résumé and PDF, cover letter, answers, prep, debriefs, screenshots
```

The pipeline reuses the export wrapper the tracker already imports and exports, so the file round-trips unchanged. The one rule for anything that edits it is to set `updatedAt` to now, because every merge keeps the newer record.

### Data model

`MBATrackedApplication` gains an optional fit reading (score 0 to 100, rationale, scored at), an applied-via label, a repo-relative materials folder, and a list of interview rounds. The six statuses stay as they were, and rounds carry the interview detail instead of new statuses, since adding statuses would ripple through the funnel, the CSV, and four test files for no information the rounds do not already hold. A new `MBAJobCandidate` holds a sourced role with a triage state of sourced, reviewed, or dismissed. A new `leadership-program` role family makes MBA rotational programs match as full-time roles, and the matcher stops reading a bare "summer" as an internship signal. Seniority filtering lives in the targets file, not the matcher, so the public feed is unchanged.

### Sync

A development-only route at `/api/job-search` reads and writes the pipeline or candidates file with the file's modification time as a revision. It returns 404 anywhere else. The applications hook keeps localStorage as its store so its synchronous API and tests stand, and in development it pulls the file on focus and every 30 seconds, merging newer-wins, and pushes after a local edit with the last seen revision. A stale push gets a 409 with the current file, merges it, and retries once. Pulls merge so nothing is lost, pushes replace only when the revision matches, and a browser delete propagates because the pushed body lacks the record.

### Dashboard

Application cards show the fit, its rationale, how the application was submitted, the interview rounds, and the materials path. The pipeline can sort by fit. A Candidates view appears only when the sync is enabled, with triage chips and promote, dismiss, and restore actions. The route keeps its URL with retitled copy, since renaming it would touch twenty-odd references for no functional gain.

### Sourcing

A script pulls the same boards the API polls, keeps the full-time matches inside the targets, drops anything already known, merges inbox files from browser sourcing, and rewrites the candidates file. The company list grows with fintech and consumer tech boards, each key verified with one request to the fetcher's endpoint before it lands. Browser sources, meaning the Haas board, Handshake, LinkedIn, and Wellfound, are a skill's job in my signed-in browser, read-only, human-paced, and capped per session.

### Skills

`source` runs the feed pass and the browser pass, then scores every unscored candidate against a point rubric (role family, level, timing, company fit, location, freshness, with disqualifiers) and promotes above thresholds the targets file sets. `materials` drafts the master profile once from the site's résumé, the Juno and Civitech write-ups, and the case studies, stops until I correct it, then tailors per role with a trace table back to the master and builds a one-page PDF through pandoc and Playwright. `apply` detects the ATS, fills from the profile, uploads the PDF, answers screening questions from the saved answers, asks me for any it cannot answer, screenshots each page, and stops at the submit button. `interview` writes a one-page prep sheet, runs a mock one question at a time, and captures a debrief into the rounds. `review` runs weekly, lists what is due, sweeps Gmail for replies, drafts follow-ups without sending, and proposes calendar events I confirm one by one.

Every skill carries the same rails. Never click Submit, Send, Pay, Accept, or Sign. Never change account settings. Stop on CAPTCHA, two-factor prompts, payment, assessment fees, background-check signatures, and requests for a Social Security number or full date of birth. Never invent facts, numbers, employers, or dates. Write only inside the private folder and the skill's own references.

## Skipped on purpose

A route rename, new statuses, a rounds editor, a route that opens materials, a server-side merge on PUT, any scheduler or loop, and a résumé Word template. Each comes back when the pain shows.
