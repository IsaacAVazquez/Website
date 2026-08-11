# Writing Voice

**Last updated:** 2026-08-09

This document governs all writing for Isaac, from articles and blog content under `content/blog/` to UI copy, page descriptions, bios, hero text, readouts, and emails. It does not govern code. Any agent or collaborator editing, creating, or rewriting text must follow these rules exactly.

This file is canonical. The `## Writing Voice` section in `CLAUDE.md` is a short working summary of it, and if that summary ever conflicts with this file, this file wins.

---

## What the Voice Sounds Like

Isaac's writing is first-person, direct, and opinion-forward. It reads like a senior practitioner explaining something they've actually worked through, not a thought-leadership summary or a tutorial or a blog post trying to rank.

Specific characteristics:

- First person used naturally and frequently: "I think," "I would argue," "I believe," "In my mind," "What I found," "I built this because"
- States opinions directly without corporate hedging. A drafted "It could be argued that RB value is often overstated" becomes "I think RB value is overstated."
- Flowing prose paragraphs, with related points strung together in sentences rather than converted into bullets
- Data and specifics woven into the sentences rather than isolated in callouts. Instead of a standalone "Stat: 43% conversion" line, write "About 43% of them converted, which is the whole reason the rest of this matters."
- Acknowledges the tradeoffs and other perspectives, then lands on a clear position
- Conversational asides: "What's interesting here is..." "What makes this worth paying attention to..."
- Rhetorical questions used sparingly, not as a default device, and usually only to pivot between ideas. More often, prefer a flowing declarative.
- Section headers only where a long piece needs navigation

---

## Sentence Texture

Keep it plainer and more explanatory than punchy. Say the plain literal thing even when it runs a little longer, and don't reach for vivid, aphoristic, or metaphorical compressions or for editorializing color adjectives. When a phrase sounds clever, it is usually hiding a plainer sentence that says more.

Prefer the plain rewrite:

| Instead of | Write |
| --- | --- |
| "partly fiction" | "hard to understand" |
| "optimizing against noise" | "trying to make changes without a clear picture of the reality" |
| "the bleed" | "the drop off" |
| "quietly wrong" | "not as precise or accurate as it could be" |

Drop editorializing color adjectives the same way. A drafted "little tags," "boring fix," or "clever report" loses the adjective and becomes "tags," "fix," "report."

Other rhythm rules:

- Treat stylized sentence fragments and staccato contrast pairs as rare emphasis, not the default, and smooth them into flowing sentences joined with "but" or "and." A drafted "The spend is fine. What's broken is the tagging." becomes "The spend is fine, but what's broken is the tagging."
- Prefer long accumulating sentences with stacked clauses and "from X, to Y, to Z" lists over crafted parallelism or tricolons. A drafted "We throw the parties, we run the boards, we book the rooms" becomes a single accumulating sentence built on "from planning, to being involved, to booking."
- Use reciprocal both-and framing, where something is described as both an output of a system and a thing that reinforces that same system, as in "byproducts of the system as much as they are things that reinforce that system."
- Don't chase synonym variety, since repeating a word is fine
- Keep the calibrated hedging ("it looks like," "I think," "I'd argue," "I feel like," "I would guess," "probably," "at least," "actually") as a real feature of the voice, not something to strip out. Two markers recur and should stay. Use "actually" as a mid-sentence qualifier, as in "they're not actually following through," and "What that means is" or "What I think this means is" to introduce an interpretation.
- Stay general where the source was general, and don't invent proper nouns or details that weren't provided
- Watch for the trade where a specific fact gets swapped out for a generic superlative, since it is the most reliable single tell in machine prose. "Inventor of the first train-coupling device" turning into "a revolutionary titan of industry" is the shape of it, and the subject comes out less specific and more exaggerated at the same time. Any sentence that praises or contextualizes something should be at least as specific as the material it came from, and where it is vaguer and louder, put the fact back and cut the adjective that was standing in for it.

---

## Personal Anchors

Weave personal experience and biographical anchors in as evidence alongside the data. Isaac's recurring anchors are Civitech, Haas, Lyft, and Juno. When writing in his voice, look for natural places to ground a point in a first-person reference like that rather than only citing third-party sources or data, but never invent specific details or numbers he hasn't given.

---

## Hard Rules

Never use these patterns, regardless of topic:

- No em dashes as stylistic devices. A drafted "The tagging is the issue — everything else is fine" becomes "The tagging is the issue, and everything else is fine."
- No colons as sentence connectors. Write "The problem is X", not "The problem: X." Short label lines and list lead-ins are fine.
- No bullet lists with bold labels, and no boldface used as emphasis machinery anywhere else either, meaning every instance of a chosen term bolded through a paragraph, a bolded phrase standing in for a heading with prose under it, or a bold label with no punctuation after it. Prefer prose over bullets in general, though a plain reference table in a catalog is fine.
- No Tables of Contents
- No corporate or MBA framework names as section headers (Porter's Five Forces, Kotter's Model, McKinsey 7S, etc.)
- No "comprehensive guide" or "complete guide" openers that set up a listicle structure
- No generic restating "Conclusion" sections
- No "Next Steps" bullet lists at the end
- No "About the Author" sections
- No "Despite these challenges, X is well positioned" closers, and no "Challenges and Future Outlook" section to hang one on. The rigid formula is the problem rather than the mention of difficulty, so name the specific difficulty and stop instead of landing on a vague reassurance.
- No emoji used as formatting, meaning decorating a heading or a bullet with one. Emoji inside a Slack message where the register calls for it is a different thing and is fine.

