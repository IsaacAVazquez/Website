---
target: "route:/writing/[slug]"
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/isaacvazquez/Website/route:/writing/[slug]"
timestamp: 2026-09-14T19-48-31Z
slug: route-writing-slug
closed: true
---
Method: dual-agent (A: design review subagent · B: computed-value sweep subagent), synthesized in the parent, with an adversarial refuter on every P0 and P1. Run 2026-09-14 against the dev server on main at ecd6517d, before remediation.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Breadcrumb, active Writing nav, dateline and reading time are present. The code Copy button changes its text to "Copied", but the label is nearly invisible and the change is never announced. |
| 2 | Match system / real world | 3 | Plain byline and dateline. Previous and Next run on publish date across every topic, so a PM note's Next is a Formula 1 recap, and nothing says the order is chronological. |
| 3 | User control and freedom | 3 | Breadcrumb, a topic kicker link and "Back to writing" give clear exits. At 390 the breadcrumb squeezes the topic into a 50px column three lines tall. |
| 4 | Consistency and standards | 2 | Arriving from the Catalog 97 index changes the header, and the same destinations change names. The generated card hero uses Inter, a gradient and 36px corners. Tag chips look interactive and do nothing. |
| 5 | Error prevention | 3 | No input to get wrong. The risk is misleading affordances, from inert tag chips, to a copy button nobody can see, to code blocks at 390 that overflow by up to 197px behind a thin scrollbar. |
| 6 | Recognition rather than recall | 3 | Topic, related pieces and the author are visible. The longer posts have no heading anchors or in-page navigation, which is minor at 3 to 5 minutes. |
| 7 | Flexibility and efficiency | 2 | No heading anchors, no copy-link control, and the one accelerator (copy code) can't be seen. |
| 8 | Aesthetic and minimalist design | 2 | The hero repeats the h1 on generated-card posts, the kicker repeats the breadcrumb topic, and five separate what-next blocks with 18 links follow the body. |
| 9 | Error recovery | 2 | Missing slugs call `notFound()` and rely on the global boundary, with no per-route `error.tsx`. |
| 10 | Help and documentation | 2 | Who the author is arrives only at the end, in a muted 14px bio. The top byline has a name and a date but no role. |
| Total | | 25/40 | Acceptable (62.5%) |

## Design Specificity Verdict

LLM assessment. The reading view is mostly a standard blog template with Working Instrument tokens applied. Breadcrumb, kicker, headline, avatar byline, dek, tag chips, a 16:9 hero, prose, a related grid, an author box, prev and next, and a back link is the default shape of a Ghost or Medium post, and nothing in it is specific to a writer whose pitch is watching how he reasons. The parts that do carry this writer are the related-tool CTA plate, which on the Spa and investment posts points at a dashboard he built, and the Wikimedia credit line. The generated social card works against specificity, because on the PM, AI and fintech pieces the audience cares about most, the most visible element is a gradient card that repeats the headline in another visual system.

Deterministic scan. `impeccable detect` exited 2 with 18 findings across the three surfaces in this run, and none of them is a rendered defect on this route. Seven are design-system-font-size advisories in `src/app/writing/[slug]/page.tsx` (the h1 clamp and the 0.85rem meta, for example), and one is a broken-image warning in `src/app/writing/[slug]/__tests__/page-content.test.tsx:13`, a test fixture that never ships. No DEGRADED banner printed. The detector caught none of the issues below, which came from source reads, captures and driven states.

Visual overlays. No user-visible overlay is available. Injection was blocked by the site's enforcing CSP, which fired a securitypolicyviolation on script-src-elem. The computed-value sweep is the fallback signal. Its contrast gate reproduced 16.29:1 in light and 15.28:1 in dark, it found no horizontal page overflow at 390 and one main and one h1 on every sampled article, and its driven states measured the copy button, the headshots and the not-found metadata described below.

## Overall Impression

On a photo post the first screen is composed and confident, and the related-tool plate is the best idea on the page. The reading itself is where the page loses. Body text starts below the fold, it is set smaller and greyer than the dek, and on two thirds of the archive the space above it holds a generated social card instead of the argument. Photo alt text often describes something that is not in the photo. The single biggest opportunity is to drop the generated card as an in-page hero and let the first paragraph reach the first screen, since that one change touches 139 posts.

## What's Working

The photo cover treatment is honest editorial practice when the photo is right. It uses a license-safe Commons file, a hairline plate and a visible credit that links to the file page, which fits PRODUCT.md's never-fabricate principle.

The related-tool CTA plate (`page.tsx:327-354`) turns a piece into evidence. "Open Formula 1 Pulse" and "Open the Investment Research Platform" link a post to a thing he built, which no template would offer.

The structural basics hold. The sweep measured one h1 and one main, no horizontal page scroll at 390 in either theme, the contrast gate at 16.29:1 light and 15.28:1 dark, underlined in-body links, and a visible focus ring on the copy button.

## Priority Issues

[P1] Cover alt text does not describe the image on the page.
Alt text is written into `scripts/data/articleCoverImages.ts` before any image is fetched and then copied into frontmatter whatever the top Commons result turns out to be. A checked two covers, and the refuter widened the sample. Of 57 fetched covers, 30 carry a blind fallback alt, and 13 of 20 sampled covers did not match their alt, several of them showing the wrong subject entirely, like the Spa post's "Formula 1 cars racing at Spa-Francorchamps" over a satellite view of forest and track. A screen reader user hears a claim the page does not support, which breaks PRODUCT.md's never-fabricate principle.
Fix: rewrite each `coverImageAlt` against the fetched file, drop or replace covers whose subject is wrong, and have the builder in `docs/ARTICLE_IMAGE_WORKFLOW.md` hold a new alt for human review until someone has looked at the file.
Suggested command: /impeccable harden

