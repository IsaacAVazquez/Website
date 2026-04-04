# About Page Writing Voice Revision

**Date:** 2026-04-03  
**Scope:** `src/components/About.tsx`, `src/components/ui/AuthorBio.tsx`, `src/app/about/page.tsx`

## Context

Isaac is no longer employed at Civitech. He is a full-time MBA Candidate at UC Berkeley Haas. All About page copy needs to reflect this current framing and comply with `WRITING_VOICE.md`: first-person, direct, no em dashes, no corporate buzzwords.

---

## Section 1: `About.tsx` — OverviewContent paragraphs

Replace all 6 paragraphs in `OverviewContent` (lines ~131–162):

**P1:**
> I'm a full-time MBA Candidate at UC Berkeley Haas with a background in QA and analytics. Before business school, I spent six years building products across SaaS and civic technology.

**P2:**
> What a QA background actually teaches you is to distrust your own assumptions. I don't write product requirements by imagining how users will behave. I look at what the system is doing, find where the gaps are, and work from there. I'm comfortable with automation, SQL, and APIs, and I lean on them because they keep my product decisions connected to how things actually work rather than how I imagine they do. Data is how I check my assumptions and make measurement legible to the people doing the work, not a substitute for judgment.

**P3:**
> Right now I'm building investment research and fintech tools because I'm genuinely curious about how product design and decision support come together. That curiosity is why I ended up in product work in the first place, and it's what keeps me building things outside of class.

**P4:**
> Before business school, I ran client services at Open Progress, managing 80+ digital programs and building the data pipelines that made campaign analytics actually useful to the people running them.

**P5:**
> I'm at Haas to sharpen the strategy side of product work while I continue to build things I find interesting. Those two things are related.

**P6** (styled `font-medium text-[var(--text-primary)]`):
> I'm most interested in products at the intersection of analytics, trust, and clear user decision-making.

Also update the `SectionIntro` title (line ~38):
- Current: `"A product manager with roots in QA, analytics, and execution."`
- Revised: `"An MBA candidate with roots in QA, analytics, and product execution."`

---

## Section 2: `AuthorBio.tsx` — default props

**`title` default** (line ~29):
- Current: `"Technical Product Manager & UC Berkeley Haas MBA Candidate"`
- Revised: `"UC Berkeley Haas MBA Candidate"`

**`bio` default** (line ~31):
- Current: `"Product manager with 6+ years across SaaS and high-scale consumer platforms, currently pursuing MBA at UC Berkeley Haas. Building mission-driven products that balance user insight, data-driven decisions, and cross-functional collaboration."`
- Revised: `"I'm a full-time MBA Candidate at UC Berkeley Haas with a background in QA and product work across SaaS and civic technology. I build investment research and fintech tools on the side because I'm genuinely interested in how product design and decision support come together in practice."`

---

## Section 3: `about/page.tsx` — metadata fields

**`description`:**
- Revised: `"Full-time MBA Candidate at UC Berkeley Haas with a background in QA, analytics, and product work across SaaS and civic technology."`

**`summary`:**
- Revised: `"MBA Candidate at UC Berkeley Haas with six years across SaaS and civic technology product and quality work."`

**`author.title`:**
- Revised: `"UC Berkeley Haas MBA Candidate"`

**`person.jobTitle`:**
- Revised: `"UC Berkeley Haas MBA Candidate"`

**`person.description`:**
- Revised: `"MBA Candidate at UC Berkeley Haas with a background in QA and product work. Builds investment research and fintech tools focused on analytics, trust, and user decision-making."`
