# ADR-0001: Synchronize playbook specifications with M0–M5 topologies and runtimes
Status: Accepted by owner for clean-slate M0–M5 synchronization.
Date: 2026-10-18.
Scope: Align agent-architect archetypes, 9-block specs, and roadmap issues with the M0–M5 curriculum in agentbox-core.
Context: Grouping specifications only by role personas hid how each agent maps to Control Topologies (Deterministic Workflow vs. Autonomous Agent) and Execution Runtimes (Event-Driven Ledger, ReAct, Graph, A2A).
Decision: Tag every archetype, specification, and roadmap issue with its explicit Control Topology, Execution Runtime, and M0–M5 curriculum milestone while preserving v1/v2 localStorage progress compatibility.
Rejected Alternative: Reject breaking existing CORE-101..CORE-405 issue keys or coupling the browser UI directly to runtime filesystem state.
Risk: Maintaining both role-level views and M0–M5 milestone mappings requires keeping roadmap metadata synchronized at each checkpoint review.
Implementation: AGENTS.md, docs/KEY_CONCEPTS.md, package.json, src/data/archetypes.ts, src/data/engineering-specs.ts, src/data/roadmap.ts, and src/data/roadmap.test.ts.
Verification: Playbook npm test, npm run typecheck, and npm run build pass with semantic compilation of all 12 role I/O schemas.
