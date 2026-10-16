# Agent Architect

A local engineering knowledge vault and progress tracker for six agent archetypes: Orchestrator, Recon Scout, Builder, Critic & Verifier, Box Sentinel, and Memory Curator.

Browse a compact nine-block technical specification and topology inspector backed by shared typed data. Track 20 engineering issues across four phases, record evidence and decisions, and edit your own architecture takeaways.

## Run

Requires Node.js 22 or later and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Other commands:

```sh
npm test
npm run build
npm run preview
```

## Progress and project boundaries

This is a standalone repository, separate from `agentbox-core`. The guide describes architectural targets; it does not execute agents, inspect engine code, or synchronize engine status.

Milestones and engineering issues require evidence before completion. **Verified means verified by you**, based on the evidence you enter. Every milestone in an archetype must be complete for its overall status to become Verified; issue progress is tracked separately. Takeaways require nonblank text before marking them reviewed. Recommendations remain proposals until you explicitly choose an option. Technical specifications describe learning targets rather than guarantees already implemented in `agentbox-core`.

Progress, decisions, reflections, issue notes, and takeaways autosave to browser `localStorage`. Storage belongs to one browser profile and origin; changing the hostname or port may show an empty tracker. Existing v1 records and backups migrate to v2 with their original fields preserved; exports use v2. Export JSON backups regularly and before clearing browser data. Import accepts backups up to 8 MB, validates their records, and asks before replacing current progress. Keep private learning records outside this public source repository.

## Source and decisions

- [`src/data/archetypes.ts`](src/data/archetypes.ts): six role specifications and milestone targets.
- [`src/data/engineering-specs.ts`](src/data/engineering-specs.ts): shared nine-block specifications and typed handoff schemas.
- [`src/data/roadmap.ts`](src/data/roadmap.ts): four phases and 20 engineering issues.
- [`src/components/EngineeringSheet.tsx`](src/components/EngineeringSheet.tsx), [`SpecProperties.tsx`](src/components/SpecProperties.tsx), and [`Roadmap.tsx`](src/components/Roadmap.tsx): reusable reference and tracking views.
- [`src/App.tsx`](src/App.tsx): technical reference, system map, roadmap, takeaways, and backup controls.
- [`src/progress.ts`](src/progress.ts): versioned progress validation and aggregate status.
- [`src/progress.test.ts`](src/progress.test.ts): backup and status regression checks.
- [`docs/adr/0001-initial-architecture.md`](docs/adr/0001-initial-architecture.md): initial separation and application design.
- [`docs/adr/0002-evidence-backed-progress.md`](docs/adr/0002-evidence-backed-progress.md): evidence, explicit decisions, and local persistence.
- [`docs/adr/0003-delivery-and-decision-records.md`](docs/adr/0003-delivery-and-decision-records.md): public delivery, conventional commits, and CI.
- [`docs/adr/0004-engineering-knowledge-vault.md`](docs/adr/0004-engineering-knowledge-vault.md): technical vault and compatible progress migration.

See the [ADR index](docs/adr/README.md). Record material architectural changes as short, numbered ADRs with implementation and verification links. Follow [`AGENTS.md`](AGENTS.md) for tested, focused conventional commits and ADR references. GitHub Actions runs tests and the production build on pushes and pull requests.
