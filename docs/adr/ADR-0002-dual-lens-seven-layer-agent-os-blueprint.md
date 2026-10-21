# ADR-0002: Minimalist 7-Concept Architecture Map Landing Page and Blueprint Vault
Status: Accepted by owner at architecture-map landing page checkpoint.
Date: 2026-10-21.
Scope: Minimalist white interactive architecture map (src/components/LandingPage.tsx) and detailed 7-Layer Blueprint (src/components/AgentOsBlueprint.tsx) in agent-architect.
Context: A flat 7-row checklist hid the spatial structure of the agent system (L1 entry, L2..L6 cyclic loop with loop-control gate and multi-point L5 hooks, and L7 cross-cutting telemetry).
Decision: Render the default home screen (#overview) as a clean white 3-region architecture map (Region A: L1 Entry; Region B: 3x2 Cyclic Execution Loop + Gate; Region C: L7 Rail) with compact status popovers and deep links to #blueprint?layer=L1..L7.
Rejected Alternative: Reject a flat 7-row checklist on the home screen or exposing dense contracts, code blocks, and recall timers on initial load.
Risk: Maintaining separate localStorage keys for manual study status and recall-verified mastery requires keeping the unnumbered loop-control gate excluded from progress counts.
Implementation: src/components/LandingPage.tsx, src/components/AgentOsBlueprint.tsx, src/data/agent-os-layers.ts, src/App.tsx, src/styles.css, and src/data/agent-os-layers.test.ts.
Verification: Vitest suite (63 tests across 4 files), TypeScript strict check (npm run typecheck), production build (npm run build), and 1440px/390px viewport checks pass.
