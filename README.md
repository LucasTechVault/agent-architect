# Agent Architect

A local visual field guide and progress tracker for six agent archetypes: Orchestrator, Recon Scout, Builder, Critic & Verifier, Box Sentinel, and Memory Curator.

Browse runtime flows, state ownership, tool boundaries, proposed architecture decisions, and an evidence-backed build roadmap.

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

Milestones require evidence before you can mark them complete. **Verified means verified by you**, based on the evidence you enter. Every milestone in an archetype must be complete for its overall status to become Verified. Recommendations remain proposals until you explicitly choose an option.

Progress, decisions, and reflections autosave to browser `localStorage`. Storage belongs to one browser profile and origin; changing the hostname or port may show an empty tracker. Export JSON backups regularly and before clearing browser data. Import validates the backup and asks before replacing current progress. Keep private learning records outside this public source repository.

## Source and decisions

- [`src/data/archetypes.ts`](src/data/archetypes.ts): six role specifications and milestone targets.
- [`src/App.tsx`](src/App.tsx): roster, detail views, system map, roadmap, and backup controls.
- [`src/progress.ts`](src/progress.ts): versioned progress validation and aggregate status.
- [`src/progress.test.ts`](src/progress.test.ts): backup and status regression checks.
- [`docs/adr/0001-initial-architecture.md`](docs/adr/0001-initial-architecture.md): initial separation and application design.
- [`docs/adr/0002-evidence-backed-progress.md`](docs/adr/0002-evidence-backed-progress.md): evidence, explicit decisions, and local persistence.
- [`docs/adr/0003-delivery-and-decision-records.md`](docs/adr/0003-delivery-and-decision-records.md): public delivery, conventional commits, and CI.

See the [ADR index](docs/adr/README.md). Record material architectural changes as short, numbered ADRs with implementation and verification links. Follow [`AGENTS.md`](AGENTS.md) for tested, focused conventional commits and ADR references. GitHub Actions runs tests and the production build on pushes and pull requests.
