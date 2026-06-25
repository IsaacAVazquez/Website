# Web Design & Portfolio Research

**Last updated:** 2026-06-25

A research-backed reference for the design and content decisions on this site. These
notes synthesize current (2026) web-design and portfolio best practices and translate
them into concrete, opinionated guidance for **this** portfolio — a portfolio-first
Next.js site with secondary authority-building content.

> These docs are *advisory research*, not normative spec. When they conflict with the
> implemented system, the implemented system wins. The site-wide visual rules live in
> `STYLING.md`; the single pre-merge gate is `DESIGN_CHECKLIST.md`; accessibility status
> lives in `ACCESSIBILITY_AUDIT.md`. Use these research notes to decide *what* to build;
> use those docs to decide *how* it must look and pass review.

## The four documents

| File | What it covers | Use it when |
| --- | --- | --- |
| [`WEB_DESIGN_TRENDS_2026.md`](./WEB_DESIGN_TRENDS_2026.md) | Current visual/UX direction — typography, layout, motion, dark mode, AI/ambient UI — filtered for what's worth adopting here | Considering a visual refresh or a new surface's look |
| [`PORTFOLIO_BEST_PRACTICES.md`](./PORTFOLIO_BEST_PRACTICES.md) | Portfolio strategy — homepage/hero, about, project selection, CTAs, personal branding, what hiring managers actually scan | Editing the homepage, about, portfolio, or contact surfaces |
| [`CASE_STUDY_PLAYBOOK.md`](./CASE_STUDY_PLAYBOOK.md) | How to write a project case study that converts — structure, storytelling, length, showing impact | Writing or revising entries in `src/constants/caseStudies.ts` |
| [`PERFORMANCE_ACCESSIBILITY.md`](./PERFORMANCE_ACCESSIBILITY.md) | Core Web Vitals (LCP/INP/CLS) and WCAG 2.2 targets, with the highest-leverage fixes | Auditing speed/a11y, or shipping any new data dashboard |

## How these connect to the existing docs

- **Visual tokens & shell helpers** → `STYLING.md` (source of truth for color, type scale,
  editorial shell). Research here never overrides a token rule.
- **Pre-merge gate** → `DESIGN_CHECKLIST.md`. Every UI change still runs that checklist.
- **Accessibility ground truth** → `ACCESSIBILITY_AUDIT.md`.
- **SEO** → `SEO.md` (current reference; older root-level audits are historical).
- **Copy/voice** → `WRITING_VOICE.md`. Any hero/about/case-study copy these docs suggest
  must conform to the voice guide.

## The five-second summary

1. **Portfolio-first.** Lead with proof of work; everything else is supporting cast.
2. **Three deep case studies beat eight shallow ones.** Each should show a different skill.
3. **One clear hero, one primary CTA.** The visitor should know who you are and what to do
   within five seconds, no scroll required.
4. **Fast and accessible are table stakes,** not polish — LCP < 2.5s, INP < 200ms, CLS < 0.1,
   WCAG 2.2 AA.
5. **Personality through typography and editorial restraint,** not gimmicks. The site already
   has a distinctive editorial system — lean into it rather than chasing trends.
