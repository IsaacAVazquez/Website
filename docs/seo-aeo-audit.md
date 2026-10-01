# AEO and SEO audit

Audited and reconciled July 23, 2026. Re-audited July 30, 2026. Both passes predate the 2026-09-16 move to the Catalog 97 shell, so treat this as a point-in-time record (status note added 2026-09-21). The September 24 and September 30 reviews below check the live site and local metadata respectively.

## October 1, 2026 internal link pass

I added links between related articles, and from articles to the tools they discuss, across 53 articles. Each added sentence says plainly what the linked page is, and I left out any that would have described a tool as doing something it does not do. The Decision Lab scores product bets on impact, confidence, effort, and reversibility, so it is not described as an agent governance model, and the Frontier Models tracker lists context windows and pricing, so it is not credited with benchmarks or latency data. Dated recaps keep their as-of framing, which means a January piece does not report how the season ended. I removed two question-and-answer sections and a processor fee table whose rates had no source.

Every added link points at a live route or a published article, and the sitemap is regenerated. Articles whose body changed carry a September 30 update date, which is when the edits were made.

## September 30, 2026 local audit

I reviewed the 305 URLs in the current sitemap and the 244 published articles, then concentrated the copy changes on the 65 articles in PM Workflows, Agentic AI, Fintech Product & Pricing, and Systems & Quality. Before this pass, the shared title helper clipped 57 of those search titles, and the description helper shortened 44 descriptions. I rewrote the metadata in 61 articles so every professional-topic title and description fits the existing limits as a complete thought. The four remaining articles already had suitable metadata. These titles are distinct, include the subject of the article, and leave room for the site name.

I also changed six visible article summaries to explain agentic AI, context engineering, model evaluation, retrieval augmented generation, product evaluation, and agent costs directly. The summaries keep my first-person framing and describe what the article actually explains. Those six articles carry a September 30 update date, which reaches the visible header, Article schema, RSS, and sitemap. The article bodies and publication dates stay intact.

Every article byline now links to `/about` with `rel="author"`. Article schema also names its canonical page through `mainEntityOfPage` and connects to the existing WebSite identity through `isPartOf`. I kept the existing crawler policy. Google's [guidance for generative search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) describes crawlability, useful content, and accurate markup as the foundation, and says no special structured data is required for these results.

The production build, lint, TypeScript check, and focused metadata, schema, article, and sitemap tests passed. A crawl of the local production server checked all 305 sitemap pages. Each returned 200, had one `h1`, a self-referencing canonical, a description, and parseable JSON-LD, with no duplicate titles or descriptions. All 244 writing pages contained the article body and author profile link in the server HTML, and their Article schema named the same canonical URL as the page. Browser checks at 360 and 1280 pixels passed in both themes, with no horizontal overflow, an author link larger than the 44 pixel minimum, and working navigation to the profile. The revised evaluation summary and article body also rendered with JavaScript disabled. These checks cover the local build; this pass has not deployed the changes or measured search traffic or answer-engine citations.

The remaining archive articles still use the shared fitting helpers, and the factual conflicts recorded in the September 24 review below still need editorial work. This pass improves search presentation and visible summaries without resolving those claims.

## September 24, 2026 re-audit

I re-ran the July crawl against the live site on September 24, 2026, parsing the raw HTML a crawler receives before any JavaScript runs. All 268 URLs then in the sitemap returned 200 with self-referencing canonicals and structured data that parses, and all 206 writing pages carried Article schema with the `/about#person` author, both dates, and the full article body in the server HTML. What had broken since July, or was never covered, is below. The `<article>` fix, the Job Search deadline, and the first nine sourced articles shipped in `645441c2`, which deployed the same night, and each part below says where the rest stands.

### What changed on the site

The writing template lost the `<article>` element around each post in `46d8bd40` on September 22. That left the three related-post teasers as the only `<article>` elements on the page, so any extractor that looks for one found a teaser instead of the post. The hero and body share one `<article>` again in `src/app/writing/[slug]/page.tsx`, and `page-content.test.tsx` checks that the title and body sit inside it with the related posts outside. After the deploy, all 206 live writing pages have the body inside it.

