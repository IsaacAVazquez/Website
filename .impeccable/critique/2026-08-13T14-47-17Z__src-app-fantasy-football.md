---
target: Fantasy Football
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-13T14-47-17Z
slug: src-app-fantasy-football
---
Method: dual-agent (A: /root/fantasy_design_review · B: /root/fantasy_detector_evidence)

## Design Health Score

| # | Heuristic | Score | Main issue |
| --- | --- | ---: | --- |
| 1 | Visibility of system status | 2 | Source and draft status are strong, but reduced-motion users lose the full rankings hero and its actions. |
| 2 | Match between system and real world | 3 | Draft structure and language fit experienced players, but ADP, ECR, Draft Outlook, and contest differences ask too much of first-timers. |
| 3 | User control and freedom | 3 | Undo, redo, reset confirmation, persistence, and exports are strong. Older best ball and companion corrections still require repeated undo. |
| 4 | Consistency and standards | 3 | Shared cards and controls are coherent, but redraft exposes Log pick while best ball makes the whole row the action, and the companion does not follow the web recommendation contract. |
| 5 | Error prevention | 2 | Stale guidance is suppressed on the web, but the companion can show unsupported exact recommendations and mismatched ADP. |
| 6 | Recognition rather than recall | 3 | Current pick, roster, queue, and source context are visible. Icon-only actions and contest distinctions still depend on prior knowledge. |
| 7 | Flexibility and efficiency | 2 | Search, filters, density, queue, and exports help repeat users, but live logging lacks clear-and-refocus behavior, Enter submission, and keyboard shortcuts. |
| 8 | Aesthetic and minimalist design | 2 | The visual language is disciplined, but large heroes, option walls, and long mixed-purpose pages delay the primary task. |
| 9 | Error recovery | 3 | Undo, redo, retry, and reset states work. Older pick repair, hidden backups, and silent companion storage failures remain weak. |
| 10 | Help and documentation | 3 | Explanations and model limits are thorough, but help is often far from the decision and some companion claims are ahead of the implementation. |
| Total |  | 26/40 | Acceptable. The foundation is strong, but trust and live-draft flow need work before the new companion ships. |

## Design Specificity Verdict

### LLM assessment

This is strongly authored for fantasy drafting. Tier rails, position colors, ECR and ADP comparisons, snake-slot context, draft clocks, roster needs, contest lenses, source freshness, and Week 17 context all come from the job users are trying to do. The limestone and graphite Working Instrument visual system also fits the analytical product. Specificity drops where tool routes inherit portfolio behavior, especially the large editorial heroes, several introductory actions, long article sections, and the generic contact pitch after the task.

### Deterministic scan

The detector scanned 36 runtime TSX files under `src/app/fantasy-football` and `src/components/fantasy`, excluding tests. It returned 0 findings and 0 advisories. That means there was nothing the regular-expression rules could identify. It does not prove the rendered UI is clean because this surface relies heavily on Tailwind classes and inline style objects.

The browser pass caught one issue the source detector missed. With reduced motion enabled, the `/fantasy-football` hero remains at opacity zero after 3.5 seconds at desktop and mobile widths. Computed-style sweeps also produced false positives for transition-all, large radii, the clipped skip link, and the horizontally scrollable best ball contest bar. Source review and root overflow measurements cleared those items.

### Visual overlays

Mutable script injection was confirmed, but the site's enforced Content Security Policy blocked the external overlay script on all four routes. No reliable user-visible overlay or Human browser tab is available. The fallback inspection used fresh Chromium sessions, screenshots, accessibility measurements, computed styles, page errors, and source evidence.

## Overall Impression

The research and active-draft experience is already more capable than most fantasy tools. The strongest work is source transparency, stale-data suppression, responsive player rows, current-pick context, and recovery controls. The next pass should protect trust before adding features. Production data is stale, publication is failing, and the new companion can make recommendations the web product intentionally refuses to make. After those are fixed, the largest user gain will come from making manual pick entry faster and moving the task above the mobile fold.

## What’s Working

- Data trust is unusually strong on the web. Source dates, freshness states, aging warnings, and suppression of unsupported values tell users what the system knows.
- Live-draft control is well built. The current pick, timer, team context, queue, roster needs, undo and redo, reset confirmation, local persistence, exports, and mobile action bars fit a clock-driven workflow.
- Responsive tables are thoughtfully adapted. Player rows become readable mobile cards without document-level horizontal overflow, and desktop drawers become usable mobile sheets.

## Priority Issues

### P0. The companion breaks the best ball recommendation contract

#### Why it matters

The web hides exact player cards between the user's turns because the model does not estimate whether each player will survive the intervening picks. The companion still calculates, sorts, and displays exact recommendations during every team's turn. It also shows standard Underdog ADP in reference and Superflex rooms, and its freshness calculation ignores the Superflex source date. That can lead to a wrong pick while presenting the result with more confidence than the data supports.

#### Fix

Define one shared decision-context contract for web and companion with the current team, user-turn state, guidance mode, permitted market source, and required source date. Only calculate exact cards on the user's turn, remove mismatched ADP from every reference room, and use the Superflex source date for Superflex. Add contract tests for out-of-turn, reference, stale-source, and Superflex cases. Hold the companion release until these pass.