[P1] The generated social card renders as the in-page hero on 139 of 206 posts.
Posts without a photo fall back to `/writing/<slug>/opengraph-image`, and `page.tsx:281-291` renders it as the hero. That card comes from `src/lib/og.tsx` with Inter, a cobalt, teal or amber gradient and 36px corners, which DESIGN.md rules out on this world. Its alt falls back to the post title, so a screen reader hears the h1 twice, and a sighted reader sees it twice. The refuter confirmed the count at 139 of 206 and measured the body starting at 1186px on a 1440 viewport and 980px at 390, so the first screen has no argument in it. These are the PM, AI and fintech pieces a product peer is most likely to open.
Fix: in `page.tsx:281-317`, render the hero only when the cover is a real photo (skip it when `post.coverImage` ends in `/opengraph-image`) and keep the OG route for metadata. A hairline rule under the dek is enough of an anchor.
Suggested command: /impeccable distill

[P2] Body type sits below the system's own reading spec.
`#article-body` inherits Tailwind Typography's 16px, and `globals.css:505-509` sets paragraphs to `--home-ink-muted` with a 65ch cap, about 85 characters a line at 1440. DESIGN.md's body token is `clamp(1.02rem, 1.16rem)` on a roughly 40rem measure, and the dek at 18.56px in near-ink outranks the essay it introduces. On a site whose product is the thinking, the essay reads as secondary text.
Fix: under `.prose-writing`, set the body to the DESIGN.md clamp, mix paragraph colour toward ink the way `.home-body` does, cap the measure at 40rem, and recheck that the 24px h2 still steps up.
Suggested command: /impeccable typeset

[P2] Five separate what-next blocks with 18 links follow the body.
The ending is split across a CTA plate, a three-card related grid, the author box, prev and next cards and a back link, and then the site footer adds its own contact block. Prev and next can repeat a related card, and the related heading ("If this piece was useful, these should stack on top of it.") reads like a template. The decision point after the last paragraph has well over four options.
Fix: gather the ending into one block with one next piece, one line about who he is and one way to reach him, and keep the related-tool plate where a post has one.
Suggested command: /impeccable distill

[P2] The code copy button label measured 1.06:1 and "Copied" is never announced.
`ArticleCodeCopy.tsx:59-61` sets `color: var(--home-paper)` on a 14% paper tint, which assumes a dark code block, but the block is `--home-paper-alt`. The sweep measured the label at 1.06:1, the button at 49 by 29.5px, and no live region, with `aria-label` staying "Copy code to clipboard" after the text changes. The refuter set it at P2, and 6 of 206 posts have code.
Fix: ink text on paper with a rule border and 2px radius, a visually hidden `role="status"` node that says "Copied", a 44px target, and top padding on the block so the button stops covering code at 390.
Suggested command: /impeccable harden

## Persona Red Flags

A Haas or product peer arriving from LinkedIn opens a PM or fintech piece and meets the headline twice, once as the h1 and once as a gradient social card, before any prose, which starts at 1186px. The byline has no role, so the reason to trust him arrives only in a muted bio at the end, whose last sentence ("I write to work through ideas, not to summarize them.") uses the negative-parallelism shape WRITING_VOICE.md bans.

Sam (screen reader, keyboard) hears the title read twice on generated-card posts, hears alt text describing racing cars over a satellite photo on the Spa post, gets no announcement when code is copied, and meets 16 by 16 social icon links in the author box, well under the 44px floor PRODUCT.md says the site holds.

Casey (390, one hand) scrolls past a 980px header before the first sentence, side-scrolls code blocks with 551px of content in a 354px box behind an 8px scrollbar, and spends roughly the last third of a 7,459 to 8,315px page on related cards, the bio, prev and next, and the footer.

Jordan (first-timer) sees tag chips that change border on hover but are not links, and a Next link after a QA guide that points to a fantasy football primer, with nothing saying the order is by date.

## Minor Observations

[P3] The article header names Work and Résumé as Projects and Resume. `catalog97Nav.ts` says "Work" and "Résumé" while `navlinks.tsx:27` says "Projects" and "Resume", so one route gets two names across the index-to-article click. A rated this P1 together with the world change, and the refuter set the label mismatch at P3.

[P3] The byline and AuthorBio headshots render at 56 by 83. `/images/headshot-home.webp` is 64 by 96, both `next/image` instances set 56 by 56, and an unlayered `img{height:auto}` beats the height attribute, so `rounded-full` draws an oval.

[P3] Missing-post and missing-topic metadata merged the root `index, follow` into the page after hydration while the server head carried noindex. HTTP 404 stayed intact, so crawler impact was nil, and the finding is about the client head disagreeing with the server one.

The kicker repeats the breadcrumb topic about 60px below it. At 390 the breadcrumb `ol` has no `flex-wrap`, so "Sports & Fantasy" stacks into three lines. The 51px h1 at -0.04em tracking makes letters touch in "Fantasy Football". Byline date and reading time are sans where DESIGN.md's readout convention is Fragment Mono with tabular figures. The author box and related cards carry resting shadows against the Flat-By-Default Rule. Body h2s are title case, and whether the sentence-case rule reaches article section headings is left as a question for Isaac.

A did not load a bad slug, zoom to 200%, or run a screen reader. No post has a Markdown table or an inline image, so that CSS was never rendered.

## Questions to Consider

If the writing is where Isaac shows his thinking, why does the reading view look less authored than the Catalog 97 index that lists it, and should an article open in that world with the Working Instrument kept for tools?

Would the PM and AI pieces be stronger with no hero at all, so the first thing a peer sees after the headline is his first sentence?

What would a reader lose if everything after the last paragraph became one block, with one next piece he chose, one line about who he is, and one way to reach him?