Job Search sometimes served only its loading skeleton, a 200 with no `h1` and no structured data. On a cold function instance, or once its 30-minute cache expired, the page waited for a live scrape of every job board before rendering. In production those responses were cut off 18 to 27 seconds in, before the page's content arrived, and I didn't confirm what ended them. In one cold burst all 10 concurrent requests came back cut off, and the next burst came back complete in about a second. `getMBAJobsData` in `src/lib/mbaJobsServer.ts` now waits at most five seconds. Past that it serves the most recent result for the same request, marked stale, and keeps the refresh running through `after()`. That fallback copy includes partial results, which matters because production results are usually partial (the Atlassian board fails) and the existing last-good copy never stored those. It's held in memory, and the code also writes it to the durable store under `mba-jobs-served/`, though that write does nothing in production, for the reason below. After the deploy, 30 of 30 cold-burst responses were complete with an `h1` and both structured-data blocks. Fresh instances still render without job records, though, because the durable copy never loads. The store's gate in `src/lib/durableJsonCache.ts` checks for `NETLIFY=true`, which Netlify sets only during builds, since functions get only `URL`, `SITE_NAME`, and `SITE_ID` at runtime. Every durable read and write has been a no-op in production since that file landed on July 20. On September 25, 27 of 30 cold requests rendered without records and the `runtime-last-good` store was empty. The same gate sits in `src/lib/snapshotBlobStore.ts`, whose `dashboard-snapshots` store was also empty, and the second-pass audit on September 26 found the scheduled polling and frontier-model refreshes in Netlify's function logs throwing the "writeSnapshotBlob requires the Netlify runtime" error. The runtime heartbeats on `/api/data-revisions` also read as unavailable, but they go through the same gate, so they agree with this without proving it independently. Two route tests cover the slow-refresh and cold paths.

193 of 206 articles linked no outside source. Build notes and opinion pieces don't need one, since I am the source, but the race reports and the Signals & Commentary pieces make claims anyone can check. A sourcing pass read those 42 articles and wrapped existing phrases in links to primary sources, meaning official results, government releases, company announcements, filings, and museum or standards-body pages, without changing any wording. Every link was opened and checked against its claim before it went in, though that check didn't compare the source's date with the article's. With the four described below taken back out, 28 articles carry 51 new links across 48 distinct URLs, each has `updatedAt` set to 2026-09-24, and a script confirmed that removing the new links leaves every body identical to its prior version. Seven race reports and two market pieces shipped in `645441c2`, and the other 19 shipped in PR #469, merged September 27. That PR also carried links for four more articles that the second-pass audit had flagged, because their links pointed to pages published after the article's own date, which puts a publish-date error on display. Those are GPT-5.1, DevDay 2025, the SpaceX IPO case, and the week of March 22, and the change that adds this section takes their links back out, dated September 27, until their publish dates are settled. The remaining 10 either had nothing third-party to source or were held back for the conflicts below.

### Conflicts the sourcing pass found

The same pass turned up claims that their primary sources contradict. None of these claims were changed, because each change alters what an article says. Thirteen of these articles did get new links on other claims, though, so they carry the September 24 update date while the conflict stands, and the links column shows which. Each row is a lead with its source to check, and I confirmed the British and Monaco rows myself against the official classification.