Prefer unhyphenated compound technical phrases ("invoice to cash," "procure to pay," "day to day").

---

## Condensing Philosophy

- Cut anything that pads with generic advice or restates what the article already said
- Keep only what is actually worth saying
- Fantasy football and QA articles especially tend to be padded, so cut aggressively
- A good article says one thing clearly, not seven things vaguely

Condense aggressively in polished essays and deliverables, but in emails and explainers tolerate mild redundancy for clarity and warmth.

---

## Register by Context

Shift register to fit the format. Email openers are warm and casual, like "Hey Andrew, just wanted to send a quick update." Marketing or event copy is warm, earnest, inclusive, and enthusiastic, it emphasizes community over being cool, and exclamation points are welcome. Avoid aloof or edgy cool-kid copy in either case.

---

## Structure of an Opinion Essay

When the piece is an opinion essay, follow this shape:

- Open with a thesis framed as a personal observation set against the surrounding discourse, the thing everyone else seems to be saying and where I see it differently
- Pivot into the argument sparingly, usually through a single rhetorical question
- Walk through two to four short case paragraphs, each naming the case in its first sentence and landing a verdict
- Close with a "the pattern I'd pull out of this is" synthesis rather than a generic conclusion
- No section headers within short pieces like this

---

## AI Tells to Strip

These patterns read as machine-generated and should come out of any draft on sight. They were folded in from a generic AI-writing auditor in July 2026 and filtered against the rules above, so nothing here overrides the voice. Where generic anti-AI advice conflicts with this file, this file wins. In particular, never strip the calibrated hedging, never chop flowing sentences into punchy fragments for variety, and leave the conversational asides ("What's interesting here is...," "What makes this worth paying attention to...") and the sparing rhetorical pivots alone. Generic auditors flag all of those as AI tells, and here they are the voice. The one refinement worth keeping on the hedging is not to stack two hedges on one verb, so "could potentially create" becomes "could create" and "may eventually unlock" becomes "may unlock." One soft modal per claim does the work.

Cut the contrast pivot "It's not X, it's Y" and its split-sentence form ("The headline isn't the speed. The real story is Y."), and just state the positive claim. Prefer "is" and "has" over inflated copulas like "serves as," "boasts," "features," and "represents." Name the source instead of writing "experts believe" or "studies show." Delete significance inflation ("a watershed moment," "marking a pivotal moment") and empty closers ("only time will tell," "the future looks bright," "as we move forward"), and if a prediction is worth making, make it falsifiable. Drop template phrases ("Whether you're X or Y," "In today's...," "In an era where"), "Let's" transition openers ("Let's dive in," "Let's unpack this"), and stacked formal transitions ("Moreover," "Furthermore," "Additionally"), restructuring so the connection is obvious instead. Don't pile up emphasis words ("Notably," "Importantly," "Interestingly") to tell the reader how to feel, and don't pad material into numbered lists ("Three key takeaways") it doesn't actually have. Remove chatbot artifacts entirely ("I hope this helps!", "Great question!", "In this article, we will explore"), along with anything that leaked from a chat tool, meaning unfilled placeholders like "[Your Name]", internal citation tokens like "citeturn0search0", and tracking parameters like "utm_source=chatgpt.com" on links. On social posts, two or three specific hashtags at most.

Six more come from Wikipedia's "Signs of AI writing" essay and get the same treatment. Extend the contrast-pivot ban to the other shapes of negative parallelism, meaning "not only X, but also Y," "doesn't just X, it Y," "no X, no Y, just Z," and the reversal "X rather than Y," since all of them stage a misconception nobody held so the sentence can correct it. Delete the trailing participle that explains what a fact means without adding anything, as in "the station links Delhi and Patna, facilitating the movement of passengers," where everything after the comma is unfalsifiable. Extend the inflated copulas past "serves as" and "boasts" to "stands as," "functions as," "operates as," "marks," "maintains," and "offers," and to the padded forms like "ventured into politics as a candidate" where "was a candidate" is the sentence. Never claim a source is silent and then speculate past it, so "the data doesn't break this out, but it's likely driven by" becomes a plain statement of what I checked and what I did not find. Don't inflate how many sources hold a view, since "several publications" over two citations and "such as" in front of a complete list both imply more than is there. And in a dated document prefer an absolute date to "recently," "currently," "to date," or "in recent years," all of which mean something different by the time anyone reads it.

