import type { ArchetypeId } from "./archetypes";

export type EngineeringBlockId =
  | "boundary"
  | "model"
  | "context"
  | "tools"
  | "control"
  | "contracts"
  | "recovery"
  | "budgets"
  | "evaluation";

export interface EngineeringBlock {
  id: EngineeringBlockId;
  title: string;
  subtitle: string;
  decision: string;
  mechanics: string[];
  tradeoff: string;
  implementation: string[];
  verification: string;
}

export interface EngineeringSpec {
  modulePath: string;
  runtimePattern: string;
  stateMutability: string;
  tokenBudgetTier: string;
  verificationGate: string;
  version: string;
  implementation: "Scaffold only" | "Planned";
  blocks: EngineeringBlock[];
  inputSchema: string;
  outputSchema: string;
}

const core = "agentbox-core/src/";
const planned = (path: string) => `${core}${path} (planned)`;
const existing = (path: string) => `${core}${path} — existing shared scaffold`;

interface ProposedLimits {
  max_steps: number;
  max_tokens: number;
  wall_clock_timeout_ms: number;
  max_retries: number;
  max_read_bytes: number;
}

function limitsMechanics(limits: ProposedLimits, scope: string): string[] {
  return [
    `// Proposed configuration for ${scope}; not current role defaults.\nconst limits = ${JSON.stringify(limits, null, 2)};`,
    "The existing ExecutionBudget accepts maxSteps, maxTokens, and timeoutMs per run; map the first three fields explicitly. It counts agent.step admissions and conservative token reservations, not tool calls or measured provider billing.",
    "max_retries and cumulative max_read_bytes require new role adapters. BoxManager.readFile currently enforces a caller-supplied per-file maxBytes (default 1,048,576), not a cumulative run read budget.",
    "Before paid work reserve an upper bound for input plus capped output. Fallbacks share the original counters and deadline; deny admission when the remaining allowance cannot cover the next request.",
    "The current runner races asynchronous work against a cooperative AbortSignal. It cannot forcibly interrupt CPU loops, synchronous I/O, or side effects in an adapter that ignores cancellation.",
  ];
}

const leaseSchema = `interface TaskLease {
  readonly leaseId: string;
  readonly runId: string;
  readonly taskId: string;
  readonly boxId: string;
  readonly baseRevision: string;
  readonly objective: string;
  readonly acceptanceCriteria: readonly string[];
  readonly allowedPaths: readonly string[];
  readonly allowedTools: readonly string[];
  readonly expiresAt: string; // ISO 8601; runtime validates expiry
  readonly limits: {
    readonly max_steps: number;
    readonly max_tokens: number;
    readonly wall_clock_timeout_ms: number;
    readonly max_retries: number;
    readonly max_read_bytes: number;
  };
}`;

const evidenceSchema = `interface EvidenceBundle {
  readonly bundleId: string;
  readonly leaseId: string;
  readonly boxId: string;
  readonly baseRevision: string;
  readonly findings: readonly {
    readonly claim: string;
    readonly citations: readonly {
      readonly path: string;
      readonly startLine: number;
      readonly endLine: number;
      readonly contentSha256: string;
    }[];
  }[];
  readonly unansweredQuestions: readonly string[];
  readonly truncated: boolean;
}`;

const patchSchema = `interface StagedPatch {
  readonly patchId: string;
  readonly taskId: string;
  readonly leaseId: string;
  readonly boxId: string;
  readonly baseRevision: string;
  readonly candidateRevision: string;
  readonly candidateSha256: string;
  readonly diff: string;
  readonly changedPaths: readonly string[];
  readonly checks: readonly {
    readonly checkId: string;
    readonly exitCode: number | null;
    readonly timedOut: boolean;
    readonly outputSha256: string;
  }[];
}`;

const receiptSchema = `interface VerificationReceipt {
  readonly receiptId: string;
  readonly taskId: string;
  readonly patchId: string;
  readonly candidateSha256: string;
  readonly rubricVersion: string;
  readonly verdict: "APPROVED" | "REJECTED";
  readonly criteria: readonly {
    readonly criterionId: string;
    readonly passed: boolean;
    readonly evidenceRefs: readonly string[];
    readonly explanation: string;
  }[];
  readonly requiredCorrections: readonly string[];
}`;

/**
 * Versioned design records for the learning vault. Everything marked proposed is
 * an editable design default, not a configured policy or a shipped agent module.
 * The kernel currently exposes Agent/Task/Tool, budget counters, JSONL events,
 * and local path fencing. These schema strings document future role contracts.
 */