| Article | What the article says | What the source says | Links added | Source |
| --- | --- | --- | --- | --- |
| 2026 British Grand Prix | Antonelli finished sixteenth, and Verstappen crashed with four laps to go | Antonelli was 15th and Bottas 16th, and Verstappen retired after 46 of 52 laps | No | [Race classification](https://www.formula1.com/en/results/2026/races/1289/great-britain/race-result) |
| 2026 Monaco Grand Prix | The stewards rescinded Gasly's penalties and third place is under appeal | The final classification keeps both penalties, with Hadjar 3rd and Gasly 7th | No | [Race classification](https://www.formula1.com/en/results/2026/races/1286/monaco/race-result) |
| 2026 Chinese Grand Prix | Hamilton finished a place behind his teammate, Antonelli took a sprint penalty, and Verstappen retired in the closing laps | Hamilton was 3rd and Leclerc 4th in the race, the sprint penalty note names only Perez, and Verstappen retired after 45 of 56 laps | Live | [Race classification](https://www.formula1.com/en/results/2026/races/1280/china/race-result), [sprint results](https://www.formula1.com/en/results/2026/races/1280/china/sprint-results) |
| Hyperscaler capex 2025 | Meta raised the top of its capex range | Meta narrowed the range to $66 to 72 billion from $64 to 72 billion, raising the bottom | Live | [Meta Q2 2025 release](https://investor.atmeta.com/investor-news/press-release-details/2025/Meta-Reports-Second-Quarter-2025-Results/default.aspx) |
| Hyperscaler capex 2025 | Microsoft reported more than $30 billion of capex in one quarter | The June 2025 quarter was $24.2 billion, and over $30 billion was guidance for the next quarter | Live | [Microsoft FY25 Q4](https://www.microsoft.com/en-us/investor/events/fy-2025/earnings-fy-2025-q4) |
| Markets and AI, mid-May 2026 | Magnificent Seven earnings growth came in around the mid-twenties | FactSet's May 4 note shows 61.0% on GAAP earnings with large one-time gains, and 27.1% for the S&P 500 | Live | [FactSet](https://insight.factset.com/three-magnificent-7-companies-push-sp-500-earnings-growth-to-highest-level-since-2021) |
| Is the AI mega-cap rally a bubble | Growth of 6 percent rather than the 23 percent the group posted | Both figures are FactSet's pre-season estimates, and the actual result was 63.2% | Live | [FactSet estimates](https://insight.factset.com/excluding-nvidia-mag-7-companies-expected-to-report-lower-earnings-growth-than-other-493), [FactSet result](https://insight.factset.com/mag-7-and-other-493-sp-500-companies-are-reporting-highest-earnings-growth-since-2021) |
| AI capex versus the real economy | Estimates run toward AI investment driving the majority of growth in the most recent quarters, figures the article says to hold loosely | The St. Louis Fed puts AI investment at 30% of Q2 2025 growth and 11% of Q3, and only Q1, when GDP shrank 0.6% while AI added 1.3 points, fits a majority | No | [St. Louis Fed](https://www.stlouisfed.org/on-the-economy/2026/jan/tracking-ai-contribution-gdp-growth) |
| SpaceX IPO case | $350 billion in the most recent tender, with an IPO not imminent | A December 2025 secondary sale valued SpaceX at $800 billion, and the S-1 was filed May 20, 2026 | Removed | [CNBC](https://www.cnbc.com/2025/12/13/musk-spacex-insider-share-sale-sets-800-billion-valuation.html), [S-1](https://www.sec.gov/Archives/edgar/data/1181412/000162828026036936/spaceexplorationtechnologi.htm) |
| Week of April 6 tariffs | The S&P 500 fell about 4.5% over four sessions after broad new tariffs, and China retaliated | The S&P 500 rose that week, the only proclamations covered pharmaceuticals and metals, and no 2026 Chinese retaliation turned up, so the events don't match that week | No | [FRED S&P 500](https://fred.stlouisfed.org/series/SP500) |
| Week of March 23 to 30 | The February jobs report, the housing figures, Mullin's nomination, and several executive orders that week | The jobs report came out March 6, the housing figures are January's, Mullin was confirmed March 23, and none of the orders it names were signed that week, since the housing orders were March 13 and the fraud task force March 16 | Live | [Jobs report](https://www.bls.gov/news.release/archives/empsit_03062026.htm), [Senate vote](https://www.senate.gov/legislative/LIS/roll_call_votes/vote1192/vote_119_2_00063.htm), [fraud task force order](https://www.federalregister.gov/documents/2026/03/19/2026-05497/establishing-the-task-force-to-eliminate-fraud) |
| Tech job market splitting | Early-stage venture deployment is down materially from 2021 | The Q4 2025 Venture Monitor puts early-stage activity near its 2021 highs | No | [PitchBook-NVCA](https://nvca.org/wp-content/uploads/2026/01/q4-2025-pitchbook-nvca-venture-monitor.pdf) |
| Week in tech, March 22 | Grok 4.20 arrived around March 22, MCP reached 97 million installs, and a judge had blocked the Anthropic designation | Grok 4.20 went live March 10, 97 million is monthly SDK downloads reported in December 2025, and the injunction came March 26, after the article's date, as did OpenAI's March 24 Sora API notice | Removed | [xAI release notes](https://docs.x.ai/developers/release-notes), [court order](https://www.govinfo.gov/content/pkg/USCOURTS-cand-3_26-cv-01996/pdf/USCOURTS-cand-3_26-cv-01996-1.pdf) |
| AI infrastructure and geopolitics | Google cut inference memory 6x, and Mythos 5 had launched | TurboQuant cuts key-value cache memory 6x, and Mythos 5 is dated June 9, 2026, after the article | Live | [Google Research](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/), [Anthropic](https://www.anthropic.com/claude/mythos) |
| AI signals, mid-February 2026 | An Opus release was expected | Claude Opus 4.6 shipped February 5, ten days before the article | Live | [Anthropic](https://www.anthropic.com/news/claude-opus-4-6) |
| Week of April 6, AI coding tools | A recent o3 price cut, and Copilot Workspace in use | The o3 price cut was June 2025, and Copilot Workspace shut down May 30, 2025 | Live | [OpenAI changelog](https://developers.openai.com/api/docs/changelog), [GitHub Next](https://githubnext.com/projects/copilot-workspace/) |
| A history of horology | The Scilly wreck prompted the Longitude Act, and 1967 was the first break from Earth's rotation | Royal Museums Greenwich finds no evidence of an outcry, and NIST says the second moved to Earth's orbit in 1960 | Live | [Royal Museums Greenwich](https://www.rmg.co.uk/stories/time/what-made-search-longitude-so-important), [NIST](https://www.nist.gov/si-redefinition/second/second-past) |
| Companies and watches that shaped horology | The Royal Oak was requested and designed in 1972 | It was requested in 1970, the first case order came May 19, 1971, and it launched April 15, 1972 | Live | [Audemars Piguet](https://apchronicles.audemarspiguet.com/en/article/birth-of-an-icon) |
| GPT-5.1 and the release treadmill | Published November 9, saying GPT-5.1 shipped this week | GPT-5.1 was announced November 12, 2025 | Removed | [OpenAI](https://openai.com/index/gpt-5-1/) |
| OpenAI DevDay 2025 | Published October 5, saying DevDay happened this week | The DevDay announcements are dated October 6, 2025 | Removed | [OpenAI](https://openai.com/index/introducing-agentkit/) |
| iPhone 17 AI strategy | Apple acknowledged the Siri delay earlier in the summer | Apple's statement came March 7, 2025 | Live | [CNBC](https://www.cnbc.com/2025/03/07/apple-delays-siri-ai-improvements-to-2026.html) |
| CES 2026 | Snapdragon X Plus 2 | Qualcomm names the chip Snapdragon X2 Plus | Live | [Qualcomm](https://www.qualcomm.com/news/releases/2026/01/empowering-professionals-and-aspiring-creators--snapdragon-x2-pl) |
| AI talent war, summer 2025 | The Thinking Machines offers had already landed and several co-founders had signed | The $1.5 billion offer was reported in August, after the July 20 article, and one co-founder left, in October | Live | [TechCrunch](https://techcrunch.com/2025/10/11/thinking-machines-lab-co-founder-andrew-tulloch-heads-to-meta/) |

### What the same-day SEO pass covered

A separate SEO pass on the same day took four of the findings. The trade calculator had served crawlers an empty page because its client read the URL on a statically rendered route, and it now renders per request with an `h1` and its structured data in the live HTML. That change also exposed a second `BreadcrumbList` coming from the shared breadcrumb component, which the best ball draft tracker had been shipping too, with a trail that disagreed with its page's own, so the component now renders only the visible trail. The weekly board and waivers rendered only a hero on the server while their rankings loaded in the browser, and they now seed one scoring format's rankings from `weekly.json` on the server. Live since PR #469 deployed on September 27, they serve 1,767 and 691 words of page text, up from 49 and 67, counting the main content and its streamed sections without the header and footer. `public/llms.txt` now carries a September 24 review date, the Agent Build Index link on the canonical domain, the dashboards hub and the newer tools, and all seven topic pages. The PR also drops the `twitter.com/isaacvazquez` profile link from the Person schema and the Twitter card tags, since x.com showed no such profile on September 24. The weekly and waivers work, the breadcrumb change, the `llms.txt` rewrite, and the profile-link removal all shipped in PR #469, merged September 27. That day's production crawl found all 269 sitemap pages returning 200 with no duplicate breadcrumbs and no trace of the old handle.

### Crawler access and the audit tooling

I left the crawler policy alone. OpenAI's and Anthropic's own crawler documentation, read on September 24, says GPTBot and ClaudeBot only collect training data, and that search visibility runs through OAI-SearchBot, Claude-SearchBot, and Claude-User, which `public/robots.txt` allows. Requests carrying each retrieval bot's user agent got a 200, while GPTBot and ClaudeBot got a Cloudflare 403, which matches the policy. Cloudflare identifies real crawlers by more than their user agent, though, so the retrieval bots' setting in Cloudflare's AI Crawl Control still needs a look in the dashboard.

The `aeo` skill's audit script graded 204 of 206 articles F, and I didn't treat that as evidence. Run on the MDX source it never sees the structured data the template adds, and in its URL mode a live article scored 81 instead. Either way it scores by counting pattern matches, and 420 of its 488 "credential" matches in the MDX were the word "do". Its optimizer appends numbered citation markers with no source behind them and a placeholder corrections footer, so it should never run on `content/blog`.

## Summary

I checked the finished implementation against every item in the original audit brief, then rebuilt and crawled the production application rather than relying on source inspection alone. The final crawl covered all 249 sitemap URLs, 18 control and legacy URLs, 8,504 rendered internal links, 209 distinct social images, and all 196 published writing pages. Every indexable URL returned 200 with a unique title and description, a self-referencing canonical, complete social metadata, one `h1`, one page-level `main`, valid JSON-LD, and no broken internal links.

The July 30 re-audit rebuilt the application and independently crawled all 249 sitemap URLs, 107 additional internal route targets, 209 social images, and all 196 writing pages. It found zero errors or warnings after adding BreadcrumbList schema to `/arcade` and `/portfolio`. Google Search Console ownership is now verified for both `isaacvazquez.com` and the retired `isaacavazquez.com` domain through Cloudflare DNS. The new sitemap is submitted, Google's live URL test says the homepage is available and indexable, the rendered test output carries the `isaacvazquez.com` canonical and complete Person and WebSite schema, and the homepage is in Google's priority crawl queue.

The formal Change of Address request is the one pending external signal. Its separate validator could not fetch `http://isaacavazquez.com/`, even though Google's live URL test and independent HTTP checks both receive the permanent redirect to `https://isaacvazquez.com/`. The redirect implementation is correct, so this should be retried after Google's property and redirect caches refresh.

The original baseline had two high-severity findings, four medium-severity findings, and three low-severity findings. All nine are fixed. The reconciliation also caught six omissions from the first implementation, including the exact `/admin` robots rule, redirect chains on retired project URLs, the promised article-date validation guard, stale modification dates on changed tools, inaccurate social-image dimensions, and two heading-level skips. Those are fixed too.

No required repository-local corrective work remains from the original brief. Historical Search Console performance data is still processing, while production crawl logs, backlinks, third-party mentions, and external entity profiles remain outside this repository.

## Stack and rendering model

| Item | What is in the repository | Evidence |
| --- | --- | --- |
| Framework | Next.js 16 with the App Router | `package.json`; `src/app/` |
| Rendering | A mix of static generation and dynamic server rendering, with client hydration for interactive tools | The production build generated 310 application pages, including 196 statically generated writing pages |
| Content | MDX files for writing and changelog content, TypeScript snapshots for data products, and route components for tools | `content/blog/`; `content/changelog/`; `src/data/`; `src/app/` |
| Deployment | Netlify through `@netlify/plugin-nextjs` | `netlify.toml:16` |
| Shared metadata | Next.js Metadata API through a repository helper | `src/lib/seo.ts:118` |
| Sitemap | Repository-generated XML based on route inventory, content dates, and snapshot revisions | `src/lib/sitemap.js:391`; `scripts/generatePublicSitemap.mjs` |

## Final production verification

| Check | Final result |
| --- | --- |
| Sitemap URLs | 249 of 249 returned 200 |
| Initial HTML | News Pulse headlines and Job Search records were present before hydration |
| Internal discovery | 8,504 internal links checked, 249 unique route targets, no broken targets, no redirecting links, and no orphan sitemap pages |
| URL hygiene | No tracking parameters, uppercase paths, or trailing-slash variants in rendered internal links |
| Titles | No missing, duplicate, or over-60-character titles |
| Descriptions | No missing, duplicate, or over-160-character descriptions |
| Canonicals | No missing or incorrect canonicals on indexable pages |
| Social metadata | Complete Open Graph and Twitter metadata on every indexable page |
| Social images | 209 distinct images returned 200 with an image content type and actual dimensions of 1200 by 630 |
| Language and icons | Every page rendered `lang="en"` with favicon, touch icon, and manifest links |
| Headings and landmarks | Every indexable page rendered one `h1`, one page-level `main`, and no heading-level skips |
| Images and links | No image lacked an `alt` attribute and no vague anchor remained; empty alternatives were limited to decorative hidden graphics |
| JSON-LD | Every block parsed, every writing page had one complete Article object, and all 249 sitemap pages had BreadcrumbList schema |
| Freshness | No future sitemap dates, all writing pages displayed a date, and all 37 migrated articles carried the July 20 modification signal |
| Error handling | The test URL returned 404 with an independent title, `noindex`, and no canonical |
| Redirects | Canonical route families and all ten retired project paths redirected directly to their final destination |
| Cache policy | Rendered HTML included `Netlify-CDN-Cache-Control: no-store` through `src/proxy.ts:88` |

## Crawlability and indexing

The crawl policy is deliberate. Public search and answer retrieval are allowed, including Google-Extended because Gemini visibility was an explicit goal. Training crawlers remain blocked. The exact admin path, API routes other than RSS, framework internals, and dependencies are excluded in every public crawler group at `public/robots.txt:4` through `public/robots.txt:56`.

| Crawler | Policy | Intent |
| --- | --- | --- |
| OAI-SearchBot and ChatGPT-User | Public pages allowed | ChatGPT retrieval |
| Claude-SearchBot and Claude-User | Public pages allowed | Claude retrieval |
| PerplexityBot and Perplexity-User | Public pages allowed | Perplexity retrieval |
| Google-Extended | Public pages allowed | Gemini grounding and other generative uses |
| GPTBot, ClaudeBot, CCBot, Applebot-Extended, Meta-ExternalAgent, Amazonbot, and cohere-ai | Blocked | Model training and broad collection are not part of the visibility goal |

Google documents that Google-Extended controls Gemini training and grounding uses without changing Google Search ranking or eligibility for Google Search AI features. The implemented policy follows that distinction in `public/robots.txt:36`. The supporting source is Google's [crawler documentation](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers#google-extended).

The sitemap contains every indexable canonical route and excludes `/search`, `/analytics-reference`, and `/admin`, which all render `noindex`. Modification dates come from content frontmatter, interface revision dates, or data snapshot revisions rather than the build timestamp. Future-dated writing stays out of the sitemap.

The retired project mappings now precede the wildcard project redirect at `next.config.mjs:11` through `next.config.mjs:62`, so those URLs do not bounce through `/portfolio/[slug]`. The rendered site contains no links to redirecting paths.

## Page metadata

The shared helper at `src/lib/seo.ts:98` budgets the writing and portfolio title before the brand is added, strips trailing punctuation before an ellipsis, and keeps the rendered title at or below 60 characters. Descriptions are normalized and capped at 160 characters at `src/lib/seo.ts:108`. The rendered crawl found no missing or duplicate title, description, canonical, Open Graph set, or Twitter set.

Writing pages now use their generated 1200 by 630 route card for Open Graph and Twitter metadata at `src/app/writing/[slug]/page.tsx:56`. Licensed cover photos remain visible in the article and remain part of Article schema, but the metadata no longer claims that differently sized cover files are 1200 by 630.

The root layout sets the English language, manifest, favicon, touch icon, and RSS discovery at `src/app/layout.tsx:52` through `src/app/layout.tsx:75`. There is one supported locale, so no alternate language version is advertised. The self-referencing `en-US` alternate is generated by the shared helper at `src/lib/seo.ts:221`.

The admin metadata now has its own title, description, canonical, and `noindex, nofollow` policy at `src/app/admin/layout.tsx:4`. The 404 has an independent title and description, returns a real 404, renders `noindex`, and omits its canonical at `src/app/not-found.tsx:4`.

## Structured data

The site has Person and WebSite identity schema with a consistent `Isaac Vazquez` entity and `/about` identifier at `src/components/StructuredData.tsx:41`. All 196 writing pages render one Article object with headline, author, `datePublished`, `dateModified`, image, canonical entity URL, language, keywords, and word count through `src/app/writing/[slug]/page.tsx:112`.

Every indexable page renders BreadcrumbList schema. The score-pools tracker and settings gaps from the baseline are resolved with BreadcrumbList and WebPage objects at `src/app/score-pools/tracker/page.tsx:26` and `src/app/score-pools/settings/page.tsx:26`. The July 30 pass completed the same coverage on `/arcade` and `/portfolio`. FAQ schema remains limited to pages with visible question-and-answer content. I did not add broad FAQPage or HowTo markup where the page does not genuinely fit those types.

The production parser found no invalid JSON-LD, no missing required Article field, and no sitemap page without breadcrumbs.

## Content for answer engines

The writing template renders one title, a visible author, published and updated dates, a direct summary before the article body, semantic `article` markup, breadcrumbs, topic links, related posts, and chronological navigation. The relevant template starts at `src/app/writing/[slug]/page.tsx:181`, with visible update handling at `src/app/writing/[slug]/page.tsx:237`.

News Pulse and Job Search now place bounded primary records in the server response through `src/lib/newsPulseServer.ts:290` and `src/lib/mbaJobsServer.ts:1138`. Their route components fetch those functions directly at `src/app/news-pulse/page.tsx:25` and `src/app/mba-internship-notifications/page.tsx:30`, while the clients still handle filtering and refresh after hydration.

The two claim-heavy articles identified in the baseline now cite official vendor announcements and pricing pages next to checkable claims, carry explicit as-of framing, and use descriptive internal anchors. The fact check also corrected one AWS timing sentence from early 2026 to mid-2026. I did not force tables of contents onto all long pieces because the current summary, descriptive sections, breadcrumbs, and related links provide clean extraction without adding a generic navigation block to every essay.

The rendered crawl found no vague `here`, `click here`, `read more`, or `learn more` anchors. It also found no heading skip after correcting the Resume and World Cup group-card hierarchy.

## Freshness and content hygiene

All 37 writing files introduced in the July 20 migration preserve their original publication date and now carry `updatedAt: "2026-07-20"`. That value reaches the visible article header, Metadata API, Article schema, sitemap, and RSS Atom update field. Across the 196 published articles, 51 now have an explicit update date and none predates publication.

The substantive edit guard at `scripts/checkBlogDateReview.ts:90` compares article body text against the pull request base and fails when a meaningful body edit does not include an `updatedAt` review. The test workflow fetches history and runs the guard before the unit suite in `.github/workflows/test.yml`.

Interface revisions for News Pulse, Job Search, Score Pools, Resume, Changelog, and World Cup now use July 23 or a newer underlying snapshot date in page metadata and the sitemap. The final crawl found no future modification date and no writing page without a visible machine-readable date.

## AI-specific extras

`public/llms.txt` exists and points to the canonical sitemap and RSS feed. I would keep treating it as optional agent-readiness documentation, not a citation or ranking control. The higher-value signals are the initial HTML, evidence links, schema, canonicals, consistent identity, and trustworthy dates.

RSS discovery is wired in the root layout at `src/app/layout.tsx:75`. The feed uses canonical item URLs and emits an Atom update value from `updatedAt` or `publishedAt` at `src/app/api/rss/route.ts:41`.

IndexNow verification is published at the root through `public/9f7d1a8c2fca455871c1520aaeb5753c.txt`. The bounded submission command at `scripts/submitIndexNow.mjs` reads the generated sitemap, rejects noncanonical hosts and non-HTTPS URLs, enforces the protocol's 10,000-URL ceiling, and submits the canonical set to participating search engines after deployment through `npm run submit:indexnow`.

## Baseline findings and resolution

| Severity | Baseline finding | Resolution |
| --- | --- | --- |
| High | Thirty-seven migrated articles exposed only old publication dates | Added truthful July 20 update dates across visible HTML, metadata, schema, sitemap, and RSS |
| High | News Pulse and Job Search omitted primary records from initial HTML | Moved shared data reads to server-callable functions and hydrated clients with bounded initial records |
| Medium | Branded titles exceeded the intended budget and could end on dangling text | Added full rendered-title budgeting, explicit short titles, and regression tests |
| Medium | Google-Extended was blocked despite the Gemini visibility goal | Allowed public retrieval while preserving private-route exclusions |
| Medium | Two fact-heavy articles lacked enough primary-source support | Added official citations, as-of framing, and one timing correction |
| Medium | Substantive article updates lacked a consistent modification-date process | Added visible updates and a pull request guard |
| Low | Score-pools child routes lacked structured data | Added BreadcrumbList and WebPage schema |
| Low | The 404 inherited homepage identity | Added independent metadata, `noindex`, and no canonical |
| Low | Three links used vague anchor text | Replaced them with descriptive destination text |

## Prioritized maintenance

1. Run the rendered crawl after deployment and compare production output with this local production baseline, especially status codes, social-image responses, and cache headers.

2. Keep meaningful writing changes paired with `updatedAt`, and let the date-review check block ambiguous edits rather than automatically changing dates for formatting or image swaps.

3. Keep checkable market, product, and pricing claims tied to primary sources with an explicit as-of date.

4. Revisit crawler permissions intentionally if the content-use policy changes. Google-Extended is currently allowed because Gemini grounding was judged worth it.

## Outside repository scope

Backlinks, third-party mentions, publisher authority, social distribution, external profile consistency, Bing Webmaster Tools data, production crawl logs, and answer-engine citation tracking cannot be verified from this repository. The repository makes that work easier through clean canonical URLs, consistent `Isaac Vazquez` identity, descriptive bylines, shareable 1200 by 630 images, RSS, and direct legacy redirects, but it cannot create or measure those off-page signals by itself.

The metadata helper supports Google site verification through `GOOGLE_SITE_VERIFICATION` in `src/lib/seo.ts`. The current domain property is verified through Cloudflare DNS, so that HTML verification value is not required for ownership to remain active.
