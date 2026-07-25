# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary audience is Isaac's professional peers and network, meaning the VC, product management, MBA, and Berkeley Haas community. The typical visitor already has some reason to look him up, from a class, a talk, a referral, an article, or a search, and is deciding whether to trust his judgment and remember him as a builder worth knowing. Their job is to read how he thinks, gauge his credibility, and come away wanting to stay connected.

Recruiters and hiring managers do arrive here too, through the portfolio, resume, and MBA-recruiting pipeline, and anonymous search and AI-answer traffic lands on the writing and tools. Those are real but secondary. The site is tuned to earn a peer's respect rather than to hard-convert a recruiter.

## Product Purpose

A personal, portfolio-first site that establishes Isaac Vazquez as a credible product thinker and builder. It exists to show how he reasons rather than to advertise, through first-person writing, a portfolio of product work, and a wide body of software he actually built and maintains. Success looks like a peer leaving with genuine respect for his judgment and a concrete reason to remember him and reconnect.

## Positioning

Isaac is a working product manager with a quality-assurance-to-product path, which is an uncommon origin story, and he demonstrates his thinking in a direct, first-person, opinion-forward voice that reads like a practitioner explaining real work rather than a thought-leadership feed. His lived career arc grounds this, from civic technology at scale, to a Haas MBA, to building fintech, AI-workflow, and decision-support tools. A neighboring product-manager portfolio could copy the format, but it could not truthfully copy that voice, that career record, or the fact that the site is a live, continuously maintained system he keeps shipping into.

The breadth of working tools on the site is genuinely distinctive, but per Isaac it is personal work rather than the headline proof, so positioning leans on the thinking and the track record, not on the tool count.

## Operating Context

The site is a multi-surface Next.js system spanning a portfolio, resume, long-form writing, an investments workspace, and a large fleet of experimental dashboards and personal-utility tools. Visitors usually arrive from LinkedIn, a referral, an article, an AI answer, or search, on either desktop or mobile web, and they skim, read a piece or two, and glance at the portfolio or resume before deciding what they think of him.

A factual part of the story is that the site is not static. Many dashboards are snapshot-driven and refreshed by scheduled jobs, so "shipped and still maintained" is a real, evidenced attribute of the product rather than a claim.

## Capabilities and Constraints

The site runs on Next.js 16 (App Router) with React 19 and TypeScript, across roughly fifty routes covering the portfolio, writing, fantasy football analytics, investments and seasonal surfaces, about twenty experimental data dashboards, fintech calculators, an MBA internship tracker, and browser-persisted personal-interest tools.

Data follows a snapshot-driven pattern, where committed snapshots are read at request time with no live external calls, and refreshes fail soft by keeping the previous snapshot rather than wiping it. Personal tools persist state in the browser via localStorage. Financial tools, including the retirement planner and investments surfaces, are educational only and must keep their disclaimers and assumption disclosures intact, which is a compliance constraint, not a style choice.

Some product facts are deliberately left open here, including how prominently each surface should sit in navigation, since that is a design decision that belongs downstream rather than a fixed product truth.

## Brand Commitments

The name is Isaac Vazquez and the site lives at isaacavazquez.com.

Two constraints are locked as binding by the user. First, all prose on the site follows the first-person, direct, opinion-forward writing voice, and `WRITING_VOICE.md` is its canonical and binding specification for any copy, article, UI text, bio, or readout. Second, no "Claude," "AI," or authorship tag appears anywhere Isaac creates a name, meaning files, commits, pull requests, branches, pages, or workspaces, and git commits carry no Claude co-author or generated-by trailer.

## Evidence on Hand

The real career record lives in `src/constants/personal.ts` (the career timeline) and `src/lib/profile.ts`, covering Civitech quality and product roles from 2022 to 2025, Open Progress from 2019 to 2021, a Florida State University BA in 2018, and the UC Berkeley Haas MBA candidacy with Consortium and MLT fellowships. Those files also record specific outcome figures, including a multi-million-dollar revenue initiative, very high platform uptime, an NPS move from 23 to 36, and large defect and onboarding-time reductions. These figures are real and quotable straight from the repo, and they are intentionally not pinned as immutable here, so future work should source them from the repo as written and must never invent new numbers, claims, or credentials beyond what exists.

Product work is documented in `src/constants/caseStudies.ts`, and long-form writing lives in `content/blog/`. The case-study schema includes optional testimonial fields, and those must only ever hold real quotes from real people. There are no fabricated testimonials, customers, benchmarks, or press on hand, and future work must not manufacture any.

## Product Principles

Earn a peer's respect before chasing a recruiter's click, and optimize for credibility and memorability with the VC, product, and MBA community rather than for lead generation.

Show the thinking, so that writing and product work demonstrate how Isaac actually reasons, in his own voice, instead of summarizing or self-promoting.

Treat the tools as personal rather than as the pitch, keeping the dashboard and utility fleet credible and available without over-investing in it or staging it as the headline proof.

Never fabricate, so that every claim, metric, testimonial, and credential traces back to something real, and any absence of evidence stays an absence.

Read like a practitioner and not a thought leader, so everything sounds like a senior builder explaining real work rather than content tuned to rank.

## Accessibility & Inclusion

The site holds itself to concrete accessibility standards already enforced in the code, including a 44-pixel minimum touch target, honored reduced-motion preferences, full light and dark support, and a single page-level main landmark and h1 per page. Future work preserves these rather than treating them as optional.