export const engineeringSpecs: Record<ArchetypeId, EngineeringSpec> = {
  orchestrator: {
    modulePath: planned("agents/orchestrator.ts"),
    runtimePattern: "Deterministic Workflow · Graph / State-Machine & A2A Protocol (M3/M4)",
    stateMutability:
      "Single logical writer to TaskGraph; immutable worker artifacts",
    tokenBudgetTier:
      "Tier 3 reasoning for planning · 24,000 proposed tokens/run",
    verificationGate:
      "Validated graph transitions + matching independent receipt",
    version: "0.2",
    implementation: "Planned",
    blocks: [
      {
        id: "boundary",
        title: "01 / System boundary",
        subtitle: "Coordination owns the graph; workers own scoped attempts",
        decision:
          "Proposed default: one supervisor serializes graph updates and never edits workspace files.",
        mechanics: [
          "Accept an objective, workspace revision, acceptance criteria, and a run envelope. Issue TaskLease artifacts that narrow paths, tool names, deadline, and per-task allowance.",
          "Own TaskGraph versions and lifecycle transitions. Worker results are requests to reconcile state, never direct writes to shared graph objects or JSONL files.",
          "Exclude repository mutation, command execution, model-generated capability expansion, and unrestricted cross-box reads from this actor's surface.",
        ],
        tradeoff:
          "A single state owner simplifies causality and replay design, but can bottleneck dispatch. Parallelize worker work before parallelizing graph writes.",
        implementation: [
          planned("agents/orchestrator.ts"),
          planned("orchestration/task-graph.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "Concurrently return duplicate and stale receipts; only a matching lease and graph version may advance the task once.",
      },
      {
        id: "model",
        title: "02 / Model gateway",
        subtitle: "Reasoning proposes; code admits transitions",
        decision:
          "Proposed default: a reasoning-capable structured planner suggests a DAG; code validates and schedules it.",
        mechanics: [
          "Tier 3: strong decomposition and dependency reasoning with schema-constrained output. Routine dispatch, lease expiry, and graph transitions need no model call.",
          "Route invalid planner output through one bounded correction attempt; then optionally admit a stronger reasoning tier only if remaining tokens and time cover its full request bound.",
          "Provider unavailability permits a capability-equivalent fallback, never a weaker schema or policy path. Reuse the same task identity and account each actual request.",
        ],
        tradeoff:
          "A richer planner can reduce bad decomposition, but validated deterministic routing keeps coordination auditable and avoids spending reasoning tokens on every event.",
        implementation: [
          planned("gateway/model-router.ts"),
          planned("orchestration/plan-validator.ts"),
          existing("runtime/types.ts"),
        ],
        verification:
          "A planner that invents cycles, unknown tools, or expanded paths is rejected before a worker starts; fallback is denied if its reservation exceeds the remaining budget.",
      },
      {
        id: "context",
        title: "03 / Context engine",
        subtitle: "Graph, objective, evidence pointers, unresolved decisions",
        decision:
          "Proposed default: send a compact coordination snapshot, not raw worker transcripts.",
        mechanics: [
          "Compose immutable objective and acceptance criteria, current graph version, runnable/blocked tasks, outstanding leases, remaining budget, and artifact identifiers.",
          "Retrieve a cited source excerpt only when a dependency or rejection cannot be resolved from artifact summaries. Keep box and revision filters mandatory.",
          "Compress completed tasks into outcome records with receipt IDs; preserve unresolved assumptions and failed acceptance criteria verbatim rather than summarizing them away.",
        ],
        tradeoff:
          "Compact context reduces repeated tokens and cross-task distraction, but artifact retrieval must preserve enough provenance to resolve disputes.",
        implementation: [
          planned("context/supervisor-context.ts"),
          planned("orchestration/artifact-store.ts"),
        ],
        verification:
          "A long synthetic task graph stays under the configured context window while retaining every unresolved criterion and its evidence pointer.",
      },
      {
        id: "tools",
        title: "04 / Tools & capabilities",
        subtitle: "Dispatch, inspect, cancel, request approval",
        decision:
          "Proposed default: explicit coordination allowlist, with no ambient filesystem or shell tool.",
        mechanics: [
          "Allow dispatch_task, cancel_task, read_receipt, read_artifact_summary, and request_approval. Canonical appends go through the ledger service under the supervisor's state transition.",
          "A dispatcher intersects role permissions, run permissions, and task scope. Reject a lease that grants a worker anything the parent run does not possess.",
          "The current runner checks allowedTools by name; role/capability labels are descriptive. Capability leases, approval state, and cross-worker restrictions still need implementing.",
        ],
        tradeoff:
          "Coordination-only tools prevent accidental editing by the planner, but all actual work must travel through typed worker contracts.",
        implementation: [
          existing("runtime/runner.ts"),
          planned("orchestration/dispatcher.ts"),
          planned("policy/capability-lease.ts"),
        ],
        verification:
          "Attempt apply_patch or run_cmd as supervisor; dispatch must fail before invocation and no workspace byte may change.",
      },
      {
        id: "control",
        title: "05 / Runtime control",
        subtitle: "Exact proposed graph transitions",
        decision:
          "Proposed default: transition functions own lifecycle; the model cannot jump directly to success.",
        mechanics: [
          "Run edges: CREATED → VALIDATING → PLANNING → DISPATCHING → RECONCILING. RECONCILING → DISPATCHING when work remains; RECONCILING → COMPLETED only when every required task has an accepted receipt.",
          "Task edges: PENDING → READY → LEASED → RUNNING → VERIFYING → SUCCEEDED. VERIFYING → READY on correctable rejection within retry budget; any live task → FAILED on permanent failure.",
          "Any nonterminal run → STOPPED on budget/cancellation, or → FAILED on invalid state/permanent error. DISPATCHING → AWAITING_APPROVAL when a capability requires human approval; AWAITING_APPROVAL → DISPATCHING only with a matching unexpired approval; approval waits do not reset the deadline.",
        ],
        tradeoff:
          "An explicit state machine requires more contracts than a free-form supervisor loop, but makes retry, stopping, and acceptance inspectable.",
        implementation: [
          planned("orchestration/transitions.ts"),
          planned("orchestration/task-graph.ts"),
          existing("runtime/budget.ts"),
        ],
        verification:
          "Table-driven transition tests reject illegal edges, incomplete prerequisites, duplicate completion, and any dispatch after a terminal state.",
      },
      {
        id: "contracts",
        title: "06 / State & contracts",
        subtitle: "TaskLease carries authority and identity",
        decision:
          "Proposed default: immutable leases and versioned artifacts cross actor boundaries; graph updates use compare-and-set semantics.",
        mechanics: [
          "Lease identity binds runId, taskId, boxId, baseRevision, allowedPaths, allowedTools, expiry, and budget. Runtime schema validation must reject unknown privilege-bearing fields.",
          "A worker reply references leaseId and immutable artifact IDs. Validate the referenced candidate, task, graph version, and receipt before applying any graph update.",
          "Existing Task has only id/objective, and the JSONL ledger has no graph reducer. TaskLease, TaskGraph persistence, artifact schemas, and replay reducers below are proposed extensions.",
        ],
        tradeoff:
          "Version checks create explicit conflict handling; they prevent a late worker from silently overwriting a newer plan.",
        implementation: [
          existing("runtime/types.ts"),
          planned("contracts/task-lease.ts"),
          planned("orchestration/graph-store.ts"),
        ],
        verification:
          "Round-trip schema fixtures; reject missing expiry, forged tool scope, wrong base revision, and a duplicate lease response without mutating the graph.",
      },
      {
        id: "recovery",
        title: "07 / Recovery & termination",
        subtitle: "Retry failed work without duplicating accepted work",
        decision:
          "Proposed default: retry task attempts with stable task identity and fresh lease IDs; fail closed on ambiguous acceptance.",
        mechanics: [
          "On worker loss, expire its lease and reconcile known artifacts before reissuing. A stale lease cannot publish a new accepted result even if the worker later wakes.",
          "Classify transient provider/transport errors separately from policy denial, invalid task graphs, and failing acceptance criteria. Only transient/rework paths consume the bounded retry allowance.",
          "Resume from a validated graph checkpoint plus subsequent events once reducers exist. Current JSONL persistence alone does not implement pause, replay, or safe recovery.",
        ],
        tradeoff:
          "At-least-once delivery with idempotent acceptance is simpler than assuming exactly-once workers, but demands stable identities and explicit reconciliation.",
        implementation: [
          planned("orchestration/reconciler.ts"),
          planned("orchestration/checkpoint.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "Crash after dispatch and after receipt persistence; resumption must not accept twice, rerun succeeded tasks, or admit work after the original deadline.",
      },
      {
        id: "budgets",
        title: "08 / Budgets & admission",
        subtitle: "Run-wide ceiling with explicit child reservations",
        decision:
          "Proposed default: children consume a shared parent envelope; dispatch never creates fresh unlimited budgets.",
        mechanics: [
          ...limitsMechanics(
            {
              max_steps: 64,
              max_tokens: 24000,
              wall_clock_timeout_ms: 600000,
              max_retries: 2,
              max_read_bytes: 262144,
            },
            "one supervisor run",
          ),
          "Additionally propose max_concurrency = 3 and max_tasks = 12. Reserve a child allowance before dispatch, and do not refund unused allocation until that lease is conclusively closed.",
        ],
        tradeoff:
          "Conservative child reservations can leave capacity idle; they keep concurrent workers from promising more tokens than the parent can fund.",
        implementation: [
          existing("runtime/budget.ts"),
          planned("orchestration/budget-pool.ts"),
        ],
        verification:
          "Three concurrent children compete for a small envelope; aggregate admitted reservations never exceed the parent and retries retain the original deadline.",
      },
      {
        id: "evaluation",
        title: "09 / Evaluation & observability",
        subtitle: "Correct coordination is a testable graph property",
        decision:
          "Proposed default: evaluate deterministic scheduling before measuring model planning quality.",
        mechanics: [
          "Fixtures cover a linear build, parallel scouting, a rejected patch, a dead worker, cyclic plans, and budget exhaustion. Grade final graph state and accepted artifact identity.",
          "Trace graph version, task/lease IDs, queue delay, model reservations, retry cause, and stop reason. Report completion rate alongside duplicate dispatch and invalid-transition counts.",
          "Keep planning quality separate: compare proposed dependencies to a known rubric and measure whether the plan reaches verified acceptance within the same budget.",
        ],
        tradeoff:
          "A successful-looking summary is cheap to generate; state assertions and independent receipts require fixture investment but expose actual orchestration failures.",
        implementation: [
          planned("evaluation/orchestrator-suite.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "A replayed event order yields the same graph in the proposed reducer; shuffled stale responses never turn an unverified task into SUCCEEDED.",
      },
    ],
    inputSchema: `// Proposed role contract; not exported by today's kernel.\n${leaseSchema}\n\ninterface OrchestratorInput {\n  readonly runId: string;\n  readonly boxId: string;\n  readonly baseRevision: string;\n  readonly objective: string;\n  readonly acceptanceCriteria: readonly string[];\n  readonly runLimits: TaskLease["limits"];\n  readonly permittedTools: readonly string[];\n  readonly permittedPaths: readonly string[];\n}`,
    outputSchema: `// Proposed persisted plan + dispatch contract.\n${leaseSchema}\n\ntype TaskState = "PENDING" | "READY" | "LEASED" | "RUNNING"\n  | "VERIFYING" | "SUCCEEDED" | "FAILED";\ninterface OrchestratorOutput {\n  readonly graphVersion: number;\n  readonly tasks: readonly {\n    readonly taskId: string;\n    readonly dependsOn: readonly string[];\n    readonly state: TaskState;\n    readonly acceptedReceiptId: string | null;\n  }[];\n  readonly dispatches: readonly TaskLease[];\n  readonly runState: "ACTIVE" | "AWAITING_APPROVAL" | "COMPLETED"\n    | "STOPPED" | "FAILED";\n  readonly stopReason: string | null;\n}`,
  },
  scout: {
    modulePath: planned("agents/recon-scout.ts"),
    runtimePattern:
      "Autonomous Agent · ReAct Loop & A2A EvidenceBundle (M2/M4)",
    stateMutability:
      "Ephemeral scratchpad; read-only snapshot; immutable EvidenceBundle",
    tokenBudgetTier:
      "Tier 1 retrieval + Tier 2 analysis · 8,000 proposed tokens/task",
    verificationGate: "Revision-pinned citations, coverage checks, no mutation",
    version: "0.2",
    implementation: "Planned",
    blocks: [
      {
        id: "boundary",
        title: "01 / System boundary",
        subtitle: "Discovery returns evidence, never edits",
        decision:
          "Proposed default: one scout answers one scoped evidence question against an immutable snapshot.",
        mechanics: [
          "A TaskLease specifies the question, box, base revision, path scope, and read-only tools. Fan out independent questions only; the supervisor owns consolidation.",
          "The scout may hold a disposable search scratchpad but cannot alter source, TaskGraph, acceptance criteria, or cross-box memory.",
          "Unanswered questions remain explicit in the output; partial search coverage must not be rewritten into a confident repository-wide conclusion.",
        ],
        tradeoff:
          "Immutable snapshots simplify citations but may be older than current staging work. A new revision requires a new evidence request.",
        implementation: [
          planned("agents/recon-scout.ts"),
          planned("workspace/snapshot-reader.ts"),
          existing("workspace/box-manager.ts"),
        ],
        verification:
          "Ask a scout to fix a discovered issue; it must return evidence and a question rather than changing any file.",
      },
      {
        id: "model",
        title: "02 / Model gateway",
        subtitle: "Cheap search selection with bounded analysis escalation",
        decision:
          "Proposed default: use a low-latency structured tool model for search routing and a stronger analysis tier only for conflicting evidence.",
        mechanics: [
          "Tier 1 chooses ripgrep, list_tree, and file reads from a symbol/folder map. A deterministic query can skip the model entirely.",
          "Escalate to Tier 2 only when the bundle contains cited but contradictory findings or a named unresolved semantic question; do not escalate merely because a search returned zero hits.",
          "A fallback must support the same structured tool contract and read-only policy. Validate output and reserve its input/output bound before admission; no budget reset on provider change.",
        ],
        tradeoff:
          "A fast model lowers discovery cost, but weak semantic navigation may miss indirect call paths. Measure retrieval coverage before expanding the model tier.",
        implementation: [
          planned("gateway/model-router.ts"),
          planned("agents/scout-search-policy.ts"),
        ],
        verification:
          "Search failures, malformed tool arguments, and model fallback fixtures produce bounded calls with valid citations or explicit unanswered questions.",
      },
      {
        id: "context",
        title: "03 / Context engine",
        subtitle: "Folder map → symbol map → source slice",
        decision:
          "Proposed default: progressively retrieve relevant text rather than injecting the repository.",
        mechanics: [
          "Begin with bounded list_tree output and the task question. Search filenames/text, then request AST symbols when structural navigation is needed and a parser exists.",
          "Each source slice carries path, start/end line, content hash, and base revision. Preserve citation metadata when compressing the scratchpad.",
          "Treat repository text as untrusted evidence; instructions embedded in code comments cannot change the lease, tool policy, or final output schema.",
        ],
        tradeoff:
          "Progressive retrieval saves context but can overfocus on lexical matches; retain an explicit search frontier and document unexplored paths.",
        implementation: [
          planned("context/repository-map.ts"),
          planned("context/source-slice.ts"),
          existing("workspace/box-manager.ts"),
        ],
        verification:
          "A fixture with misleading filenames and an indirect caller still produces the correct symbol citations within the read budget.",
      },
      {
        id: "tools",
        title: "04 / Tools & capabilities",
        subtitle: "Read-only capability intersection",
        decision:
          "Proposed default: expose list_tree, ripgrep, ast_symbols, and bounded read_file; no generic command tool.",
        mechanics: [
          "Every path resolves under the leased snapshot and allowed path prefixes. Restrict search flags and output bytes in dedicated adapters instead of accepting shell command strings.",
          "Existing BoxManager rejects traversal and symlink components and supports bounded reads/tree lists. ripgrep, AST indexing, path-prefix leases, and cumulative byte accounting are proposed adapters.",
          "Deny apply_patch, write_file, run_cmd, network writes, and mutable memory tools. A read capability label is insufficient without the explicit allowedTools name check.",
        ],
        tradeoff:
          "Dedicated adapters are less flexible than shell access; their bounded, typed surfaces make read-only behavior meaningfully inspectable.",
        implementation: [
          existing("runtime/runner.ts"),
          existing("workspace/box-manager.ts"),
          planned("tools/repository-search.ts"),
        ],
        verification:
          "Traversal, symlinks, write requests, shell metacharacters, and oversized search output are rejected before reading or mutating outside scope.",
      },
      {
        id: "control",
        title: "05 / Runtime control",
        subtitle: "Exact proposed discovery transitions",
        decision:
          "Proposed default: a bounded search frontier determines whether to inspect again or return a bundle.",
        mechanics: [
          "Edges: RECEIVED → VALIDATING → MAPPING → SEARCHING → READING → ASSEMBLING → COMPLETE. READING → SEARCHING only while an unanswered question and budget remain.",
          "SEARCHING → ASSEMBLING on an empty frontier or exhausted search allowance. Mark truncated = true when evidence work stops before coverage is complete.",
          "Any live state → STOPPED on deadline/cancellation; validation or policy denial → FAILED. Fan-out is capped by the parent dispatcher, and individual scouts cannot spawn unbounded children.",
        ],
        tradeoff:
          "A bounded frontier can return incomplete evidence; that is preferable to silently treating endless repository exploration as progress.",
        implementation: [
          planned("agents/scout-loop.ts"),
          planned("orchestration/dispatcher.ts"),
          existing("runtime/runner.ts"),
        ],
        verification:
          "An endless-search fake reaches ASSEMBLING with truncated evidence at the exact limit; no new read starts after stop.",
      },
      {
        id: "contracts",
        title: "06 / State & contracts",
        subtitle: "EvidenceBundle is immutable and revision-bound",
        decision:
          "Proposed default: claims require source citations; every bundle names its lease and snapshot.",
        mechanics: [
          "Validate nonempty claim text, normalized scoped paths, positive ordered line ranges, and a content SHA-256 for every cited source slice.",
          "Before a builder consumes evidence, compare its baseRevision to the candidate base; stale evidence triggers a new scoped read rather than silent reuse.",
          "Freeze bundle objects after validation and store them by stable bundle ID. The current ledger can record generic tool results but has no EvidenceBundle validator or artifact store.",
        ],
        tradeoff:
          "Provenance adds payload overhead and can invalidate otherwise useful evidence after harmless edits, but prevents stale claims from masquerading as current facts.",
        implementation: [
          planned("contracts/evidence-bundle.ts"),
          planned("orchestration/artifact-store.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "Mutate a cited file, swap a lease ID, and supply a reversed line range; each bundle is rejected for the relevant consumer.",
      },
      {
        id: "recovery",
        title: "07 / Recovery & termination",
        subtitle: "Retry reads, preserve unknowns, discard stale scratchpads",
        decision:
          "Proposed default: retry transient read/provider failures once without changing the snapshot identity.",
        mechanics: [
          "A missing file on a supposedly immutable snapshot is an integrity error, not permission to search another box. Return the affected question as unanswered.",
          "On parser failure, admit bounded text search as an explicit fallback and label the loss of structural coverage. Policy denial and path violations are permanent failures.",
          "On cancellation publish no success bundle; an inspectable partial bundle may be stored with truncated = true and a stop reason, subject to parent acceptance policy.",
        ],
        tradeoff:
          "Discarding stale scratchpads repeats some reads; it keeps recovery from blending evidence from multiple revisions.",
        implementation: [
          planned("agents/scout-recovery.ts"),
          planned("contracts/evidence-bundle.ts"),
          existing("runtime/runner.ts"),
        ],
        verification:
          "Inject a parser error, transient I/O error, and snapshot mismatch; only admissible fallbacks run and every coverage gap stays visible.",
      },
      {
        id: "budgets",
        title: "08 / Budgets & admission",
        subtitle: "Bound search count, aggregate bytes, and bundle size",
        decision:
          "Proposed default: a small per-question budget with no private pool for child searches.",
        mechanics: [
          ...limitsMechanics(
            {
              max_steps: 16,
              max_tokens: 8000,
              wall_clock_timeout_ms: 60000,
              max_retries: 1,
              max_read_bytes: 2097152,
            },
            "one scout question",
          ),
          "Additionally propose max_searches = 8, max_citations = 24, and max_output_bytes = 65536. Each adapter must debit cumulative bytes before returning content.",
        ],
        tradeoff:
          "Hard read and citation caps can miss distant evidence. The output's unansweredQuestions field makes that limitation actionable for the supervisor.",
        implementation: [
          existing("runtime/budget.ts"),
          planned("tools/read-budget.ts"),
          planned("agents/scout-search-policy.ts"),
        ],
        verification:
          "Repeated reads of small files exhaust the aggregate read allowance even though each individual read is below BoxManager's per-file cap.",
      },
      {
        id: "evaluation",
        title: "09 / Evaluation & observability",
        subtitle: "Measure grounded retrieval, not prose confidence",
        decision:
          "Proposed default: score citation correctness, question coverage, and read efficiency against fixture repositories.",
        mechanics: [
          "Seed known target symbols, distractors, stale evidence, and comments containing hostile instructions. Ground truth identifies the relevant paths and line spans.",
          "Report relevant-symbol recall, valid-citation rate, bytes/tokens per accepted finding, unanswered-question rate, and mutation count. Mutation count must remain zero.",
          "Trace query, scope, snapshot, bytes returned, and evidence IDs without storing unrelated repository content in shared telemetry.",
        ],
        tradeoff:
          "A high citation rate can coexist with poor recall; both coverage and grounding are necessary to evaluate discovery quality.",
        implementation: [
          planned("evaluation/scout-suite.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "A bundle citing real but irrelevant lines fails the relevance rubric even when every hash and line range is syntactically valid.",
      },
    ],
    inputSchema: `// Proposed read-only role contract.\n${leaseSchema}\n\ninterface ScoutInput {\n  readonly lease: TaskLease;\n  readonly question: string;\n  readonly snapshotId: string;\n  readonly searchHints: readonly string[];\n}`,
    outputSchema: `// Proposed immutable result, not today's mock Scout output.\n${evidenceSchema}`,
  },
  builder: {
    modulePath: `${core}runtime/runner.ts · ${planned("agents/builder.ts")}`,
    runtimePattern: "Autonomous Agent · ReAct Loop & Staged Patch Transaction (M2)",
    stateMutability:
      "Scoped shadow workspace only; frozen candidate on submission",
    tokenBudgetTier: "Tier 2 tool-capable coding · 32,000 proposed tokens/task",
    verificationGate:
      "Independent receipt bound to candidate hash before promotion",
    version: "0.2",
    implementation: "Scaffold only",
    blocks: [
      {
        id: "boundary",
        title: "01 / System boundary",
        subtitle: "Candidate mutation is separate from accepted state",
        decision:
          "Proposed default: the builder can edit a leased staging workspace and submit a patch, never approve or promote itself.",
        mechanics: [
          "Consume a TaskLease, accepted base revision, evidence bundles, and acceptance criteria. Create one shadow workspace per attempt with an explicit writable path scope.",
          "Own the staged candidate, task-local scratchpad, and diagnostics. The supervisor owns task state; the verifier owns acceptance evidence; promotion belongs to a separate transaction gate.",
          "Current code provides a shared bounded runner and local BoxManager writes. It does not yet create staging transactions, enforce per-task write prefixes, or implement a production Builder agent.",
        ],
        tradeoff:
          "Staging requires extra storage and conflict handling, but failed experiments remain separate from the accepted workspace.",
        implementation: [
          existing("runtime/runner.ts"),
          existing("workspace/box-manager.ts"),
          planned("workspace/staging-transaction.ts"),
        ],
        verification:
          "A failing or cancelled attempt leaves the accepted revision byte-identical; an approved candidate still needs an explicit promotion operation.",
      },
      {
        id: "model",
        title: "02 / Model gateway",
        subtitle: "Tool-capable coding with diagnostic-driven escalation",
        decision:
          "Proposed default: use a structured coding model for local edits; reserve a reasoning escalation for repeated distinct diagnostic failures.",
        mechanics: [
          "Tier 2 must support typed tool calls, code editing, and adherence to scoped acceptance criteria. The existing demo is deterministic and calls no model.",
          "After one substantive failed repair, a Tier 3 reasoning request may analyze the relevant diff and diagnostics if its input/output reservation and latency bound fit the remaining envelope.",
          "Provider fallback must retain tool schema, candidate identity, and edit policy. Do not replay a mutating tool merely because a model response timed out; reconcile its tool-call ID first.",
        ],
        tradeoff:
          "Escalating too early spends tokens on simple syntax fixes; escalating too late repeats bad local patches. Use distinct failure evidence rather than a vague confidence score.",
        implementation: [
          planned("gateway/model-router.ts"),
          planned("agents/builder-model-policy.ts"),
          existing("runtime/types.ts"),
        ],
        verification:
          "A simulated gateway timeout after a patch does not apply that patch twice; an oversized escalation is denied before a provider request.",
      },
      {
        id: "context",
        title: "03 / Context engine",
        subtitle:
          "Acceptance criteria + evidence + staged diff + latest failure",
        decision:
          "Proposed default: keep the active repair context narrow and retain immutable task constraints across compaction.",
        mechanics: [
          "Prefix the task's allowed paths, acceptance criteria, base revision, and remaining budget. Add scout citations, relevant symbol definitions, and the current staged diff.",
          "Include the latest relevant check failures and a compact history of failed approaches. Do not repeatedly inject full logs, generated files, dependencies, or unrelated worker conversations.",
          "After compaction, preserve unresolved criteria, tool-call IDs, candidate identity, and known failing checks; retrieve source afresh when citations no longer match the staged file.",
        ],
        tradeoff:
          "A smaller repair window is efficient but can hide global invariants. Explicit dependency lookups are needed when an edit changes a public interface.",
        implementation: [
          planned("context/builder-context.ts"),
          planned("context/diff-context.ts"),
          existing("workspace/box-manager.ts"),
        ],
        verification:
          "A long repair trace compacts without losing write scope or failing acceptance criteria, and stale evidence cannot overwrite a newer staged edit.",
      },
      {
        id: "tools",
        title: "04 / Tools & capabilities",
        subtitle: "Patch transactions and constrained command execution",
        decision:
          "Proposed default: scoped read_file/apply_patch/write_file plus allowlisted run_tests and run_cmd adapters.",
        mechanics: [
          "Patch requests include expected base content hashes and normalized paths. Validate the full transaction before changing any file; reject out-of-scope edits and symlink components.",
          "run_cmd requires a command profile, staging cwd, bounded output, timeout, and an explicit environment allowlist. A shell inside a Git worktree is still not an OS security boundary.",
          "Current named tool admission and local path fencing are reusable scaffolding. Process supervision, command profiles, patch validation, sandboxing, and promotion tools are planned.",
        ],
        tradeoff:
          "Validated patch transactions are stricter than unrestricted shell editing, but make partial writes, stale bases, and accidental host access easier to reject.",
        implementation: [
          existing("runtime/runner.ts"),
          existing("workspace/box-manager.ts"),
          planned("tools/apply-patch.ts"),
          planned("tools/command-runner.ts"),
        ],
        verification:
          "Traversal, wrong base hashes, disallowed commands, and out-of-scope paths cause zero accepted mutations; command cancellation is tested at the process adapter boundary.",
      },
      {
        id: "control",
        title: "05 / Runtime control",
        subtitle: "Exact proposed ReAct transaction transitions",
        decision:
          "Proposed default: one reasoning/action/observation cycle per admitted builder step, with code-owned submission.",
        mechanics: [
          "Edges: RECEIVED → VALIDATING → STAGING → REASONING → ACTING → OBSERVING. OBSERVING → REASONING for bounded repair; OBSERVING → FREEZING when the candidate is ready.",
          "FREEZING → SUBMITTED after the candidate digest and diff are stored. SUBMITTED is terminal for that attempt; rejection creates a new attempt against an explicitly selected base.",
          "Any live state → STOPPED on budget/cancellation, or → FAILED on policy/storage error. The kernel currently counts agent.step calls, so a future adapter must keep one cycle per step rather than hide an unbounded tool loop inside it.",
        ],
        tradeoff:
          "A visible cycle boundary makes cost and retries auditable, while a free-form inner loop can do more work per step but defeats meaningful step limits.",
        implementation: [
          existing("runtime/runner.ts"),
          planned("agents/builder-loop.ts"),
          planned("workspace/staging-transaction.ts"),
        ],
        verification:
          "An endless repair fake stops at the configured step limit; no candidate is submitted after stop or altered after FREEZING.",
      },
      {
        id: "contracts",
        title: "06 / State & contracts",
        subtitle: "StagedPatch binds a diff to one exact candidate",
        decision:
          "Proposed default: freeze candidate identity and evidence before handing control to verification.",
        mechanics: [
          "StagedPatch includes patchId, leaseId, baseRevision, candidateRevision, content digest, normalized changedPaths, diff, and check result references.",
          "At submission, verify every changed path is leased and the diff reproduces the candidate from the stated base. Builder check results are useful diagnostics, not an independent approval receipt.",
          "The current ledger exposes file_diff and a minimal verification_receipt event shape only. It does not implement StagedPatch, immutable artifact storage, or candidate-bound acceptance.",
        ],
        tradeoff:
          "Hashing and retaining candidates costs I/O, but prevents approval from accidentally attaching to a later modified workspace.",
        implementation: [
          planned("contracts/staged-patch.ts"),
          planned("workspace/candidate-store.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "Changing one candidate byte after submission invalidates its digest; a receipt for the prior candidate cannot promote the changed result.",
      },
      {
        id: "recovery",
        title: "07 / Recovery & termination",
        subtitle: "Repair safely; never replay ambiguous mutations",
        decision:
          "Proposed default: record tool operation IDs and reconcile uncertain writes before retrying.",
        mechanics: [
          "On model failure, retain the current candidate and resume only after checking the last tool operation's recorded outcome. A provider retry must not duplicate a command side effect.",
          "On patch conflict, reread the scoped staged file and create a fresh patch against its current hash. Do not force-apply an edit based on stale content.",
          "Cancellation revokes new admissions and signals in-flight tools. Actual child-process termination requires the planned process supervisor; current cooperative abort alone cannot guarantee it.",
        ],
        tradeoff:
          "Reconciliation slows automatic retry but avoids corrupting the candidate or running a destructive command twice.",
        implementation: [
          planned("tools/operation-journal.ts"),
          planned("tools/process-supervisor.ts"),
          existing("runtime/runner.ts"),
        ],
        verification:
          "Crash after applying a patch but before returning its result; resuming recognizes the applied operation and does not reapply it.",
      },
      {
        id: "budgets",
        title: "08 / Budgets & admission",
        subtitle: "Bound every repair cycle and command",
        decision:
          "Proposed default: a larger task envelope with a hard original deadline across repairs and model fallbacks.",
        mechanics: [
          ...limitsMechanics(
            {
              max_steps: 32,
              max_tokens: 32000,
              wall_clock_timeout_ms: 300000,
              max_retries: 2,
              max_read_bytes: 4194304,
            },
            "one builder attempt",
          ),
          "Additionally propose command_timeout_ms = 30000, max_command_output_bytes = 65536, and max_patch_bytes = 262144. Process adapters must enforce their own limits and child cleanup.",
        ],
        tradeoff:
          "Large repairs may need a fresh task after exhaustion. Explicit handoff with partial results is more predictable than silently extending the run.",
        implementation: [
          existing("runtime/budget.ts"),
          existing("runtime/runner.ts"),
          planned("tools/command-runner.ts"),
        ],
        verification:
          "A repeating compiler-fix loop, a hanging command, and oversized diagnostics all terminate with recorded partial evidence and no budget reset.",
      },
      {
        id: "evaluation",
        title: "09 / Evaluation & observability",
        subtitle: "Accepted file state is the outcome",
        decision:
          "Proposed default: grade patches with independent hidden checks plus mutation-scope assertions.",
        mechanics: [
          "Use small repositories with seeded defects, clear acceptance criteria, known forbidden paths, and tests that the builder cannot rewrite to manufacture success.",
          "Report independent task pass rate, invalid patch rate, out-of-scope attempts, tokens per accepted patch, command timeouts, and repair count; keep claimed success separate from receipt approval.",
          "Trace step IDs, tool operation IDs, candidate revisions, check outputs by digest, and stop reason. Redact secrets before export; current JSONL has no automatic secret redaction.",
        ],
        tradeoff:
          "Hidden checks reduce self-grading but can be incomplete; pair them with structural assertions and a fixed qualitative rubric where necessary.",
        implementation: [
          planned("evaluation/builder-suite.ts"),
          existing("ledger/event-log.ts"),
          existing("runtime/runner.ts"),
        ],
        verification:
          "A patch that deletes tests or changes an unleased file fails even if its local test command exits successfully.",
      },
    ],
    inputSchema: `// Proposed builder contract. Existing kernel Task remains id/objective.\n${leaseSchema}\n\n${evidenceSchema}\n\ninterface BuilderInput {\n  readonly lease: TaskLease;\n  readonly stagingId: string;\n  readonly evidence: readonly EvidenceBundle[];\n  readonly priorRejection: readonly string[];\n}`,
    outputSchema: `// Proposed submission; local checks do not constitute approval.\n${patchSchema}`,
  },
  critic: {
    modulePath: planned("agents/critic-verifier.ts"),
    runtimePattern:
      "Deterministic Workflow · A2A VerificationReceipt Gate (M2/M5)",
    stateMutability:
      "Frozen candidate + immutable VerificationReceipt; no source edits",
    tokenBudgetTier:
      "Tier 2 rubric analysis only after checks · 6,000 proposed tokens/candidate",
    verificationGate:
      "Deterministic failures reject; complete grounded rubric required",
    version: "0.2",
    implementation: "Planned",
    blocks: [
      {
        id: "boundary",
        title: "01 / System boundary",
        subtitle: "Verification is independent of patch authorship",
        decision:
          "Proposed default: verify one frozen candidate against immutable acceptance criteria and emit one candidate-bound receipt.",
        mechanics: [
          "Read StagedPatch and a versioned rubric; create a disposable verification workspace so test-generated files cannot alter the submitted source candidate.",
          "The verifier may execute approved checks but cannot edit source, revise acceptance criteria, promote a patch, or mutate the supervisor's task state.",
          "Treat builder summaries as claims to inspect. Favor actual file state, deterministic check output, and cited rubric evidence.",
        ],
        tradeoff:
          "Independent checks repeat some builder work; the extra cost reduces correlated self-approval and stale-candidate mistakes.",
        implementation: [
          planned("agents/critic-verifier.ts"),
          planned("verification/candidate-harness.ts"),
        ],
        verification:
          "A builder claims all checks pass while a hidden assertion fails; verification must reject the exact submitted candidate.",
      },
      {
        id: "model",
        title: "02 / Model gateway",
        subtitle: "No model before deterministic gates pass",
        decision:
          "Proposed default: a schema-constrained analysis model judges only named qualitative criteria left unresolved by code.",
        mechanics: [
          "Deterministic test, type, lint, scope, and candidate-integrity failures produce REJECTED without a judge call. A wholly measurable rubric can skip the model entirely.",
          "Tier 2 evaluates each qualitative criterion using explicit evidence references. Missing evidence, schema errors, and unsupported assertions cannot become approval.",
          "A capability-equivalent fallback receives the same rubric and candidate digest; admit it only within remaining reservations. Provider failure produces REJECTED with a verification-unavailable reason rather than assumed success.",
        ],
        tradeoff:
          "Failing closed may reject a correct patch during provider outages, but avoids turning uncertainty into a trusted approval artifact.",
        implementation: [
          planned("verification/judge.ts"),
          planned("gateway/model-router.ts"),
        ],
        verification:
          "Fail a deterministic check and assert zero judge calls; feed malformed or uncited judge output and assert no APPROVED receipt.",
      },
      {
        id: "context",
        title: "03 / Context engine",
        subtitle: "Rubric and frozen evidence, not author persuasion",
        decision:
          "Proposed default: construct review context from the candidate diff, criteria, relevant source, and harness evidence.",
        mechanics: [
          "Pin taskId, patchId, candidate hash, and rubric version in every review request. Include only the source slices needed to assess changed behavior and dependencies.",
          "Place builder commentary in an explicitly untrusted claims field; it cannot override check results or instruct the judge to ignore criteria.",
          "If required source or check output exceeds context, request a bounded specific slice or reject for insufficient evidence; do not silently truncate a failing result.",
        ],
        tradeoff:
          "Focused review context limits distraction, but omitted dependency behavior can create false approvals; retrieval must follow criterion-level evidence gaps.",
        implementation: [
          planned("context/verification-context.ts"),
          planned("verification/evidence-resolver.ts"),
        ],
        verification:
          "An adversarial diff comment requesting approval is treated as repository content and does not change the rubric or verdict policy.",
      },
      {
        id: "tools",
        title: "04 / Tools & capabilities",
        subtitle: "Verification commands in disposable state",
        decision:
          "Proposed default: allow read_diff, bounded read_file, run_tests, typecheck, lint, and emit_receipt only.",
        mechanics: [
          "Run checks from fixed command profiles with bounded environment, output, duration, and resources. Tests themselves can execute arbitrary code, so an OS boundary is required for untrusted candidates.",
          "Verification runs on a disposable copy; compare source digests before/after checks and record generated artifacts separately. Do not expose apply_patch or promote_candidate.",
          "Existing Tool and allowedTools contracts can admit names, but command sandboxing, immutable candidates, and verification profiles are planned, not enforced by role labels.",
        ],
        tradeoff:
          "Strict profiles can reject unconventional project tooling; approving a new profile is a deliberate capability decision rather than a model improvisation.",
        implementation: [
          existing("runtime/types.ts"),
          existing("runtime/runner.ts"),
          planned("verification/check-profiles.ts"),
          planned("tools/process-supervisor.ts"),
        ],
        verification:
          "A test attempting network access, source mutation, or a never-ending child process is contained by the planned harness and cannot modify the submitted candidate.",
      },
      {
        id: "control",
        title: "05 / Runtime control",
        subtitle: "Exact proposed verification transitions",
        decision:
          "Proposed default: deterministic gates route execution; the judge cannot bypass a failed check.",
        mechanics: [
          "Edges: RECEIVED → PINNING → HARNESS → DETERMINISTIC_GATE. DETERMINISTIC_GATE → REJECTING on any failure; → JUDGING when qualitative criteria remain; → APPROVING when all criteria are deterministic and pass.",
          "JUDGING → APPROVING only with complete, schema-valid, cited passes; otherwise → REJECTING. APPROVING or REJECTING → RECEIPT_WRITTEN → COMPLETE.",
          "Deadline, cancellation, missing candidate, or unavailable evidence routes to REJECTING when a receipt can be safely written; receipt-storage failure routes to FAILED with no approval publication.",
        ],
        tradeoff:
          "A code-routed pipeline is less conversational than debate, but its approval path can be exhaustively tested.",
        implementation: [
          planned("verification/pipeline.ts"),
          planned("verification/receipt-writer.ts"),
        ],
        verification:
          "Enumerate every edge to APPROVING; none is reachable from a failed deterministic gate, partial rubric, or mismatched candidate digest.",
      },
      {
        id: "contracts",
        title: "06 / State & contracts",
        subtitle: "VerificationReceipt signs evidence for one submission",
        decision:
          "Proposed default: store a receipt once with task, patch, candidate, and rubric identities plus criterion-level evidence.",
        mechanics: [
          "APPROVED requires every required criterion to pass and reference real harness/source evidence. REJECTED includes requiredCorrections that the next builder attempt can act on.",
          "The promotion gate checks candidateSha256 and rubricVersion, not merely the string APPROVED. A later edit requires a fresh review.",
          "Current EventLog.verification_receipt contains only verdict/check strings; the richer VerificationReceipt is a proposed artifact and requires validation plus references from ledger events.",
        ],
        tradeoff:
          "Detailed receipts add schema work but allow acceptance to be checked without trusting a free-form review paragraph.",
        implementation: [
          planned("contracts/verification-receipt.ts"),
          planned("verification/receipt-validator.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "An otherwise valid receipt with the wrong candidate digest, missing criterion, or nonexistent evidence reference is rejected by promotion.",
      },
      {
        id: "recovery",
        title: "07 / Recovery & termination",
        subtitle: "Rerun flaky infrastructure without changing the candidate",
        decision:
          "Proposed default: retry only classified infrastructure failures; genuine failing tests remain failures.",
        mechanics: [
          "One infrastructure retry may rerun a check in a fresh disposable workspace under the same candidate hash, rubric, and original deadline.",
          "A test assertion failure, scope violation, or digest mismatch is not transient. Return REJECTED rather than searching for a model/provider that will approve.",
          "If receipt persistence is uncertain, look up the stable verification operation ID before writing again; do not emit conflicting receipts for the same attempt.",
        ],
        tradeoff:
          "Conservative retry classification exposes flaky tests to the builder instead of masking them; it can increase rejections but protects the gate's meaning.",
        implementation: [
          planned("verification/retry-policy.ts"),
          planned("verification/receipt-store.ts"),
        ],
        verification:
          "A genuine test failure executes once; a classified environment startup failure retries at most once and preserves candidate identity.",
      },
      {
        id: "budgets",
        title: "08 / Budgets & admission",
        subtitle: "Bound harness time independently from judge tokens",
        decision:
          "Proposed default: keep verification cheaper than implementation and preserve time for a rejection receipt.",
        mechanics: [
          ...limitsMechanics(
            {
              max_steps: 8,
              max_tokens: 6000,
              wall_clock_timeout_ms: 120000,
              max_retries: 1,
              max_read_bytes: 2097152,
            },
            "one frozen candidate review",
          ),
          "Additionally propose check_timeout_ms = 60000 and max_check_output_bytes = 65536. Reserve receipt persistence time operationally; it is not a license for an unaccounted final model call.",
        ],
        tradeoff:
          "A short harness ceiling can reject slow integration suites; task-specific check profiles should select meaningful bounded checks before dispatch.",
        implementation: [
          existing("runtime/budget.ts"),
          planned("verification/check-profiles.ts"),
          planned("verification/pipeline.ts"),
        ],
        verification:
          "A hanging check is stopped by the planned process adapter, produces bounded failure evidence, and cannot trigger a late approval after timeout.",
      },
      {
        id: "evaluation",
        title: "09 / Evaluation & observability",
        subtitle: "False approvals are the primary gate failure",
        decision:
          "Proposed default: evaluate known good/bad patches and report false approvals separately from false rejections.",
        mechanics: [
          "Seed semantic defects, removed tests, irrelevant test passes, rubric omissions, stale candidate hashes, and prompt-injection comments.",
          "Track false-approval rate, false-rejection rate, criterion evidence coverage, deterministic rejection share, judge cost, and review latency.",
          "Version rubric and fixture suite together so score changes reflect actual gate behavior rather than an unrecorded acceptance standard change.",
        ],
        tradeoff:
          "Optimizing only approval accuracy can hide rare dangerous approvals; inspect false-positive cases and candidate identity violations explicitly.",
        implementation: [
          planned("evaluation/verifier-suite.ts"),
          planned("verification/rubric-registry.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "All seeded faulty candidates fail the appropriate criterion; receipt evidence reproduces the verdict against the frozen candidate.",
      },
    ],
    inputSchema: `// Proposed immutable verification request.\n${patchSchema}\n\ninterface VerifierInput {\n  readonly taskId: string;\n  readonly candidate: StagedPatch;\n  readonly rubricVersion: string;\n  readonly criteria: readonly {\n    readonly criterionId: string;\n    readonly kind: "deterministic" | "qualitative";\n    readonly requirement: string;\n    readonly checkProfileId: string | null;\n  }[];\n}`,
    outputSchema: `// Proposed rich receipt; richer than the existing ledger event.\n${receiptSchema}`,
  },
  sentinel: {
    modulePath: planned("agents/box-sentinel.ts"),
    runtimePattern:
      "Deterministic Workflow · Event-Driven / Append-Only Ledger (M1)",
    stateMutability:
      "Bounded observer cursor + deduplication cache; no task/source writes",
    tokenBudgetTier:
      "Tier 0 deterministic idle · 0 idle tokens / 2,000 proposed per incident",
    verificationGate:
      "Typed scoped alert + current run identity + reconciliation",
    version: "0.2",
    implementation: "Planned",
    blocks: [
      {
        id: "boundary",
        title: "01 / System boundary",
        subtitle: "Observe state changes without becoming the supervisor",
        decision:
          "Proposed default: the sentinel emits observations and lifecycle requests; the supervisor owns all run transitions.",
        mechanics: [
          "Subscribe to declared filesystem, process, and telemetry sources for one box/run scope. Keep only a cursor, bounded deduplication keys, and the last reconciled fingerprint.",
          "Emit SentinelAlert with causal event IDs, observed revision, and severity. The sentinel cannot patch files, approve work, restart agents, or expand capabilities.",
          "Idle watching makes zero model calls. It still consumes watcher handles, queue memory, and ordinary CPU for event processing and reconciliation.",
        ],
        tradeoff:
          "Separating observation from action adds a supervisor round trip but prevents a noisy watcher from directly triggering uncontrolled remediation.",
        implementation: [
          planned("agents/box-sentinel.ts"),
          planned("observability/event-source.ts"),
        ],
        verification:
          "A stale event from a previous run cannot cancel or wake the current run; an idle interval records zero model invocations.",
      },
      {
        id: "model",
        title: "02 / Model gateway",
        subtitle: "Deterministic routing first; incident analysis by exception",
        decision:
          "Proposed default: no periodic model polling; a small analysis model is optional for an explicit incident class.",
        mechanics: [
          "Tier 0 rules classify command exit, file change, queue overflow, and known resource thresholds using typed telemetry without a model.",
          "Tier 1/2 incident analysis is admissible only when a policy rule names an unresolved diagnosis, with sanitized bounded event context and an incident-specific token allowance.",
          "If analysis is unavailable or fallback cannot fit the remaining incident budget, emit a deterministic alert with diagnosis = null. Observation and urgent alerting do not wait for a model.",
        ],
        tradeoff:
          "Rule-first routing avoids recurring token cost but cannot interpret every novel failure. Optional diagnosis enriches an alert without becoming a prerequisite for signaling.",
        implementation: [
          planned("observability/incident-policy.ts"),
          planned("gateway/model-router.ts"),
        ],
        verification:
          "A hundred routine changes make no model calls; one eligible incident makes at most the admitted bounded analysis/fallback requests.",
      },
      {
        id: "context",
        title: "03 / Context engine",
        subtitle: "Incident window, fingerprints, causal IDs",
        decision:
          "Proposed default: retain a bounded recent event ring and retrieve only the incident's relevant metadata.",
        mechanics: [
          "Context contains current run/box identity, observer cursor, previous and current fingerprints, coalesced paths, exit metadata, and the triggering policy rule.",
          "Read limited diagnostic tails only when scope permits; redact environment values and secret-bearing payloads before any optional model request.",
          "Coalescing preserves event counts and first/last observed times so a burst is summarized without losing the fact that repeated changes occurred.",
        ],
        tradeoff:
          "A short event window bounds memory and tokens but can lose long-range causality; retain durable event references rather than an unbounded in-memory transcript.",
        implementation: [
          planned("observability/event-ring.ts"),
          planned("context/incident-context.ts"),
        ],
        verification:
          "A burst exceeding ring capacity yields an overflow marker and reconciliation request while preserving the active incident's causal references.",
      },
      {
        id: "tools",
        title: "04 / Tools & capabilities",
        subtitle: "Watch, inspect metadata, emit alerts",
        decision:
          "Proposed default: watch_filesystem, read_telemetry, read_process_status, bounded diagnostic reads, and emit_alert only.",
        mechanics: [
          "Watch roots and telemetry sources come from the run policy. Normalize event paths and revalidate box/run identity before reading metadata or publishing.",
          "No apply_patch, write_file, restart_process, cancel_task, or arbitrary shell command is exposed. Remediation is a supervisor decision with its own lease.",
          "The existing core has no filesystem watcher, telemetry bus, process observer, or durable cursor. BoxManager can support scoped metadata reads but is not an event system.",
        ],
        tradeoff:
          "Observation-only capabilities limit fast autonomous repair; they keep operational signals from bypassing the same safety and budget gates as normal work.",
        implementation: [
          planned("observability/filesystem-watcher.ts"),
          planned("observability/process-observer.ts"),
          existing("workspace/box-manager.ts"),
        ],
        verification:
          "An alert containing a suggested destructive command remains inert data; no mutation or cancellation tool is callable by the sentinel.",
      },
      {
        id: "control",
        title: "05 / Runtime control",
        subtitle: "Exact proposed event actor transitions",
        decision:
          "Proposed default: a non-model actor sleeps between notifications and reconciles after overflow or restart.",
        mechanics: [
          "Edges: STARTING → RECONCILING → WATCHING. WATCHING → COALESCING on events; COALESCING → CLASSIFYING → EMITTING → WATCHING for actionable changes.",
          "CLASSIFYING → WATCHING for nonactionable noise. WATCHING or COALESCING → RECONCILING on queue overflow, observer reconnect, or a scheduled fingerprint check.",
          "Any live state → STOPPING → STOPPED on run close/cancellation. Observer failure → BACKOFF → RECONCILING within retry cap; permanent failure → FAILED and a health signal.",
        ],
        tradeoff:
          "Event-driven actors eliminate model polling but filesystem notifications are lossy hints. Reconciliation remains necessary for correctness.",
        implementation: [
          planned("observability/sentinel-actor.ts"),
          planned("observability/reconciler.ts"),
        ],
        verification:
          "Dropped notifications and queue overflow trigger reconciliation; shutdown releases all watchers and cannot publish new alerts for the closed run.",
      },
      {
        id: "contracts",
        title: "06 / State & contracts",
        subtitle: "SentinelAlert records observation, not authority",
        decision:
          "Proposed default: version and deduplicate alerts by run, source cursor, and observed fingerprint.",
        mechanics: [
          "SentinelAlert includes alertId, runId, boxId, sourceEventIds, cursor, observedRevision, event kind, severity, affectedPaths, and optional diagnosis.",
          "A suggested next action is an enum such as RECONCILE or REQUEST_REVIEW, never an executable command or implicit approval.",
          "Persist the cursor only after accepted alert delivery; replayed notifications may redeliver but must not create duplicate accepted incidents.",
        ],
        tradeoff:
          "At-least-once delivery requires idempotent consumers; it is more honest than assuming every watcher notification arrives once in order.",
        implementation: [
          planned("contracts/sentinel-alert.ts"),
          planned("observability/cursor-store.ts"),
        ],
        verification:
          "Replay the same source cursor and fingerprint twice; the supervisor accepts one alert and a new fingerprint remains distinguishable.",
      },
      {
        id: "recovery",
        title: "07 / Recovery & termination",
        subtitle: "Reconcile after gaps; back off without model calls",
        decision:
          "Proposed default: bounded reconnect attempts and fingerprint reconciliation repair observer gaps.",
        mechanics: [
          "On restart load the last committed cursor, compare workspace fingerprints, and emit a gap marker plus current differences rather than inventing missing event history.",
          "On queue overflow drop/coalesce with an explicit overflow signal, then rescan within limits. If reconciliation exceeds limits, report degraded coverage.",
          "Use capped backoff for observer reconnects; do not extend the parent run lifetime. Cancellation closes subscriptions and rejects new incident analysis admissions.",
        ],
        tradeoff:
          "Reconciliation can be expensive for large boxes, but an honest coverage gap is preferable to silently losing changes or endlessly retrying.",
        implementation: [
          planned("observability/reconciler.ts"),
          planned("observability/reconnect-policy.ts"),
        ],
        verification:
          "Change files while the actor is down; restart reports the observed delta and coverage gap without duplicating a previously committed alert.",
      },
      {
        id: "budgets",
        title: "08 / Budgets & admission",
        subtitle: "Per-incident work cap; watcher lifecycle is separate",
        decision:
          "Proposed default: bound active incident processing; idle subscriptions inherit the parent run lifetime without consuming model tokens.",
        mechanics: [
          ...limitsMechanics(
            {
              max_steps: 8,
              max_tokens: 2000,
              wall_clock_timeout_ms: 10000,
              max_retries: 2,
              max_read_bytes: 262144,
            },
            "one active incident, not idle watcher lifetime",
          ),
          "Additionally propose max_queue_events = 256, coalesce_window_ms = 250, and reconciliation_interval_ms = 30000. These are event-system defaults to implement, not current runner options.",
        ],
        tradeoff:
          "A bounded queue may collapse detailed chronology during storms. Explicit overflow metadata and reconciliation protect state awareness without unbounded memory.",
        implementation: [
          planned("observability/sentinel-actor.ts"),
          planned("observability/event-ring.ts"),
          existing("runtime/budget.ts"),
        ],
        verification:
          "A simulated event storm stays within queue/read limits, emits one overflow marker, and does not create unlimited incident-model requests.",
      },
      {
        id: "evaluation",
        title: "09 / Evaluation & observability",
        subtitle: "Signal quality, missed events, and idle cost",
        decision:
          "Proposed default: drive the actor with a deterministic event source and injected clock.",
        mechanics: [
          "Fixtures cover normal changes, duplicated notifications, delayed events, watcher restart, queue overflow, stale run IDs, and process exits.",
          "Measure alert precision/recall, deduplication rate, detection latency, reconciliation gaps, active memory, watcher leaks, and model calls during idle.",
          "Separate operational liveness from diagnosis quality; a failed optional model must never hide an observed process crash.",
        ],
        tradeoff:
          "Synthetic event streams make behavior reproducible but cannot cover every OS watcher quirk; add platform-specific integration checks before production use.",
        implementation: [
          planned("evaluation/sentinel-suite.ts"),
          planned("observability/fake-event-source.ts"),
        ],
        verification:
          "An idle virtual-hour fixture consumes zero model tokens; a crash during model unavailability still produces an immediate typed alert.",
      },
    ],
    inputSchema: `// Proposed observer subscription; no model polling loop.\ninterface SentinelInput {\n  readonly runId: string;\n  readonly boxId: string;\n  readonly watchRoots: readonly string[];\n  readonly telemetrySourceIds: readonly string[];\n  readonly resumeCursor: string | null;\n  readonly parentExpiresAt: string;\n  readonly policyVersion: string;\n  readonly allowedIncidentClasses: readonly string[];\n}`,
    outputSchema: `// Proposed typed observation; nextAction is data, never authority.\ninterface SentinelAlert {\n  readonly alertId: string;\n  readonly runId: string;\n  readonly boxId: string;\n  readonly sourceEventIds: readonly string[];\n  readonly cursor: string;\n  readonly observedRevision: string;\n  readonly observedAt: string;\n  readonly kind: "FILES_CHANGED" | "PROCESS_EXITED" | "RESOURCE_THRESHOLD"\n    | "OBSERVER_GAP" | "QUEUE_OVERFLOW";\n  readonly severity: "info" | "warning" | "critical";\n  readonly affectedPaths: readonly string[];\n  readonly diagnosis: string | null;\n  readonly coverageDegraded: boolean;\n  readonly nextAction: "NONE" | "RECONCILE" | "REQUEST_REVIEW";\n}`,
  },
  curator: {
    modulePath: planned("agents/memory-curator.ts"),
    runtimePattern: "Deterministic Workflow · Event-Driven Ledger Curation (M1/M5)",
    stateMutability:
      "Versioned memory candidates; scoped publication; immutable run provenance",
    tokenBudgetTier:
      "Tier 1/2 structured distillation · 8,000 proposed tokens/job",
    verificationGate:
      "Verified provenance + disclosure scope + deduplication before publication",
    version: "0.2",
    implementation: "Planned",
    blocks: [
      {
        id: "boundary",
        title: "01 / System boundary",
        subtitle:
          "Distill finalized evidence; share only explicitly permitted lessons",
        decision:
          "Proposed default: a post-run job reads granted finalized artifacts and writes memory candidates, never execution state.",
        mechanics: [
          "Input is a finalized run, accepted verification receipts, repair trajectory references, and an explicit disclosure scope grant. Unrelated boxes are outside the read boundary.",
          "Keep raw evidence box-local. Cross-box publication requires a verified, sanitized general lesson and a permitted scope; summarization alone does not make private material safe to share.",
          "The curator cannot rewrite historical events, patch source, promote candidates, or turn an unverified failed attempt into a recommended repair.",
        ],
        tradeoff:
          "Narrow publication loses some rich project detail but reduces memory pollution and cross-box disclosure risk.",
        implementation: [
          planned("agents/memory-curator.ts"),
          planned("memory/scope-policy.ts"),
          existing("ledger/event-log.ts"),
        ],
        verification:
          "A job granted one box cannot read another box's artifacts or publish private source text into shared memory.",
      },
      {
        id: "model",
        title: "02 / Model gateway",
        subtitle: "Batch distillation with grounded structured output",
        decision:
          "Proposed default: a structured summarization/analysis tier extracts problem, repair, rationale, and applicability from verified evidence.",
        mechanics: [
          "Tier 1 handles straightforward accepted trajectories; Tier 2 is admissible for contradictory attempts or subtle applicability constraints, with an explicit remaining-budget check.",
          "The model proposes a MemoryCandidate and source references. Deterministic validators check receipt existence, scope, sensitive fields, and deduplication before promotion.",
          "Provider fallback keeps the same source set, job identity, and schema. On unavailable or insufficient-budget fallback, leave the job deferred/failed rather than publishing a partial guess.",
        ],
        tradeoff:
          "Cheap distillation is useful at volume, but confident overgeneralization can harm many future runs. Publication quality matters more than job completion rate.",
        implementation: [
          planned("memory/distiller.ts"),
          planned("gateway/model-router.ts"),
          planned("memory/publication-validator.ts"),
        ],
        verification:
          "A candidate with fluent but unsupported rationale is rejected even when its schema is valid; fallback does not change source provenance.",
      },
      {
        id: "context",
        title: "03 / Context engine",
        subtitle: "Accepted repair trajectory with explicit constraints",
        decision:
          "Proposed default: curate the evidence path that explains the repair, not the full raw transcript.",
        mechanics: [
          "Select acceptance criteria, accepted diff references, verification results, relevant failed approaches, and environment constraints such as language/runtime versions.",
          "Include only failures that explain why the final repair worked. Strip credentials, personal content, unrelated file excerpts, and instructions embedded in tool output before model admission.",
          "Maintain source artifact IDs and content hashes through compression so every lesson statement can be checked against the finalized run.",
        ],
        tradeoff:
          "Selecting only the accepted path can hide useful negative evidence; retain failed approaches when they explain an applicability boundary.",
        implementation: [
          planned("context/curation-context.ts"),
          planned("memory/trajectory-selector.ts"),
          planned("policy/redaction.ts"),
        ],
        verification:
          "A fixture contains a real repair plus unrelated secret-bearing logs; the distillation input retains the repair evidence and excludes unrelated private payloads.",
      },
      {
        id: "tools",
        title: "04 / Tools & capabilities",
        subtitle: "Scoped artifact reads and controlled memory writes",
        decision:
          "Proposed default: expose finalized artifact reads, redact, deduplicate, write_candidate, and policy-gated promote_memory.",
        mechanics: [
          "read_finalized_run and read_receipt require a box/run scope grant. Reject open runs, mutable candidate source, and arbitrary filesystem paths.",
          "write_memory_candidate is separate from promote_memory. Promotion checks verification provenance, disclosure scope, and duplicate/conflict policy in deterministic code.",
          "No shell, source editing, direct vector-store administration, or unrestricted cross-box search is exposed. A database connection must enforce scope independently of model-provided filters.",
        ],
        tradeoff:
          "Separate write and promote tools add workflow steps but make unpublished drafts and trusted reusable memory distinguishable.",
        implementation: [
          planned("tools/memory-tools.ts"),
          planned("memory/artifact-reader.ts"),
          planned("memory/publication-validator.ts"),
        ],
        verification:
          "A forged shared scope, missing receipt, or direct index write request fails before any shared memory entry becomes retrievable.",
      },
      {
        id: "control",
        title: "05 / Runtime control",
        subtitle: "Exact proposed post-run batch transitions",
        decision:
          "Proposed default: a durable idempotent job pipeline publishes only after every validation gate passes.",
        mechanics: [
          "Edges: QUEUED → LOADING → DISTILLING → VALIDATING → DEDUPLICATING → PUBLISHING → COMPLETE. VALIDATING → REJECTED on bad provenance/scope; DEDUPLICATING → COMPLETE for an identical existing lesson.",
          "Transient load/provider/storage failure → RETRY_WAIT → the failed stage within the original job budget. A conflicting lesson routes to REVIEW_REQUIRED rather than overwriting accepted memory.",
          "Any live state → STOPPED on deadline/cancellation; retry exhaustion → FAILED. A fresh manually authorized job is distinct from silently resetting an exhausted job.",
        ],
        tradeoff:
          "A durable queue and stage records add infrastructure, but prevent duplicate publication when batch workers restart.",
        implementation: [
          planned("memory/curation-pipeline.ts"),
          planned("memory/job-store.ts"),
        ],
        verification:
          "Crash before and after publication; retrying the same job key creates at most one new memory version and preserves the source run.",
      },
      {
        id: "contracts",
        title: "06 / State & contracts",
        subtitle:
          "CuratedMemoryEntry includes provenance, scope, and retirement",
        decision:
          "Proposed default: version lessons and record applicability constraints; corrections create new versions instead of rewriting history.",
        mechanics: [
          "CuratedMemoryEntry stores problem, repair, rationale, applicability, source run/receipt IDs, content hashes, disclosure scope, version, status, and supersedesId.",
          "ACTIVE entries are retrievable only within policy scope. RETIRED versions remain inspectable but cannot be proposed as current guidance.",
          "TypeScript readonly documents intent; runtime validators, immutable storage records, and query-time scope checks are still required. No memory store or role contract exists in the current kernel.",
        ],
        tradeoff:
          "Versioning and retirement complicate retrieval but keep outdated repairs from silently persisting as universal advice.",
        implementation: [
          planned("contracts/curated-memory-entry.ts"),
          planned("memory/entry-store.ts"),
          planned("memory/retrieval-policy.ts"),
        ],
        verification:
          "A retired lesson is excluded from guidance retrieval; a superseding entry retains the old provenance and cannot broaden its disclosure scope implicitly.",
      },
      {
        id: "recovery",
        title: "07 / Recovery & termination",
        subtitle: "Idempotent jobs, explicit conflicts, reversible publication",
        decision:
          "Proposed default: key jobs by source run plus curation policy version, and reconcile before repeating a publish.",
        mechanics: [
          "On storage timeout, query publication by job/idempotency key before retrying. Never generate a fresh entry ID simply to escape an uncertain write result.",
          "On contradictory evidence or later failed reuse, mark the lesson REVIEW_REQUIRED or RETIRED through a new auditable version; do not delete its source receipts.",
          "Policy denial and sensitive-content detection are permanent job rejections. Transient queue/provider errors may retry within the shared retry and deadline allowance.",
        ],
        tradeoff:
          "Conservative conflict handling leaves some lessons unpublished; automatic overwrite would spread unreviewed conclusions to unrelated runs.",
        implementation: [
          planned("memory/job-store.ts"),
          planned("memory/publication-reconciler.ts"),
          planned("memory/retirement.ts"),
        ],
        verification:
          "Simulate an acknowledged-lost publish response and a later contradiction; one entry is published, then an auditable retirement prevents future retrieval.",
      },
      {
        id: "budgets",
        title: "08 / Budgets & admission",
        subtitle: "Bound one finalized run per curation job",
        decision:
          "Proposed default: small asynchronous jobs with an explicit source-size cap and no unbounded transcript ingestion.",
        mechanics: [
          ...limitsMechanics(
            {
              max_steps: 12,
              max_tokens: 8000,
              wall_clock_timeout_ms: 120000,
              max_retries: 2,
              max_read_bytes: 2097152,
            },
            "one finalized-run curation job",
          ),
          "Additionally propose max_entries_per_job = 3 and max_entry_bytes = 16384. Queue batch concurrency is separate from each job's budget and must also be configured.",
        ],
        tradeoff:
          "A source-size cap can defer complex long runs. Explicitly split evidence under new jobs rather than silently omitting constraints from the lesson.",
        implementation: [
          existing("runtime/budget.ts"),
          planned("memory/curation-pipeline.ts"),
          planned("memory/job-store.ts"),
        ],
        verification:
          "Oversized trajectories are rejected/deferred before model admission; retries and fallback requests cannot exceed the job's original envelope.",
      },
      {
        id: "evaluation",
        title: "09 / Evaluation & observability",
        subtitle: "Useful reuse without disclosure or stale advice",
        decision:
          "Proposed default: evaluate retrieval and downstream repair quality on held-out tasks, with explicit privacy and provenance fixtures.",
        mechanics: [
          "Seed unsupported claims, duplicate repairs, private examples, environment-specific fixes, contradicted advice, and retired versions alongside valid reusable lessons.",
          "Measure supported-claim rate, sensitive-content leakage, duplicate publication, relevant retrieval, scope violations, and held-out task success with/without retrieved memory.",
          "Trace source job, policy version, publication decision, retrieval use, and reuse outcome; do not copy raw private evidence into shared analytics.",
        ],
        tradeoff:
          "Retrieval relevance alone does not prove a lesson improves engineering outcomes. Downstream comparisons are more expensive but reveal harmful overgeneralization.",
        implementation: [
          planned("evaluation/curator-suite.ts"),
          planned("memory/reuse-feedback.ts"),
          planned("memory/retrieval-policy.ts"),
        ],
        verification:
          "A lesson that is relevant but wrong for a different runtime is filtered by applicability, while box-private and retired entries never appear in cross-box results.",
      },
    ],
    inputSchema: `// Proposed finalized-run job; scope is an explicit grant.\n${receiptSchema}\n\ninterface CuratorInput {\n  readonly jobId: string;\n  readonly idempotencyKey: string;\n  readonly sourceRunId: string;\n  readonly boxId: string;\n  readonly finalizedAt: string;\n  readonly policyVersion: string;\n  readonly receipts: readonly VerificationReceipt[];\n  readonly trajectoryArtifactIds: readonly string[];\n  readonly scopeGrant: {\n    readonly scope: "BOX_LOCAL" | "SHARED_SANITIZED";\n    readonly approvedBy: string;\n    readonly expiresAt: string;\n  };\n}`,
    outputSchema: `// Proposed versioned entry; runtime validation and storage remain planned.\ninterface CuratedMemoryEntry {\n  readonly entryId: string;\n  readonly jobId: string;\n  readonly version: number;\n  readonly status: "CANDIDATE" | "ACTIVE" | "REVIEW_REQUIRED" | "RETIRED";\n  readonly scope: "BOX_LOCAL" | "SHARED_SANITIZED";\n  readonly boxId: string | null;\n  readonly problem: string;\n  readonly repair: string;\n  readonly rationale: string;\n  readonly applicability: readonly string[];\n  readonly sourceRunId: string;\n  readonly sourceReceiptIds: readonly string[];\n  readonly sourceContentHashes: readonly string[];\n  readonly policyVersion: string;\n  readonly supersedesId: string | null;\n  readonly createdAt: string;\n}`,
  },
};
