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

---

## Front-Page Blueprint: Dual-Lens 7-Layer Agent OS & Invariant Vault (Live & Verified)

### 4. Dual-Lens 7-Layer Agent OS Topology (Cyclic Runtime Loop vs. Inverted 4-Step Build Order)

- **What it is:** A dual-mode architectural blueprint ([`src/data/agent-os-layers.ts`](../src/data/agent-os-layers.ts#L113-L592) and [`src/components/AgentOsBlueprint.tsx`](../src/components/AgentOsBlueprint.tsx#L289-L324)) that separates **Lens 1: Runtime Execution Loop & Bus** (`L1` Entry Control Plane $\rightarrow$ Cyclic `L2..L6` Loop with SVG Observation Return Arc $\rightarrow$ Cross-Cutting `L7` Foundation Rail) from **Lens 2: Sequential Project Build Order** (Step 1: `L7 + L6` Test Bench & Hands First $\rightarrow$ Step 2: `L4 + L3 + L2` Minimal Loop $\rightarrow$ Step 3: `L2 + L5` Durable & Policy Hardening $\rightarrow$ Step 4: `L1` Multi-Agent Scale Last) ([`ADR-0002`](adr/ADR-0002-dual-lens-seven-layer-agent-os-blueprint.md)).
- **Why we used it:** Resolves the Runtime vs. Build Order paradox: at runtime an agent enters at `L1`, cycles through `L2–L6` until one of 3 explicit termination conditions fires (`✅ Terminal Answer`, `🛑 Budget Exhausted`, `⏸️ Async HITL Interrupt`), and emits spans into `L7`; when implementing from scratch, you must build `L7` (golden fixtures) and `L6` (service facades) first.
- **Failure mode without it:** Drawing `L1`–`L7` as a one-way linear stack misleads engineers into building `L1` multi-agent orchestrators first before having `L7` evaluation fixtures or `L6` contract-tested tools, while hiding the `L6 → L2/L3` observation return edge that drives multi-turn execution.

### 5. Multi-Point L5 Guardrail Hooks & Separated L4 vs. L6 Error Taxonomies

- **What it is:** Explicit boundary definitions in [`src/data/agent-os-layers.ts`](../src/data/agent-os-layers.ts#L89-L111) and [`src/components/AgentOsBlueprint.tsx`](../src/components/AgentOsBlueprint.tsx#L518-L558) that position `L5` across 3 enforcement hooks (`Hook 1: Pre-Inference Input Rail` on `L3→L4`, `Hook 2: Pre-Tool Action Gate` on `L4→L6`, `Hook 3: Post-Tool Output Taint` on `L6→L2/L3`) and separate `L4` compute transport errors (`HTTP 429` rate limits, `503` overloaded, fallback routing) from `L6` tool errors (*Retryable Downstream I/O Blips* vs. *Model-Correctable Argument Failures*).
- **Why we used it:** Ensures security policy is enforced in deterministic host code at all three trust boundaries (input spotlighting, pre-mutation IAM/HITL, and post-tool taint stripping) and prevents `L6` adapters from blindly retrying invalid LLM arguments or leaking raw HTTP `429` provider logic into tool drivers.
- **Failure mode without it:** Untrusted tool outputs (`state.tainted = True`) trigger unapproved write/egress calls on subsequent turns, or `L6` adapters waste retry budgets re-sending malformed LLM tool arguments that require `L3` observation feedback for model self-correction.

### 6. Earned Mastery via 60s Cold Recall Gate

- **What it is:** An interactive recall verification gate ([`evaluateRecallAttempt`](../src/components/AgentOsBlueprint.tsx#L102-L111) and [`loadLayerMastery`](../src/components/AgentOsBlueprint.tsx#L64-L100) in [`src/components/AgentOsBlueprint.tsx`](../src/components/AgentOsBlueprint.tsx#L943-L1118), tested in [`src/data/agent-os-layers.test.ts`](../src/data/agent-os-layers.test.ts#L80-L124)) that blurs the Port Invariants & 10% Contract (`filter: blur(7px)`), starts a 60-second timer, and requires typing the 3-Box Boundary Flow plus 2 Key Invariants before revealing a side-by-side comparison and unlocking `✅ Lock In Layer Mastery`.
- **Why we used it:** Replaces passive 1-click self-marking with active retrieval practice on the non-negotiable port invariants and failure modes of each layer (`L1`–`L7`).
- **Failure mode without it:** Engineers skim architectural diagrams with an illusion of competence (`7/7` checked off passively) but cannot recall the write-ahead `idempotency_key` formula, prefix-caching invariant, or `pass^k` evaluation rule under production design pressure.
