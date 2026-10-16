import type { ArchetypeId } from "./archetypes";

export interface RoadmapIssue {
  id: string;
  title: string;
  components: string[];
  requirements: string[];
  pitfalls: string[];
  takeaway: string;
  verification: string;
}

export interface RoadmapPhase {
  id: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  agents: ArchetypeId[];
  issues: RoadmapIssue[];
}

/** Engineering targets, not an assertion that the corresponding engine work is verified. */
export const roadmapPhases: RoadmapPhase[] = [
  {
    id: 1,
    title: "One bounded run",
    subtitle: "Build the Box + single-worker kernel",
    agents: ["builder"],
    issues: [
      {
        id: "CORE-101",
        title: "Fence Box paths and copy mounted inputs",
        components: [
          "agentbox-core/src/workspace/box-manager.ts",
          "agentbox-core/tests/box-manager.test.ts",
        ],
        requirements: [
          "Validate Box IDs and resolve every tool path against its Box root; reject absolute paths, parent traversal and symlink components.",
          "Preflight file/folder snapshots against entry and byte limits. Copy into a temporary destination and publish only after a complete copy; never overwrite a mounted target.",
          "Keep original user files independent of the Box copy. Define the later container or micro-VM boundary in an ADR before executing untrusted code.",
        ],
        pitfalls: [
          "A string prefix check accepts sibling paths; filesystem checks also have a check/use race when another process can replace parent directories.",
          "Copying a source folder that contains the destination Box can recurse into its own output. Symlinks and special files can escape naïve copying.",
        ],
        takeaway:
          "A path fence constrains cooperating tools; only an OS isolation boundary constrains a hostile process. I separate input snapshots from execution isolation so each guarantee is testable.",
        verification:
          "Attach the commit and traversal/symlink/snapshot test results. Explain which guarantees remain subject to filesystem races.",
      },
      {
        id: "CORE-102",
        title: "Enforce step, token and deadline admission",
        components: [
          "agentbox-core/src/runtime/budget.ts",
          "agentbox-core/src/runtime/runner.ts",
          "agentbox-core/tests/runtime-budget.test.ts",
        ],
        requirements: [
          "Count a step before dispatch and reserve a known token cost or upper bound before paid work. Reject oversized reservations without increasing the counter.",
          "Inject a monotonic clock; race unresolved async work against a deadline and propagate AbortSignal through every tool adapter.",
          "Specify terminal reasons and precedence. Revoke step contexts and reject late tool results after the run ends; never silently claim unused provider capacity was measured usage.",
        ],
        pitfalls: [
          "Promise.race returns control but cannot kill a child process or an infinite JavaScript loop; adapters need their own cancellation implementation.",
          "Retries, input tokens and final synthesis can spend beyond the allowance if they are not reserved before dispatch.",
        ],
        takeaway:
          "A budget is an admission policy, not a counter displayed after the bill arrives. I reserve scarce resources before starting work and make the stop reason part of the API.",
        verification:
          "Link deterministic tests for exact step/token limits, hanging-step timeout, cancellation and absence of events after termination.",
      },
      {
        id: "CORE-103",
        title: "Persist ordered execution events with one writer",
        components: [
          "agentbox-core/src/ledger/event-log.ts",
          "agentbox-core/tests/event-log.test.ts",
        ],
        requirements: [
          "Persist typed JSONL envelopes with monotonic sequence, Box/run identity and event timestamp; validate both envelope and payload when reopening.",
          "Serialize appends behind an exclusive cooperating-writer lock, finish short writes, flush records and return immutable event objects.",
          "Fail closed on a partial tail or invalid sequence. Define explicit stale-lock inspection and recovery rather than silently truncating history.",
        ],
        pitfalls: [
          "A crash can leave a lock file or partial record. A second process that ignores the lock can still corrupt a local file.",
          "An append-only log does not automatically provide tamper resistance, redaction, filesystem snapshots or deterministic replay.",
        ],
        takeaway:
          "The ledger explains what happened; state is a projection of those facts. Durability, replay and tamper resistance are separate guarantees with separate costs.",
        verification:
          "Attach append/reopen ordering, writer-exclusion, malformed-payload and partial-record tests plus the recovery ADR.",
      },
      {
        id: "CORE-104",
        title: "Give the Builder a scoped staging transaction",
        components: [
          "agentbox-core/src/agents/builder.ts (planned)",
          "agentbox-core/src/workspace/staging-transaction.ts (planned)",
          "agentbox-core/src/tools/apply-patch.ts (planned)",
        ],
        requirements: [
          "Create a disposable worktree or staging copy from an immutable base revision; grant writes only to the leased path set.",
          "Expose schema-validated read, search and patch tools through the existing runner allowlist. Return a StagedPatch carrying base revision, changed paths and content digest.",
          "Keep every ReAct iteration inside the run budget and retain rejected patches for diagnosis; canonical source is promoted only through a later verification gate.",
        ],
        pitfalls: [
          "Multiple workers sharing a Git index can race even when they edit different files; give each staging transaction its own index/worktree.",
          "Instructions embedded in repository files are task data. They must not broaden capability grants or replace the requested objective.",
        ],
        takeaway:
          "The model proposes a patch within a transaction; it never owns the canonical workspace. This separates creative repair from the authority to publish changes.",
        verification:
          "Link a fixture proving out-of-scope writes fail and a rejected staging transaction leaves canonical files unchanged.",
      },
      {
        id: "CORE-105",
        title: "Add a model gateway and bounded context assembly",
        components: [
          "agentbox-core/src/gateway/model-router.ts (planned)",
          "agentbox-core/src/context/builder-context.ts (planned)",
          "agentbox-core/src/runtime/types.ts",
        ],
        requirements: [
          "Put provider calls behind one typed gateway with request IDs, input-token estimation, capped output and reservation before dispatch.",
          "Classify retryable transport/rate-limit errors, use bounded backoff and account for every attempt under the same run allowance.",
          "Build context from the objective, file map, cited slices and current diagnostics. Bound bytes/tokens and preserve revision provenance when summarizing history.",
        ],
        pitfalls: [
          "An SDK retry layer plus an application retry layer can multiply calls and costs. Centralize retry ownership.",
          "Dumping the whole repository into context hides relevant evidence, increases cost and lets stale summaries become authoritative.",
        ],
        takeaway:
          "Provider access is a resource boundary. I route intelligence according to measured task needs and treat context selection as an engineering decision, not unlimited prompt storage.",
        verification:
          "Attach fake-provider tests for rate-limit backoff, exhausted reservations, output caps and revision-aware context truncation.",
      },
    ],
  },
  {
    id: 2,
    title: "Earn the right to merge",
    subtitle: "Add the Builder ↔ Critic dyad",
    agents: ["critic"],
    issues: [
      {
        id: "CORE-201",
        title: "Validate staged patch identity and scope",
        components: [
          "agentbox-core/src/workspace/staging-transaction.ts (planned)",
          "agentbox-core/src/contracts/staged-patch.ts (planned)",
        ],
        requirements: [
          "Define StagedPatch with task ID, base revision, scoped file list and a digest of the actual staged contents.",
          "Validate patch paths, file modes and size limits before applying it to an isolated verification checkout.",
          "Bind every subsequent check to this exact candidate digest; invalidate prior results whenever staged content changes.",
        ],
        pitfalls: [
          "A receipt for revision A says nothing about a later edit B; mutable worktrees create a verification/publication race.",
          "Text diffs can hide executable-bit changes, symlink replacements, generated artifacts and unexpected binary files.",
        ],
        takeaway:
          "Approval belongs to a specific artifact identity, not to a worker's confidence. I validate the exact bytes and scope that will be promoted.",
        verification:
          "Attach tests rejecting path escapes, modified candidate digests and receipts referring to a different base revision.",
      },
      {
        id: "CORE-202",
        title: "Run deterministic checks inside a bounded executor",
        components: [
          "agentbox-core/src/tools/command-runner.ts (planned)",
          "agentbox-core/src/tools/process-supervisor.ts (planned)",
          "agentbox-core/workspaces/box-sample/tests/invoice.test.mjs",
        ],
        requirements: [
          "Accept allowlisted executable/argument arrays rather than arbitrary shell interpolation; set cwd and environment from the verification lease.",
          "Enforce process-tree deadlines, output-byte limits and cleanup on cancellation. Capture exit code, signal, duration and truncated-log metadata.",
          "Execute candidate tests in the chosen OS sandbox with defined network/filesystem policy; distinguish test failure from infrastructure failure.",
        ],
        pitfalls: [
          "Killing only the parent leaves child processes alive. Cancellation must reap descendants and release worktree resources.",
          "Test code is executable code; a read-only verifier role does not make running repository tests safe on the host.",
        ],
        takeaway:
          "A deterministic test is a useful acceptance oracle only when its execution environment and failure categories are controlled. Safety belongs to the executor, not a role label.",
        verification:
          "Link fixtures for failing tests, a hanging child process, output overflow and cancellation cleanup with no surviving processes.",
      },
      {
        id: "CORE-203",
        title: "Route the Critic through tests and a structured judge",
        components: [
          "agentbox-core/src/agents/critic-verifier.ts (planned)",
          "agentbox-core/src/contracts/verification-receipt.ts (planned)",
          "agentbox-core/src/ledger/event-log.ts",
        ],
        requirements: [
          "Route first through deterministic scope, syntax and test checks; invoke a bounded model judge only for explicitly specified semantic criteria.",
          "Require schema-valid APPROVED/REJECTED receipts with candidate digest, task ID, checks, evidence pointers and unresolved findings.",
          "Treat malformed judge output and unavailable required checks as rejection or an explicit indeterminate state; never convert a plausible narrative into approval.",
        ],
        pitfalls: [
          "A test suite can pass while the requested behavior is missing; a model judge can confidently approve a superficially convincing diff.",
          "Giving the Critic source-write tools lets it repair the candidate and approve different bytes in the same step.",
        ],
        takeaway:
          "Verification combines independent evidence sources with explicit authority. Deterministic gates carry the invariants; a model judge addresses bounded ambiguity rather than overriding failed checks.",
        verification:
          "Attach golden cases measuring false approvals/rejections and schema tests that reject missing evidence or mismatched candidate identity.",
      },
      {
        id: "CORE-204",
        title: "Promote an approved candidate atomically",
        components: [
          "agentbox-core/src/workspace/promote.ts (planned)",
          "agentbox-core/src/contracts/verification-receipt.ts (planned)",
          "agentbox-core/src/ledger/event-log.ts",
        ],
        requirements: [
          "Accept promotion only with an authorized receipt for the exact candidate digest and base revision; compare the canonical head immediately before publishing.",
          "Serialize publication per Box and make promotion idempotent with a transaction ID. Record the accepted revision and receipt in the ledger.",
          "Define crash recovery between workspace publication and event persistence; a repeated request must discover the existing outcome rather than apply the patch twice.",
        ],
        pitfalls: [
          "A canonical branch can move after verification. Rechecking only the patch digest misses the stale base.",
          "A filesystem update and JSONL append are not one atomic database transaction; recovery needs a durable transaction protocol.",
        ],
        takeaway:
          "The last permission check belongs at the commit point. I use artifact identity, compare-and-swap and idempotency to close the gap between verification and publication.",
        verification:
          "Attach concurrent-promotion, stale-base, duplicate-request and injected-crash recovery tests.",
      },
      {
        id: "CORE-205",
        title: "Bound the Builder–Critic repair cycle",
        components: [
          "agentbox-core/src/runtime/repair-cycle.ts (planned)",
          "agentbox-core/src/runtime/budget.ts",
          "agentbox-core/src/agents/builder.ts (planned)",
        ],
        requirements: [
          "Feed rejected findings back as typed, cited repair requests without granting the Builder additional capabilities.",
          "Apply a repair-attempt cap and a shared parent budget across Builder, tests and judge calls; record every candidate lineage and rejection reason.",
          "Detect unchanged candidate digests and repeated failures. Terminate with the best available evidence when no progress or allowance remains.",
        ],
        pitfalls: [
          "Giving each retry a fresh full budget makes the overall run unbounded even when each individual agent appears compliant.",
          "A noisy or flaky check can cause oscillating patches; preserve failure classification rather than blindly retrying.",
        ],
        takeaway:
          "A critic loop is a bounded search process. Shared budgets, candidate lineage and a no-progress rule prevent feedback from becoming an infinite argument.",
        verification:
          "Link an always-rejecting fake Critic test and a repeated-digest fixture proving retries stop within the parent allowance.",
      },
    ],
  },
  {
    id: 3,
    title: "Coordinate with intent",
    subtitle: "Add orchestration + parallel recon",
    agents: ["orchestrator", "scout"],
    issues: [
      {
        id: "CORE-301",
        title: "Make the task graph a validated state machine",
        components: [
          "agentbox-core/src/orchestration/task-graph.ts (planned)",
          "agentbox-core/src/agents/orchestrator.ts (planned)",
          "agentbox-core/src/ledger/event-log.ts",
        ],
        requirements: [
          "Define task dependencies, acceptance criteria and legal pending → leased → completed/failed transitions in code; reject cycles before dispatch.",
          "Make the Orchestrator the sole logical graph writer. Validate model-proposed plans and worker receipts as inputs rather than executable state mutations.",
          "Project graph state from ordered events and test replay against a known final state, including rejection of invalid transitions.",
        ],
        pitfalls: [
          "Two workers reporting completion concurrently can release a dependent task twice without serialized graph updates.",
          "A model-generated DAG can contain missing prerequisites or cycles even when its JSON schema is valid.",
        ],
        takeaway:
          "Coordination is a state-consistency problem before it is a prompting problem. I let models suggest work while deterministic code owns legal transitions.",
        verification:
          "Attach transition-table, cycle-detection, duplicate-receipt and projection-replay tests.",
      },
      {
        id: "CORE-302",
        title: "Lease tasks with shared resource reservations",
        components: [
          "agentbox-core/src/contracts/task-lease.ts (planned)",
          "agentbox-core/src/orchestration/dispatcher.ts (planned)",
          "agentbox-core/src/runtime/budget.ts",
        ],
        requirements: [
          "Issue TaskLease payloads with task/run identity, workspace revision, capabilities, expiry and a fresh unique lease ID for each assignment.",
          "Reserve parent step/token capacity atomically before parallel dispatch and enforce per-role plus per-Box concurrency caps.",
          "Expire or cancel leases idempotently; reject receipts carrying a superseded lease ID while retaining them as historical observations.",
        ],
        pitfalls: [
          "Independent workers can each observe the same remaining budget and oversubscribe it without an atomic reservation owner.",
          "A timed-out worker may finish after a replacement; accepting its stale receipt can overwrite newer state.",
        ],
        takeaway:
          "A lease grants temporary authority tied to an assignment identity and budget. Fencing stale workers protects state even when cancellation cannot stop their computation immediately.",
        verification:
          "Link concurrent reservation and superseded-lease tests showing no overspend or duplicate accepted task result.",
      },
      {
        id: "CORE-303",
        title: "Implement a strictly read-only Recon tool surface",
        components: [
          "agentbox-core/src/agents/recon-scout.ts (planned)",
          "agentbox-core/src/tools/repository-search.ts (planned)",
          "agentbox-core/src/workspace/box-manager.ts",
        ],
        requirements: [
          "Expose bounded list_tree, read_file, ripgrep and ast_symbols adapters under a read-only snapshot lease; exclude arbitrary shell and all mutations.",
          "Set limits for searches, files, bytes, result count and model iterations; propagate cancellation to search processes.",
          "Return partial findings and explicit unanswered questions on exhaustion. Treat source comments and tool output as untrusted evidence.",
        ],
        pitfalls: [
          "A nominal search command can expose shell execution if arguments are interpolated into a command string.",
          "Generated files, vendor directories and huge matches can consume context and output budgets before relevant source is reached.",
        ],
        takeaway:
          "Least privilege reduces both damage and reasoning burden. A Scout gathers facts through a narrow, bounded surface and cannot convert discovery into mutation.",
        verification:
          "Attach forbidden-tool, search-output cap, source-injection and cancellation tests against a fixture repository.",
      },
      {
        id: "CORE-304",
        title: "Create immutable, revision-bound evidence bundles",
        components: [
          "agentbox-core/src/contracts/evidence-bundle.ts (planned)",
          "agentbox-core/src/context/source-slice.ts (planned)",
          "agentbox-core/src/agents/recon-scout.ts (planned)",
        ],
        requirements: [
          "Define EvidenceBundle citations with file path, line/symbol range, content hash, snapshot revision, claim and uncertainty.",
          "Validate citations against the leased snapshot and pass compact evidence pointers to workers; retrieve raw slices only within a context allowance.",
          "Deduplicate overlapping results and reject stale bundles after the canonical revision changes. Keep missing evidence visible rather than synthesizing citations.",
        ],
        pitfalls: [
          "Line numbers drift across edits; a plausible path and range alone do not prove the cited text matches the current artifact.",
          "Summaries can erase uncertainty or mix facts from different revisions if provenance is not preserved during compression.",
        ],
        takeaway:
          "A handoff is a provenance contract. Small, revision-bound evidence can be checked and refreshed; an uncited narrative cannot safely become another agent's ground truth.",
        verification:
          "Link stale-citation and hash-mismatch tests plus a held-out repository evaluation of citation precision and evidence coverage.",
      },
      {
        id: "CORE-305",
        title: "Fan out Recon and reconcile before mutation",
        components: [
          "agentbox-core/src/orchestration/fanout.ts (planned)",
          "agentbox-core/src/orchestration/reconciler.ts (planned)",
          "agentbox-core/src/agents/orchestrator.ts (planned)",
        ],
        requirements: [
          "Divide independent evidence questions into bounded Scout tasks and gather results with explicit success, partial, failure and timeout states.",
          "Reconcile duplicate or contradictory claims before dispatching a Builder. Serialize conflicting write scopes or assign independent staging transactions.",
          "Emit causal task/lease IDs for fan-out and fan-in, and preserve deterministic acceptance order even when worker completion order varies.",
        ],
        pitfalls: [
          "Waiting for every child can stall useful progress; returning at the first result can omit a required dependency.",
          "Parallelism reduces wall time only when shared token, process and write-conflict bottlenecks are controlled.",
        ],
        takeaway:
          "Parallel agents trade latency for coordination cost. I parallelize independent reads and reconcile evidence before granting write authority.",
        verification:
          "Attach an instrumented concurrency-cap test and shuffled-completion fixtures producing the same accepted task state.",
      },
    ],
  },
  {
    id: 4,
    title: "React, then remember",
    subtitle: "Add the Sentinel + Memory Curator",
    agents: ["sentinel", "curator"],
    issues: [
      {
        id: "CORE-401",
        title: "Route typed lifecycle events without model polling",
        components: [
          "agentbox-core/src/agents/box-sentinel.ts (planned)",
          "agentbox-core/src/contracts/sentinel-alert.ts (planned)",
          "agentbox-core/src/observability/incident-policy.ts (planned)",
        ],
        requirements: [
          "Define SentinelAlert envelopes with run identity, source, causal ID, observation timestamp and deduplication key.",
          "Route filesystem/process/telemetry events through deterministic policy; wake a model only for an explicitly allowed incident class with a reserved budget.",
          "Bound queue depth, coalescing windows and retries. Emit an overflow signal and reconciliation request instead of silently dropping state changes.",
        ],
        pitfalls: [
          "A burst of file saves can create duplicate work or wake a replacement run using an old run's events.",
          "Zero idle model tokens still uses watcher CPU, memory and file descriptors; account for those operational resources separately.",
        ],
        takeaway:
          "A reactive system waits on signals rather than asking a model whether something happened. Typed events and deterministic routing make idle cost and wake authority explicit.",
        verification:
          "Attach burst-deduplication, stale-run and queue-overflow tests plus a measured idle interval with zero model calls.",
      },
      {
        id: "CORE-402",
        title: "Reconcile watchers across restarts and missed events",
        components: [
          "agentbox-core/src/observability/filesystem-watcher.ts (planned)",
          "agentbox-core/src/observability/reconciler.ts (planned)",
          "agentbox-core/src/agents/box-sentinel.ts (planned)",
        ],
        requirements: [
          "Subscribe only to leased Box paths and tracked processes; release every watcher/subscription on cancellation or shutdown.",
          "Persist a bounded observer cursor and workspace fingerprint. Rescan on startup, watcher failure and queue overflow.",
          "Treat notifications as hints and compare current state before emitting a lifecycle transition; cap reconciliation scan size and frequency.",
        ],
        pitfalls: [
          "Filesystem watchers may coalesce, reorder or miss notifications, and their semantics vary across platforms and mounted filesystems.",
          "A growing set of abandoned watchers can exhaust file descriptors even while model token usage remains zero.",
        ],
        takeaway:
          "Events provide responsiveness; reconciliation provides correctness. I recover state from observable facts rather than assuming the notification stream is complete.",
        verification:
          "Link restart-after-change, forced-overflow and resource-cleanup tests showing a missed event is eventually reconciled.",
      },
      {
        id: "CORE-403",
        title: "Define scoped, provenance-bound memory entries",
        components: [
          "agentbox-core/src/contracts/curated-memory-entry.ts (planned)",
          "agentbox-core/src/memory/entry-store.ts (planned)",
          "agentbox-core/src/memory/scope-policy.ts (planned)",
        ],
        requirements: [
          "Define CuratedMemoryEntry with problem, repair, constraints, source receipt, environment/version, disclosure scope and lifecycle status.",
          "Separate Box-local records from shared sanitized lessons and enforce scope filters before retrieval, including metadata and embedding candidates.",
          "Require a finalized verified source before promotion; retain versioned provenance and retire contradicted lessons without rewriting historical events.",
        ],
        pitfalls: [
          "Retrieval-time text filtering cannot repair a private document already exposed through an unscoped vector index or result metadata.",
          "A successful repair may depend on a specific dependency version; dropping applicability constraints turns memory into stale advice.",
        ],
        takeaway:
          "Memory is a governed publication surface, not an unrestricted transcript archive. Scope, provenance and applicability travel with every reusable lesson.",
        verification:
          "Attach cross-Box leakage, missing-receipt, retired-version and environment-mismatch retrieval tests.",
      },
      {
        id: "CORE-404",
        title: "Run idempotent post-run curation with redaction gates",
        components: [
          "agentbox-core/src/agents/memory-curator.ts (planned)",
          "agentbox-core/src/memory/job-store.ts (planned)",
          "agentbox-core/src/policy/redaction.ts (planned)",
        ],
        requirements: [
          "Queue finalized run IDs with idempotency keys, bounded batch/token sizes, retry limits and inspectable dead-letter outcomes.",
          "Distill accepted repairs and useful failed attempts into candidates; attach verified evidence, deduplicate and run disclosure/redaction checks before publication.",
          "Publish through a scoped promotion API and make repeated jobs converge on one versioned lesson rather than duplicating memory.",
        ],
        pitfalls: [
          "A model-generated summary can retain credentials, private paths or fabricated causal claims even when the source run succeeded.",
          "At-least-once job delivery duplicates lessons unless both candidate creation and publication are idempotent.",
        ],
        takeaway:
          "Post-run learning is an asynchronous data pipeline. I apply the same idempotency, validation and disclosure boundaries used for any durable derived dataset.",
        verification:
          "Link duplicate-job, seeded-secret, unverified-claim and exhausted-retry fixtures with no unauthorized memory publication.",
      },
      {
        id: "CORE-405",
        title: "Evaluate the crew with trace-linked benchmark Boxes",
        components: [
          "agentbox-core/src/evaluation/box-suite.ts (planned)",
          "agentbox-core/src/observability/metrics.ts (planned)",
          "agentbox-core/src/ledger/event-log.ts",
        ],
        requirements: [
          "Build versioned fixture Boxes with deterministic file-state/test assertions and bounded semantic rubrics. Separate development tasks from held-out evaluation.",
          "Trace task/lease/candidate lineage and record tokens, latency, tool failures, citation precision, patch acceptance, false approvals and memory retrieval quality.",
          "Measure repeated runs across failure cases and compare against the single-worker baseline under the same budget; preserve raw receipts for audit.",
        ],
        pitfalls: [
          "More agents can improve a curated demo while reducing reliability or increasing cost on the held-out distribution.",
          "A single aggregate success rate hides dangerous false approvals, flaky checks and regressions concentrated in one task category.",
        ],
        takeaway:
          "Architecture earns complexity through measured outcomes. I compare quality, latency, cost and failure modes against a simpler baseline before expanding the crew.",
        verification:
          "Attach a reproducible benchmark report, fixture version and trace IDs covering success, budget stops, stale artifacts and adversarial inputs.",
      },
    ],
  },
];

export const roadmapIssues: RoadmapIssue[] = roadmapPhases.flatMap(
  (phase) => phase.issues,
);
