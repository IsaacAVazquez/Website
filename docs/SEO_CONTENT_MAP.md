# SEO Content Map

**Last updated:** 2026-06-22

This map assigns one primary search intent to each writing cluster and identifies the pages that should receive the strongest internal links. It is a guardrail against publishing multiple articles that compete for the same query.

## Topic ownership

| Topic hub | Primary intent | Canonical supporting pages |
| --- | --- | --- |
| `/writing/topics/pm-workflows` | AI workflows for product managers | `/writing/ai-product-discovery-workflow`, `/writing/ai-user-research-synthesis-workflow`, `/writing/ai-prd-writing-prompts-structure`, `/writing/ai-roadmapping-from-feedback` |
| `/writing/topics/agentic-ai` | Agentic AI product strategy | `/writing/agentic-ai-explained-for-product-managers`, `/writing/evaluate-agentic-ai-product-pm-framework`, `/writing/build-vs-buy-agentic-ai-platform`, `/writing/what-an-ai-agent-actually-costs-in-production` |
| `/writing/topics/fintech-product-pricing` | Fintech product and pricing analysis | `/writing/building-an-investment-research-platform`, `/writing/interchange-iq-payment-fee-analyzer`, `/writing/pricing-strategy-initiative` |
| `/writing/topics/systems-quality` | Software reliability and quality engineering | `/writing/building-reliable-software-systems`, `/writing/complete-guide-qa-engineering`, `/writing/qa-engineer-guide-testing-ai-systems`, `/writing/evals-are-the-new-test-suite` |
| `/writing/topics/sports-fantasy` | Sports analytics and fantasy strategy | `/writing/2025-fantasy-football-draft-strategy`, `/writing/rb-vs-wr-draft-strategy-modeling-positional-value`, `/writing/world-cup-2026-top-ten-contenders`, `/writing/2026-march-madness-bracket-analysis` |
| `/writing/topics/signals-commentary` | Technology, market, and policy commentary | Time-bound commentary articles; avoid treating weekly pieces as evergreen canonical explainers |
| `/writing/topics/space-experiments` | Space technology and product experiments | `/writing/artemis-ii-first-crewed-lunar-mission`, `/writing/building-spacex-mission-control`, `/writing/spacex-ipo-case-for-going-public` |

## Cannibalization guardrails

- Fantasy football overview queries belong to the topic hub. Draft strategy, waiver wire, beginner, and analytics articles should target their narrower intent and link back to the hub.
- Dashboard build articles target the product-design or implementation story. Live dashboard routes target the utility query. Do not give both pages the same title or description.
- The World Cup contender series targets team-specific preview queries. `/writing/world-cup-2026-top-ten-contenders` owns the broad contenders and power-rankings query.
- `agentic-ai-explained-for-product-managers` owns the introductory definition. Later agent articles should target evaluation, cost, security, delegation, architecture, or build-versus-buy intent.
- `building-reliable-software-systems` owns the broad reliability query. QA and eval articles should remain narrower and link to it as the parent concept.

## Publishing checklist

Before adding an article:

1. Assign it to one topic hub.
2. Name the primary query and the existing page closest to that query.
3. Narrow or merge the article if the search intent is already owned.
4. Add at least two contextual internal links.
5. Link claims that depend on external facts to primary sources.
6. Keep the search title within 60 characters and the description within 160 characters.
