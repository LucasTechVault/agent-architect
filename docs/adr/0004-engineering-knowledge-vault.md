# ADR 0004: Use a dense engineering vault with portable progress

- Date: 2026-10-16
- Status: Accepted
- Basis: User request for a technical reference, four-phase issue tracker, and editable learning takeaways. Persistence migration is an implementation default.
- Extends: [0001](0001-initial-architecture.md) application design and [0002](0002-evidence-backed-progress.md) progress model.

## Context

The introductory field guide needs deeper implementation detail and a clearer connection between architectural targets, engineering tasks, and personal recall. Existing local records must survive the change.

## Decision

Keep one typed specification for each archetype's nine engineering blocks, shared by the technical sheet and topology inspector. Present concrete contracts, boundaries, and failure cases in a compact reference layout. Track 20 engineering issues across four build phases, with acceptance evidence and notes. Add editable, explicitly reviewed takeaways per archetype.

Use progress payload v2, preserving milestones, decisions, and reflections. Migrate v1 on load/import into empty issue and takeaway maps; retain the existing `agent-architect.progress.v1` storage key so browser records remain discoverable. Export v2 backups. Validate known catalog keys, field types, and lengths; require evidence for issue completion and nonblank text for takeaway review.

Readability follow-up (2026-10-16): use browser-relative type with a 16px default body, 14px code, 28px page titles, and a 12px minimum for secondary labels. Use fluid cards, content-width container queries, shrinkable grid tracks, wrapping paths, and horizontal scrolling scoped to code blocks. Preserve browser font preferences instead of shrinking type at narrow breakpoints.

## Consequences

The topology inspector and reference sheets share facts instead of drifting. Stable issue and archetype IDs become persistence contracts. Proposed specifications remain learning targets: the implemented `agentbox-core` kernel is separate, and checking a task or reviewing a takeaway does not run or verify engine code. Browser origin limits and private-backup handling from ADR 0002 still apply.

## Implementation and verification

- [`src/data/engineering-specs.ts`](../../src/data/engineering-specs.ts): shared nine-block specifications; [`src/data/archetypes.ts`](../../src/data/archetypes.ts): role catalog and legacy milestones; [`src/data/roadmap.ts`](../../src/data/roadmap.ts): phases and issue IDs.
- [`src/components/EngineeringSheet.tsx`](../../src/components/EngineeringSheet.tsx) and [`SpecProperties.tsx`](../../src/components/SpecProperties.tsx): shared reference and metadata; [`Roadmap.tsx`](../../src/components/Roadmap.tsx): issue tracker; [`src/App.tsx`](../../src/App.tsx): topology selection, takeaways, and backup controls.
- [`src/progress.ts`](../../src/progress.ts), [`src/progress.test.ts`](../../src/progress.test.ts): v1 migration, v2 round trips, invalid-input rejection, evidence/review gates, and independent statuses.
- [`src/data/engineering-specs.test.ts`](../../src/data/engineering-specs.test.ts): six complete matrices and semantic compilation of all 12 handoff schemas; roadmap tests enforce 20 stable issue IDs across four phases.
- Initial verification: 52 tests and production build pass. Browser checks cover schema expansion, decision links, note/takeaway persistence, evidence-gated issues, filtering, backup restoration, and 390px layouts without horizontal overflow. Original browser progress restored after QA.
- [`src/styles.css`](../../src/styles.css): follow-up passes 40 view/width checks from 320–1920px and 12 additional decision-sheet checks, with no document overflow; expanded schemas/budgets and mobile navigation also checked. Computed default body is 16px, code 14px, and visible secondary text at least 12px. All 52 tests and the production build pass.
