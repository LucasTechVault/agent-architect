# ADR-0002: Dual-Lens 7-Layer Agent OS Blueprint and 60s Cold Recall Gate
Status: Accepted by owner at front-page blueprint checkpoint.
Date: 2026-10-21.
Scope: Front-page 7-Layer Agent OS Blueprint (L1–L7), Dual-Lens mode switcher, and Cold Recall Mastery Vault in agent-architect.
Context: Drawing L1–L7 as a one-way linear stack hid the cyclic L2..L6 observation return arc, multi-point L5 hooks, separated L4 vs. L6 error taxonomies, and the paradox between runtime execution order and bottom-up build order.
Decision: Render the Agent Architect front page in an FT Editorial Warm Paper dual-lens layout (Mode 1: L1 Entry + Cyclic L2..L6 Loop + Cross-Cutting L7 Rail; Mode 2: 4-Step Build Order starting with L7+L6) gated by a 60s Cold Recall test.
Rejected Alternative: Reject a linear 1-to-7 waterfall diagram, physics-simulation node graphs, or passive 1-click mastery checkboxes that bypass active recall of port invariants.
Risk: Enforcing active 60s Cold Recall before locking in layer mastery adds deliberate friction compared to passive reading, requiring clear side-by-side rubric feedback.
Implementation: src/data/agent-os-layers.ts, src/components/AgentOsBlueprint.tsx, src/App.tsx, src/styles.css, and src/data/agent-os-layers.test.ts.
Verification: Vitest suite (61 tests across 4 files), TypeScript strict check (npm run typecheck), and production bundle build (npm run build) pass.
