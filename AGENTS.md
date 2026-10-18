# Working in Agent Architect

This is the standalone Control Center UI, architecture playbook, and progress tracker (`agent-architect`). Executable runtime code and execution ledgers live in `../agentbox-core`.

- Run `npm run typecheck`, `npm test`, and `npm run build` before any checkpoint review.
- Distinguish user requirements, implementation defaults, and unresolved learner decisions. Never mark learning milestones complete automatically in code.
- Keep credentials, browser progress backups, `node_modules`, and build output (`dist/`) out of source control.
- Never force-push or rewrite published history without explicit authorization.

## Review-Driven Development & Learning Ownership Protocol

Every milestone and checkpoint is synchronized with [`../agentbox-core/docs/CURRICULUM_TRACKER.md`](../agentbox-core/docs/CURRICULUM_TRACKER.md) across our **M0–M5 Curriculum** (**M0 Kernel Foundation → M1 Event-Driven / Ledger Runtime → M2 Control Topologies: Workflow vs. Autonomous ReAct → M3 Graph / State-Machine Runtime → M4 A2A Protocol Runtime → M5 Adversarial Eval Gate**).

At every checkpoint, strictly enforce these mandatory governance rules:

### 1. 10-Line Micro-ADRs (`docs/adr/ADR-XXXX-<slug>.md`)
Every architectural decision or milestone boundary must be recorded in a strict 10-line Micro-ADR (with no blank lines) and indexed in [`docs/adr/README.md`](docs/adr/README.md). Keep `Context`, `Decision`, `Rejected Alternative`, and `Risk` to one high-signal sentence each so the trade-off can be read and owned in 30 seconds:

```text
# ADR-XXXX: Short decision title
Status: Proposed or Accepted with the actual authority stated.
Date: YYYY-MM-DD.
Scope: Milestone/issue, affected modules, and bounded exclusions.
Context: One sentence explaining the architectural constraint or invariant.
Decision: One sentence recording the chosen mechanism and sequence.
Rejected Alternative: One sentence explaining the principal alternative rejected.
Risk: One sentence describing the remaining trade-off or failure exposure.
Implementation: Exact code, test, and documentation paths.
Verification: Exact test/typecheck/build commands and pass counts.
```

### 2. Living Concept Digest (`docs/KEY_CONCEPTS.md`)
Maintain [`docs/KEY_CONCEPTS.md`](docs/KEY_CONCEPTS.md) tracking *what* was implemented and *why*. For every concept implemented at a checkpoint, record a concise 3-bullet entry linked to the exact code and test files:
- **What it is:** Plain-English explanation of the mechanism.
- **Why we used it:** The exact architectural problem or bottleneck it solves.
- **Failure mode without it:** What breaks in production if this mechanism is omitted.

### 3. Checkpoint Pause & Ownership Summary (Milestone Review Packet)
**NEVER auto-commit or jump to the next milestone.** At the end of every checkpoint, STOP and present a **Checkpoint Ownership Summary (Review Packet)** directly in chat containing:
1. **What Was Done & Why:** A concise executive walkthrough of the changes so the owner can understand and take full ownership of the codebase.
2. **Micro-ADR Preview:** The exact text of the newly written or updated 10-line Micro-ADR(s).
3. **Key Concepts Learned:** The inline 3-bullet entries added to `docs/KEY_CONCEPTS.md`.
4. **Executable Verification Receipt:** Exact commands run (`npm test`, `npm run typecheck`, `npm run build`) and pass/fail totals.
5. **Ownership Check Question:** Ask 1 concise architectural trade-off question about the checkpoint to verify understanding before the owner authorizes `git commit`.