Three more, scoped rather than absolute. Inside a work document, write headings in sentence case, so "Impact of Technology and Digitalization" becomes "Impact of technology and digitalization," since title-cased function words mid-heading are a chat-window habit rather than a choice. That covers headings inside readouts, analyses, memos, and docs, and it deliberately does not touch article titles, SEO titles, page titles, or product names, which keep the site's existing title-case convention, and it does not make anything already published wrong. Second, reporting verbs carry a verdict, since writing that someone noted, pointed out, clarified, or revealed something says the claim is true while writing that they claimed, asserted, insisted, or speculated says the opposite, so reach for a loaded verb only when you mean the load, and in a readout the repair is usually to drop the attribution rather than neutralize it, because names belong to the history of who built or asked for something and not to judgments. "Showed" and "confirmed" stay fine for data I actually opened. Third, cut the sentences that vouch for my own care, since "I carefully reviewed every figure" and "I am committed to accuracy" assert the one thing a reader cannot check, and the honest version is to say what I did or say what I did not check.

Two findings from the same source cut the other way and are worth knowing before an audit pass. The research it cites finds that hedging qualifiers and intensifiers like "very," "perhaps," and "tends to" show up more in human writing than machine writing, as do plain "is" and "has" phrasing and definitive statements like "was the first," so the calibrated hedging above has evidence behind it and not only taste. The essay is also clear that several popular tells do not work, naming perfect grammar, a mix of casual and formal register, prose that reads bland or robotic, prose that reads formal or academic, and transition words taken in isolation. `~/.claude/skills/avoid-ai-writing/references/ai-writing-signals.md` is the long catalog behind this section, holding the full phrase inventories per signal, the greppable per-model leaked tokens, and a closing list of what not to strip.

The vocabulary below is the reliable word-level signal. Replace on sight, in body text and headers both. This is a catalog, so a reference table is the right form. Two cautions on how to read it. The source is firm that the list has to be taken literally, because a word being overused does not make its synonyms overused, and context still counts, so "underscore" meaning an underline mark is just a word. And the concision rows near the bottom, meaning "in order to," "due to the fact that," and their neighbors, are for polished essays and deliverables, since in an email or an explainer a slightly longer connective that reads warmer stays, which is the same allowance the condensing rules already make.

| Replace | With |
| --- | --- |
| delve / delve into | dig into, look at |
| leverage (verb) / utilize | use |
| robust | strong, reliable |
| comprehensive | thorough, full |
| seamless | smooth, easy |
| genuinely | really, (or cut) |
| cutting-edge | latest, newest |
| game-changer / transformative / revolutionize | (describe what actually changed) |
| landscape / ecosystem / realm (metaphors) | field, space, market, system, community |
| tapestry / beacon / symphony (metaphors) | (rewrite plainly) |
| paradigm | model, approach |
| testament to | shows, proves |
| pivotal / crucial / paramount | important |
| underscores / highlights (as verbs) | shows, points to |
| showcase / showcasing | show, present |
| garner | get, win, attract |
| intricate / intricacies | complicated, the details of |
| align with | match, fit, support |
| enhance | improve, add to |
| enduring | (give the span, or cut) |
| valuable insights | (say what was learned) |
| key (as an adjective) | (name why it matters, or cut) |
| methodology (meaning "method") | method |
| award-winning | (name the award) |
| the likes of | (list them plainly) |
| meticulous | careful, detailed |
| embark / commence | start, begin |
| endeavor | effort, try |
| harness / unleash / empower | use, enable, let |
| foster / cultivate | build, encourage, grow |
| elevate / bolster | improve, strengthen |
| streamline | simplify, speed up |
| spearhead | lead, run |
| resonate with | connect with, matter to |
| facilitate | help, enable, run |
| navigate (metaphor) | work through, handle |
| myriad / plethora | many (or give a number) |
| nuanced / multifaceted | (name the actual detail) |
| burgeoning / nascent | growing, new, early |
| vibrant / thriving / bustling | (describe it, or cite a number) |
| nestled | is in, sits in |
| holistic | complete, whole |
| actionable | practical, concrete |
| impactful | effective (or describe the impact) |
| learnings | lessons, findings |
| best practices | what works, the standard approach |
| thought leader | expert (or describe the contribution) |
| synergy | (describe the combined effect) |
| interplay | relationship, interaction |
| at its core | (cut, just state the thing) |
| deep dive / unpack | look at, explain, walk through |
| in order to | to |
| due to the fact that | because |
| it's worth noting / it's important to note / it's crucial to remember / may vary | (cut, just state it) |
| when it comes to | (talk about the thing directly) |
| at the end of the day | (cut) |

---

## Examples in the Codebase

The articles below demonstrate the voice correctly. Read them before editing or creating new content:

- `content/blog/rb-vs-wr-draft-strategy-modeling-positional-value.mdx` (data woven into prose, clear positional argument)
- `content/blog/building-an-investment-research-platform.mdx` (product rationale in first person, restraint as a feature)

The original 22 articles in `content/blog/` were rewritten to this voice in April 2026; the directory has since grown well beyond that. Every article in `content/blog/` follows this voice and can be used as a reference.
