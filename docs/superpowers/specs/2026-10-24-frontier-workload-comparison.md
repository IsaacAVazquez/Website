# Frontier workload comparison

## Objective and scope

I want the Frontier Model Tracker to help someone compare the text-token cost of a workload across up to four models, check the listed capabilities and token limits, and save a named comparison in their browser. This is the first project selected from the October 24 improvement list. The existing chart, spec sheet, filters, and URL behavior stay in place.

## Behavior

The visitor enters monthly request count, input tokens per request, and output tokens per request. All three are nonnegative whole numbers. Request count is limited to one billion and each token count to ten million. Empty, fractional, negative, infinite, and out-of-range values show an input error and prevent saving. Starting values are an example, and the visitor chooses the models.

The comparison checks text support, optional vision and audio support, optional reasoning support, input plus output against the context window, and output against the published output limit. A missing limit is an explicit unknown. Missing models stay visible after loading a save. Capability checks use the catalog's coarse labels, so provider documentation is still needed to confirm a particular input or output format.

Each priced component is monthly requests multiplied by tokens per request and its price per million tokens. The total is unknown when a used component has no published price. Zero usage costs zero. A model that fails a requirement keeps its cost estimate and a clear explanation of the failed requirement. The table does not rank model quality or recommend a winner.

The calculation covers text tokens only. It excludes image and audio charges, tools, caching, batch discounts, price tiers, taxes, and retries. Entered output includes any billed reasoning tokens. The results use the dated dataset displayed on the page, with its existing review disclosure preserved.

Save up to twenty named comparisons under `frontier-workload-comparisons-v1`. Each record has validated inputs, up to four unique model identifiers, a save timestamp, and the dataset build timestamp. Loading recalculates with the displayed dataset and says so. Saving creates a new record, and removal reads the latest saved collection. The shared browser adapter handles concurrent tabs and storage failures. Invalid restored records are rejected.

## Design and implementation

This is an addition to the existing spec sheet design. A link beside the existing spec-sheet jump leads to the workload section after the spec sheet. The section uses the route's `--frm-*` tokens, plain headings, labeled native fields, a comparison table with a local scroll region, and a saved-comparison list. Controls have at least 44 pixel targets and visible keyboard focus. Both themes and widths from 320 to 1440 pixels must work.

Pure calculation and restoration helpers live in `src/lib/frontierWorkload.ts`. UI components live beside the route under `src/app/frontier-models/components/`. Jest covers the arithmetic, boundaries, unknown data, saved-state validation, and browser storage flows. Browser verification covers form interaction, reload, keyboard use, layout, themes, and application errors.

The code follows the existing TypeScript and React patterns, including named exports and the shared `useBrowserRecord` hook. No dependency or provider integration is needed. The current snapshot facts are inputs to the calculator and are not edited by this work.

## Build order and verification

First prove calculation and record validation with focused Jest tests, then add the form, comparison table, and saved records. Finally update route metadata and this workflow's documentation, run the project checks, and inspect the rendered result.

Run `npm test -- --runInBand`, `npm run lint`, `npm run typecheck`, and `npm run build` with Node 22. Use `PORT=3100 JOB_SEARCH_PRIVATE_SYNC=0 npm run dev` for isolated browser verification. No publishing or external messages are part of this change.
