# ADR 0001: Separate the learning application from the execution engine

- Date: 2026-10-16
- Status: Accepted
- Basis: User's initial two-project design; application choices below are implementation defaults.

## Context

The learning workspace needs interactive architectural recall and progress tracking. The engine needs bounded execution, workspace isolation, and event records. Combining them would couple personal learning state to production runtime behavior.

## Decision

Keep `agent-architect` and `agentbox-core` in independent repositories. Build this application as a React + TypeScript + Vite single-page app with lightweight CSS and hash navigation. Store the six archetype specifications as typed source data, including runtime flows, state/tool boundaries, milestone proof prompts, and proposed decisions.

## Consequences

The application runs locally without engine credentials or a backend. Catalog changes require a source change; engine integration and automatic verification remain future work. Proposed topologies and model policies describe learning targets, not shipped agents or choices attributed to the user.

## Implementation and verification

- [`src/data/archetypes.ts`](../../src/data/archetypes.ts): six architectural profiles.
- [`src/App.tsx`](../../src/App.tsx): roster, inspection, system map, and phased roadmap.
- Checks: `npm run build` for TypeScript and production bundling; `npm test` for progress behavior.
