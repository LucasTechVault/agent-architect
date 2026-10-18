# Key Concepts Digest (Agent Architect Playbook)

This living digest records the architectural and verification mechanisms implemented in `agent-architect` and synchronized with [`../agentbox-core/docs/KEY_CONCEPTS.md`](../../agentbox-core/docs/KEY_CONCEPTS.md). Every concept uses our mandatory 3-bullet format (**What it is**, **Why we used it**, **Failure mode without it**) linked to executable source and test files.

---

## M0: Control-Plane Playbook & Curriculum Baseline (Live & Verified)

### 1. Evidence-Gated Progress Persistence

- **What it is:** A strict state validator ([`parseProgress`](../src/progress.ts#L77-L159) in [`src/progress.ts`](../src/progress.ts) and [`Roadmap.tsx`](../src/components/Roadmap.tsx#L21-L24)) that refuses to mark any milestone, roadmap issue, or architectural takeaway as `complete` / `Verified` unless non-whitespace verification evidence (such as a commit SHA or test receipt) is attached ([`src/progress.test.ts`](../src/progress.test.ts#L178-L193)).
- **Why we used it:** Enforces that UI progress reflects real engineering proof from `agentbox-core` rather than wishful checkbox clicking, while stripping untrusted or malformed keys on backup import ([`src/progress.test.ts`](../src/progress.test.ts#L105-L129)).
- **Failure mode without it:** Learners or automated scripts can check off unimplemented milestones without proof, or a corrupted/tampered JSON import can poison browser storage and crash the application.

### 2. In-Memory TypeScript Compiler Verification for Role Schemas

- **What it is:** A virtual compiler harness ([`compileSchemas`](../src/data/engineering-specs.test.ts#L19-L72) in [`src/data/engineering-specs.test.ts`](../src/data/engineering-specs.test.ts)) that compiles all 12 displayed TypeScript input/output contract snippets (`TaskLease`, `EvidenceBundle`, `StagedPatch`, `VerificationReceipt`, `SentinelAlert`, `CuratedMemoryEntry`) against `lib.es2022.d.ts` using `ts.createProgram` with `strict: true` and `noEmit: true`.
- **Why we used it:** Guarantees that the contract schemas displayed in the playbook UI are semantically valid TypeScript interfaces ready for adoption in `agentbox-core` (M1–M4), catching unresolved type references (`TS2304`) or type mismatches (`TS2322`) during `npm test` ([`src/data/engineering-specs.test.ts`](../src/data/engineering-specs.test.ts#L163-L219)).
- **Failure mode without it:** Documentation schemas drift into invalid pseudo-TypeScript with missing fields or broken references that fail to compile when implemented in `agentbox-core`.

### 3. Orthogonal Control Topology vs. Execution Runtime Mapping

- **What it is:** Explicit architectural classification in [`src/data/archetypes.ts`](../src/data/archetypes.ts), [`src/data/engineering-specs.ts`](../src/data/engineering-specs.ts), and [`src/data/roadmap.ts`](../src/data/roadmap.ts) that separates *who decides the next step* (**Control Topology:** `Deterministic Workflow` vs. `Autonomous Agent`) from *how the engine executes and coordinates state* (**Execution Runtime:** `Event-Driven / Append-Only Ledger`, `ReAct Loop`, `Graph / State-Machine`, `A2A Protocol`) across Milestones **M0–M5** ([`ADR-0001`](adr/ADR-0001-curriculum-and-playbook-synchronization.md)).
- **Why we used it:** Prevents conflating an agent's persona (e.g., Critic or Orchestrator) with its underlying execution mechanics, making it clear when deterministic code owns routing versus when a model dynamically selects tools inside a bounded loop.
- **Failure mode without it:** Systems use expensive, non-deterministic autonomous loops for tasks that should be code-routed workflows (like verification gates or post-run memory pipelines), or omit A2A lease/receipt contracts when handing off work between agents.
