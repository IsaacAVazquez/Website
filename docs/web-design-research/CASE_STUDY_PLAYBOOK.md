# Case Study Playbook

**Last updated:** 2026-06-25
**Companion to:** `PORTFOLIO_BEST_PRACTICES.md`, `WRITING_VOICE.md`, `src/constants/caseStudies.ts`

How to write a project write-up that a skimmer keeps reading and a deep reader finds
convincing. A case study tells **two intertwined stories**: the story of the *project*
(what problem, whose, what solution, what impact) and the story of *you* (what you chose to
do and why, how you worked within constraints).

---

## The non-negotiable: hook in the first 60 seconds

Reviewers spend under a minute deciding whether to keep reading. So the top of every case
study must front-load the payoff:

1. **One-line outcome / problem** — the result or the problem solved, in plain language.
2. **Context in a sentence** — who it was for and the constraint that made it hard.
3. **Your role** — what *you* did (especially on team projects).

Never open with "First I opened Figma…" or a wall of stack logos. Lead with *why this
mattered and what changed.*

---

## Recommended structure

A reliable arc — adapt the headings to the project, but keep the order:

1. **Hook / outcome** — the result up front (see above).
2. **Context & problem** — audience, goal, constraints. What made this non-trivial?
3. **Your role & the approach** — what you owned; the method or process you chose and *why*.
4. **Key decisions** — 2–4 real forks in the road. Show the trade-off and the reasoning, not
   just the final answer. This is where *your* story lives.
5. **The solution** — the built result, shown with a few high-signal visuals (not every
   screenshot you ever made).
6. **Impact** — measurable results if you have them; before/after if you don't (see below).
7. **Reflection** — what you learned or would do differently. Short, honest, not filler.

> Follow the actual process you used (design-thinking, build-measure-learn, whatever fits) —
> a genuine method reads as more credible than a templated one.

---

## Show impact — the most powerful tool you have

Before/after evidence is the single most persuasive element of a case study.

- **Best:** real numbers. "Cut LCP from 4.1s to 1.8s," "increased completed flows 22%,"
  "reduced manual data refresh from 2h to a scheduled job." Tie the number to the change.
- **Good when you lack numbers:** before/after visuals with a sentence explaining what changed
  and why it's better.
- **Always:** connect the outcome to a decision *you* made, so the impact is attributable.

If a project genuinely has no metrics, say what you'd measure now — that itself signals
maturity.

---

## Length & scannability

- **~800–1,500 words** plus relevant visuals is plenty for most projects. Depth over volume.
- Write for the skimmer: meaningful headings, short paragraphs, bolded key takeaways,
  pull-out results. A reader should get the gist from headings alone.
- **Curate visuals:** include only the wireframes/screens/diagrams that advance the story.
  Cut the rest — extra screenshots dilute, not strengthen.

---

## Common failure modes

- **Tech-stack-first openings.** The stack is supporting detail, not the headline.
- **Process theater.** Listing every ceremony you ran without showing a real decision.
- **No "you" in it.** On team projects, ambiguity about your role reads as a red flag —
  state it explicitly.
- **Everything is a highlight.** If nothing was hard, nothing was impressive. Show at least
  one real constraint and how you handled it.
- **No outcome.** A case study that ends at "and then I shipped it" leaves the value unproven.

---

## Mapping to this site

Project content is structured data in **`src/constants/caseStudies.ts`** and rendered by the
`/portfolio` route (`src/app/portfolio/page.tsx` — *not* `ProjectsContent.tsx`). When adding
or revising an entry:

- **Card-level fields** (title, summary, stack) are the *hook* — make the title
  outcome-oriented and the summary a one-line reason to click.
- **Body content** should follow the structure above. Keep prose in `WRITING_VOICE.md` voice.
- Link the live demo and the repository wherever both exist.
- If the project is one of the curated/unverified data tools, preserve any `asOf` /
  `verified: false` disclosure conventions described in `CLAUDE.md` and
  `SNAPSHOT_DRIVEN_DASHBOARDS.md`.

Confirm the exact field shape from the current `caseStudies.ts` before writing — the type is
the contract, this playbook is the editorial intent.

---

## A one-screen template

```
# <Outcome-oriented title>

> <One line: the result, or the problem solved.>

**Context.** Who it was for and the constraint that made it hard.
**My role.** What I owned.

## The problem
<Audience, goal, why it was non-trivial.>

## Approach
<The method I chose and why.>

## Key decisions
<2–4 real forks: the trade-off and my reasoning.>

## The solution
<The built result + a few high-signal visuals.>

## Impact
<Numbers if I have them; before/after if I don't.>

## Reflection
<One honest thing I learned or would change.>
```

---

## Sources

- [How to Write UX/UI Design Case Studies That Get You Hired — IxDF](https://ixdf.org/literature/article/how-to-write-great-case-studies-for-your-ux-design-portfolio)
- [The Ultimate UX Case Study Template & Structure (2026) — UXfolio](https://blog.uxfol.io/ux-case-study-structure/)
- [How to Write UX Case Studies That Land You a Job (2026) — UX Playbook](https://uxplaybook.org/articles/ux-case-study-minto-pyramid-structure-guide)
- [How to Craft an Outstanding Case Study for Your UX Portfolio — CareerFoundry](https://careerfoundry.com/en/blog/ux-design/ux-case-study/)
- [The 27 Best UX Portfolio Examples — UXfolio](https://blog.uxfol.io/ux-portfolio-examples/)
