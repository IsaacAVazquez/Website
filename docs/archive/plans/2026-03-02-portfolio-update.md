> [!IMPORTANT]
> Historical reference only. This file captures an older implementation plan and is not a current source of truth by itself. Use `AGENTS.md`, `CLAUDE.md`, `README.md`, `PAGES.md`, `COMPONENTS.md`, and `docs/README.md` for current documentation.

# Portfolio Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Investment Analytics Platform to Featured Work and strip the Fantasy Football placeholder to a minimal card.

**Architecture:** Two targeted edits to `src/constants/caseStudies.ts`. The `/portfolio` page reads directly from this file — no other files need touching.

**Tech Stack:** TypeScript, Next.js App Router

---

### Task 1: Promote Investment Analytics to Featured

**Files:**
- Modify: `src/constants/caseStudies.ts` — `investment-analytics-platform` entry

**Step 1: Make the change**

In `caseStudiesData["investment-analytics-platform"]`, change:
```ts
featured: false,   // if present, or just missing
```
to:
```ts
featured: true,
```

(The field may not currently exist — just add `featured: true,` alongside the other top-level fields.)

**Step 2: Verify the page renders correctly**

```bash
npm run dev
```

Open `http://localhost:3000/portfolio` and confirm "Investment Analytics Platform" now appears under **Featured Work** (top grid) alongside the three existing featured projects.

**Step 3: Commit**

```bash
git add src/constants/caseStudies.ts
git commit -m "feat: promote investment analytics platform to featured portfolio work"
```

---

### Task 2: Strip Fantasy Football Placeholder to Minimal

**Files:**
- Modify: `src/constants/caseStudies.ts` — `fantasy-football-analytics` entry

**Step 1: Replace the entry with a minimal version**

Replace the entire `fantasy-football-analytics` object with:

```ts
"fantasy-football-analytics": {
  slug: "fantasy-football-analytics",
  title: "Fantasy Football Analytics Platform",
  description: "Full-stack fantasy football platform with live tier rankings, D3 visualizations, and automated data pipeline.",
  role: "Solo Builder",
  timeline: "2024–2025",
  tools: ["Next.js", "D3.js", "TypeScript", "SQLite"],
  metrics: "Live platform · 2026 season coming soon",
  github: "https://github.com/IsaacAVazquez",
  link: "/fantasy-football",
  featured: false,
  comingSoon: true,

  // Required by CaseStudyData interface — kept minimal
  overview: { summary: "", impact: "" },
  problem: { context: "", painPoints: [], stakes: "" },
  process: { approach: "", methodology: [], decisions: [] },
  result: { outcomes: [], lessonsLearned: [] },
  userSegments: [],
  northStarMetric: "",
  tradeoffs: [],
  retrospective: "",
},
```

**Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors related to `fantasy-football-analytics` (the interface requires those fields, so they must be present even if empty).

**Step 3: Verify the portfolio page**

Confirm the FF card still shows in the "More Work" section with the "Coming Soon" badge, a short description, and a "View Live Platform" link. No verbose placeholder text should appear.

**Step 4: Commit**

```bash
git add src/constants/caseStudies.ts
git commit -m "chore: strip fantasy football placeholder to minimal content"
```
