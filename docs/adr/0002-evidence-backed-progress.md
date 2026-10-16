# ADR 0002: Keep explicit, evidence-backed progress in local browser storage

- Date: 2026-10-16
- Status: Accepted implementation default

## Context

Scaffolding code or reading a role description does not prove implementation mastery. Learning records must remain portable without coupling this application to the engine or a hosted account.

## Decision

Use a versioned progress model in browser `localStorage`, with JSON export and validated import. Require nonblank evidence before marking a milestone complete; derive an archetype's Verified status only when all its milestones are complete. Evidence without completion is In Progress. Store architecture choices and rationales explicitly; typing a rationale does not select an option.

Accept only catalog keys and valid values during import, enforce content limits, and remove unsupported completion claims without evidence. Confirm before replacing current progress. Surface storage failures and preserve unreadable stored data until a valid backup is restored.

## Consequences

Verified is a learner's recorded claim, not an engine-generated receipt. Data is specific to the browser profile and origin, so regular exports are necessary. Catalog IDs and decision ordering form the v1 persistence contract; incompatible changes need migration/versioning. Private backups should stay outside this public repository.

## Implementation and verification

- [`src/progress.ts`](../../src/progress.ts): schema validation, evidence gating, and status aggregation.
- [`src/App.tsx`](../../src/App.tsx): autosave, explicit choices, evidence editing, and backup confirmation.
- [`src/progress.test.ts`](../../src/progress.test.ts): round-trip preservation, malformed input rejection, unknown-key filtering, blank choices, evidence gating, and status isolation. Run `npm test`.

Initial validation: 26 tests and production build pass. Browser checks cover evidence gating, reload persistence, explicit undecided choices, backup export/restore, navigation/filtering, and a 390px mobile layout. Test progress was cleared.
