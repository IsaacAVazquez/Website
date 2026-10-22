# Practical project improvements

Isaac approved the six proposed project improvements on October 22, 2026. I will keep the existing route designs, use browser storage for personal records, and build each project as a separate increment on `feature/practical-project-tools`.

| Module | Outcome | Depends on |
| --- | --- | --- |
| interchange | Compare the same payment channel using dated published rates, with custom contract estimates separated | None |
| decisions | Save named bets, compare their scores, and inspect changes that alter a verdict | None |
| recipes | Save recipes, plan dated meals, and combine missing ingredients into a shopping list | None |
| travel | Record activity costs, compare planned costs with budget, and download a calendar | None |
| commute | Save stations and filter trains and alerts for a commute | None |
| enablement | Enter team records, save onboarding progress, and describe rubric results as fit scores | None |

The build order follows this table. Each module has its own tests and commit. New inputs and restored strings are validated and capped. Existing browser data remains readable, writes use the latest validated record, and storage failures have a visible notice. Exports are downloads initiated by the visitor. Bus connections wait for a 511 key.

I will use the existing project styles, scoped class prefixes, tokens, native accessible controls, and 44px touch targets. New sections collapse at phone widths. Each route keeps one heading and the shell's one main landmark.

The implementation uses the existing Next.js client boundaries and `useLocalStorageString` and `browserStorage` helpers, with pure helpers for calculations and validation. Tests live beside each route or in `src/lib/__tests__`. No new dependency or account is needed.

Focused Jest runs verify each increment. The final checks are `npm test -- --runInBand`, `npm run lint`, `npm run typecheck`, `npm run build`, and browser flows for the six routes. The browser checks cover persistence, editing and removal, empty states, calendar download, phone and desktop layouts, and both themes. Review covers data loss, misleading comparisons, date handling, and input validation.