Suggested command `$impeccable harden`

### P0. Data freshness and publication do not match the product promise

#### Why it matters

The live revision ledger reports Fantasy Football as `stale-fallback` with a source date of August 7, 2026. The web removes exact best ball guidance after four days, but the refresh workflow only warns at four days and waits until fourteen days to fail. The latest Fantasy refresh failed, and the August 13 publication run also failed after production never exposed the expected publication revision or deployment commit. A feature branch also carried older Fantasy artifacts over a newer automated refresh, so snapshot dates can move backward.

#### Fix

Repair the production publication contract first. Then gate every decision dependency separately, including the three redraft boards, standard best ball rank, standard ADP, Superflex rank, and Week 17 schedule. Open a publication incident at the same four-day threshold that disables exact guidance. Add a CI non-regression check that rejects an older source date unless the change explicitly documents a rollback. Confirm redistribution rights and source continuity before treating the public HTML fallback as the long-term scheduled source.

Suggested command `$impeccable harden`

### P1. Reduced-motion users lose the rankings hero

#### Why it matters

At 1440 by 1000 and 390 by 844, the heading, orientation copy, and four hero actions remain invisible while their space stays on the page. This is a functional accessibility regression, not a cosmetic animation difference.

#### Fix

When reduced motion is requested, render the hero in its visible state without an initial hidden frame. Add a browser test that enables reduced motion and asserts the hero heading and actions have visible opacity after hydration.

Suggested command `$impeccable audit`

### P1. Live pick entry and correction are too slow

#### Why it matters

A room requires roughly 180 to 216 manual selections. Search text remains after a pick, focus does not return to search, Enter cannot record a unique result, and best ball hides the state-changing Log pick action inside the full row. Starting redraft also preserves the setup page's scroll position, which landed around rank six on desktop and rank nine on mobile. If an older pick is wrong, best ball and the companion require repeated undo.

#### Fix

Clear and refocus search after a successful pick, let Enter log one unambiguous result, expose a visible Log pick target, and move focus and scroll to the top of the board after setup. Add an editable pick ledger with replace, remove, and insert actions that rebuild team assignment and roster totals deterministically. Keep rewind as the fast destructive option.

Suggested command `$impeccable harden`

### P1. Mobile hierarchy delays the task

#### Why it matters

The primary task sits below the first mobile viewport on all four routes. The rankings and best ball pages measured about 13,728px and 20,754px tall, and the selected best ball format explanation appears after the initial 80-player board on mobile. Large heroes, several introductory actions, long initial lists, and option walls create avoidable work before users can rank or draft.

#### Fix

Replace the tool-route hero with a compact task header and one sentence of source trust. Put the board or first setup choice in the initial viewport, load 20 to 25 rows initially, add a persistent jump to board or search action, move strategy into a disclosure or separate Read-mode route, and show the selected contest brief immediately below the selector on mobile.

Suggested command `$impeccable distill`

## Persona Red Flags

### Alex, the power user

Alex gets useful density controls, filters, exports, and live status, but loses time to long initial lists, the post-start scroll jump, search that does not clear or regain focus, and the absence of clock-oriented keyboard shortcuts. The existing ordered queue logic is also hidden, and live surfaces only show the first eight queued players.

### Casey, the distracted mobile user

Casey does not reach the board or setup in the first viewport, sees only a few tall player cards at once, and must scroll past the board to read the selected best ball format. A full player row that records a pick also increases the chance of an accidental selection while scanning.

### Sam, the accessibility-dependent user

Sam loses the complete rankings hero when reduced motion is enabled. The footer's Now link measures 34.8 by 44px instead of the required 44 by 44px, queue and compare actions rely on icon discovery, and the companion uses 8 to 10px supporting text with no selected-state semantics on several button groups.

## Minor and Later Observations

- Queue reordering is implemented and tested but no UI calls it. Research shows only the first 12 queued players and redraft live shows the first eight.
- Each surface keeps one active room per season or contest. Existing draft IDs, league names, exports, decoders, and backups are enough to support a browser-local room library with import and restore.
- Best ball research has queue, notes, and compare inside the player drawer, but its tracker and companion do not carry those decisions forward. The best ball compare tray also omits the readiness cleanup used by redraft.
- Companion storage reads and writes do not expose failure states, its production build is not part of CI, and there is no unpacked-extension smoke test.
- Best ball search replaces the route on every keystroke. Keep filtering local and synchronize the URL after idle or blur.
- A separately sourced, timestamped injury and availability layer would reduce the need to leave the tool during consequential picks. It should annotate the board without silently rewriting consensus rank.
- Draft Outlook remains an ordinal process score with judgment weights. Backtest it against complete held-out drafts and an ADP baseline before adding predictive claims.
- Each route renders two viewport meta tags. Mobile sizing is correct, so this is redundant global markup rather than a layout failure.

## Questions to Consider

- If the draft clock is running, which one fact and one action must stay visible, and what can wait behind a disclosure?
- Should the companion share the exact same decision engine and tests as the web tracker, with the interface only choosing how to display the result?
- Does best ball strategy belong below an 80-player board, or should it have its own Read-mode destination?
- Is a saved draft fundamentally a season-and-contest slot, or should the product treat every league and mock as a durable room with its own identity?
