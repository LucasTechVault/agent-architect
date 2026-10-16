export type ArchetypeId =
  "orchestrator" | "scout" | "builder" | "critic" | "sentinel" | "curator";

/** Suggested learning/build order, not an implementation status. */
export type BuildStage = 1 | 2 | 3 | 4;
export type ArchetypeColor =
  "violet" | "blue" | "amber" | "rose" | "teal" | "slate";

export interface FlowStep {
  label: string;
  detail: string;
}

export interface Milestone {
  id: string;
  title: string;
  detail: string;
  proof: string;
}

/** Options are prompts for the learner; no decision is committed by this data. */
export interface ArchitectureDecision {
  question: string;
  options: string[];
  recommendation: string;
}

export interface Archetype {
  id: ArchetypeId;
  name: string;
  shortName: string;
  role: string;
  tag: string;
  runtime: string;
  topology: string;
  color: ArchetypeColor;
  stage: BuildStage;
  summary: string;
  purpose: string;
  failureMode: string;
  mentalModel: string;
  stateOwnership: string[];
  allowedTools: string[];
  forbiddenTools: string[];
  modelStrategy: string;
  contextStrategy: string;
  flow: FlowStep[];
  loopBound: string;
  artifacts: string[];
  milestones: Milestone[];
  decisions: ArchitectureDecision[];
}

/**
 * Architectural learning targets for agentbox-core, not claims of shipped agents.
 * Milestone completion and decision records belong to the learning app's storage.
 */
export const archetypes: Archetype[] = [
  {
    id: "orchestrator",
    name: "The Orchestrator",
    shortName: "Orchestrator",
    role: "Turns an objective into bounded, coordinated work.",
    tag: "Supervisor",
    runtime: "Deterministic State Machine",
    topology: "Supervisor → scoped workers → verification gate",
    color: "violet",
    stage: 3,
    summary: "Own the plan. Route the work. Decide when the run is done.",
    purpose:
      "Keep task dependencies, worker ownership, and stopping rules explicit while specialists focus on one job.",
    failureMode:
      "Workers duplicate work, race on shared state, or keep retrying after the objective or budget has already ended.",
    mentalModel:
      "A control tower with a typed flight plan: workers report facts; the tower alone changes the shared task graph.",
    stateOwnership: [
      "Sole logical writer to TaskGraph and run lifecycle state.",
      "Requests canonical ledger appends through the ledger service; workers submit events rather than editing the log.",
      "Consumes immutable worker artifacts and verifies their task and workspace revision before accepting them.",
    ],
    allowedTools: [
      "dispatch_task",
      "cancel_task",
      "read_receipt",
      "request_approval",
      "append_event",
    ],
    forbiddenTools: [
      "apply_patch",
      "write_file",
      "run_cmd",
      "Direct writes to worker staging areas",
    ],
    modelStrategy:
      "Proposed: a model may suggest a plan, but code validates transitions, dependencies, and budgets. Invalid suggestions cannot mutate state.",
    contextStrategy:
      "Objective, dependency graph, remaining budget, artifact summaries, and unresolved decisions; retrieve raw evidence only when needed.",
    flow: [
      {
        label: "Validate",
        detail: "Check the objective, workspace scope, and execution budget.",
      },
      {
        label: "Plan",
        detail:
          "Create tasks with explicit dependencies and acceptance criteria.",
      },
      {
        label: "Dispatch",
        detail: "Lease runnable tasks to the appropriate specialists.",
      },
      {
        label: "Reconcile",
        detail: "Validate receipts and advance the graph deterministically.",
      },
      {
        label: "Stop",
        detail:
          "Finish, fail, or stop for budget with a final state and evidence.",
      },
    ],
    loopBound:
      "Every dispatch consumes a step; enforce task retry caps, total run steps, tokens, and a wall-clock deadline.",
    artifacts: [
      "TaskGraph",
      "TaskLease",
      "RunSummary",
      "Canonical execution ledger",
    ],
    milestones: [
      {
        id: "orchestrator-contracts",
        title: "Define tasks and transitions",
        detail:
          "Specify typed task states, dependencies, and legal lifecycle transitions.",
        proof:
          "A transition table rejects completion before prerequisites pass.",
      },
      {
        id: "orchestrator-budget",
        title: "Wire the execution budget",
        detail:
          "Charge each dispatch and stop when any configured budget is exhausted.",
        proof:
          "A deterministic worker stops at the exact configured step limit.",
      },
      {
        id: "orchestrator-routing",
        title: "Route one scoped task",
        detail:
          "Dispatch a typed task with a workspace revision and scoped capabilities.",
        proof:
          "A fake worker receives only its allowed scope and returns a typed result.",
      },
      {
        id: "orchestrator-ledger",
        title: "Enforce one state writer",
        detail:
          "Serialize task updates and validate duplicate worker responses.",
        proof: "Replaying the same receipt twice advances the task only once.",
      },
      {
        id: "orchestrator-stop",
        title: "Make termination explicit",
        detail:
          "Persist success, failure, cancellation, and budget stop reasons.",
        proof: "Each terminal path has one final event and no later dispatch.",
      },
    ],
    decisions: [
      {
        question: "How should execution move between states?",
        options: [
          "Code-owned transition table",
          "Model-selected transitions validated by code",
        ],
        recommendation:
          "Proposed starting point: code-owned transitions, with model planning as an input. Confirm before implementing.",
      },
      {
        question: "What happens when a budget expires?",
        options: [
          "Stop immediately with recorded partial results",
          "Reserve a bounded final synthesis allowance",
        ],
        recommendation:
          "Proposed starting point: immediate termination; add a separately accounted summary reserve later. Confirm the desired semantics.",
      },
    ],
  },
  {
    id: "scout",
    name: "The Recon Scout",
    shortName: "Recon Scout",
    role: "Gather focused evidence without changing the workspace.",
    tag: "Read-Only Scout",
    runtime: "Bounded Loop",
    topology: "Parallel fan-out → immutable evidence fan-in",
    color: "blue",
    stage: 3,
    summary: "Search broadly, cite precisely, hand back evidence.",
    purpose:
      "Reduce an unfamiliar repository into relevant symbols, file excerpts, and test locations before a builder changes it.",
    failureMode:
      "The builder guesses from incomplete context, or exploration quietly mutates the repository it is trying to understand.",
    mentalModel:
      "A survey team returning labeled photographs: every claim points to a location and the revision that was surveyed.",
    stateOwnership: [
      "Owns only a disposable, task-local scratchpad during its bounded search.",
      "Publishes an immutable EvidenceBundle with file paths, source ranges, hashes, and unresolved questions.",
      "Cannot write to TaskGraph, canonical workspace files, or cross-box memory.",
    ],
    allowedTools: ["ripgrep", "list_tree", "ast_symbols", "read_file"],
    forbiddenTools: [
      "apply_patch",
      "write_file",
      "run_cmd",
      "Network writes",
      "Cross-box memory updates",
    ],
    modelStrategy:
      "Proposed: use a fast model to choose bounded searches; escalate only when conflicting evidence needs deeper reasoning.",
    contextStrategy:
      "Start with a folder map and symbol index, then retrieve small source excerpts tied to the task and immutable revision.",
    flow: [
      {
        label: "Scope",
        detail: "Receive a read-only lease and a precise evidence question.",
      },
      {
        label: "Fan out",
        detail: "Divide independent questions among bounded scouts.",
      },
      {
        label: "Inspect",
        detail: "Search and read within the assigned snapshot.",
      },
      {
        label: "Bundle",
        detail: "Attach citations, revision identifiers, and uncertainty.",
      },
      {
        label: "Return",
        detail: "Submit evidence for the supervisor to reconcile.",
      },
    ],
    loopBound:
      "Cap parallel scouts, searches per scout, bytes read, output size, tokens, and deadline; report unanswered questions on exhaustion.",
    artifacts: ["EvidenceBundle", "SourceCitation", "Repository symbol map"],
    milestones: [
      {
        id: "scout-readonly",
        title: "Create a read-only tool surface",
        detail:
          "Expose repository listing, search, symbol inspection, and bounded reads.",
        proof: "A scout cannot invoke a write or arbitrary shell tool.",
      },
      {
        id: "scout-bundle",
        title: "Define evidence provenance",
        detail:
          "Include workspace revision, source path, range, and content hash in every citation.",
        proof: "A stale bundle is rejected after its referenced file changes.",
      },
      {
        id: "scout-bounds",
        title: "Bound the search loop",
        detail: "Enforce search, byte, token, and time limits per scout.",
        proof:
          "An endless-search fake stops and reports the unfilled evidence request.",
      },
      {
        id: "scout-fanout",
        title: "Add bounded parallel discovery",
        detail:
          "Dispatch independent evidence questions with a concurrency cap.",
        proof:
          "Instrumented workers never exceed the configured concurrency limit.",
      },
      {
        id: "scout-grounding",
        title: "Evaluate evidence quality",
        detail:
          "Use a small fixture repository with known relevant symbols and distractors.",
        proof:
          "The bundle locates the target function and cites the actual relevant lines.",
      },
    ],
    decisions: [
      {
        question: "Which workspace view should scouts inspect?",
        options: [
          "Immutable snapshot for the whole task",
          "Live workspace with per-read revision checks",
        ],
        recommendation:
          "Proposed starting point: one immutable task snapshot for simpler provenance. Confirm the cost and freshness trade-off.",
      },
      {
        question: "How should discovery find relevant code?",
        options: [
          "Text search and folder maps",
          "AST index plus text-search fallback",
        ],
        recommendation:
          "Proposed starting point: bounded text search, then add symbol indexing when benchmark misses justify it.",
      },
    ],
  },
  {
    id: "builder",
    name: "The Builder",
    shortName: "Builder",
    role: "Turn a scoped task and evidence into a verifiable candidate change.",
    tag: "ReAct Worker",
    runtime: "Iterative ReAct Tool Loop",
    topology: "Scoped worker → isolated staging → verifier",
    color: "amber",
    stage: 1,
    summary: "Reason, patch, run checks, and submit a candidate.",
    purpose:
      "Give implementation work a safe transaction boundary so a failed attempt does not become accepted workspace state.",
    failureMode:
      "Concurrent edits overwrite one another, half-finished changes leak into the main workspace, or passing a self-selected check is treated as approval.",
    mentalModel:
      "A developer working on a disposable branch: prepare a patch, collect test output, and request review before promotion.",
    stateOwnership: [
      "Owns a task-scoped shadow workspace and patch transaction based on a recorded revision.",
      "May mutate only leased paths and approved execution surfaces within that staging area.",
      "Submits a candidate patch; the orchestrator controls lifecycle and a verifier controls acceptance evidence.",
    ],
    allowedTools: [
      "apply_patch",
      "write_file",
      "read_file",
      "run_cmd (capability-scoped)",
      "run_tests",
    ],
    forbiddenTools: [
      "Write outside leased paths",
      "Promote its own patch",
      "Rewrite canonical ledger",
      "Access undeclared secrets or host resources",
    ],
    modelStrategy:
      "Proposed: a tool-capable model iterates on code and concrete failures; escalation requires a bounded retry policy and explicit cost accounting.",
    contextStrategy:
      "Task acceptance criteria, cited scout evidence, current staged diff, and the latest relevant diagnostics; trim unrelated history.",
    flow: [
      {
        label: "Stage",
        detail: "Create a shadow workspace from the accepted base revision.",
      },
      {
        label: "Reason",
        detail: "Choose the next action using task criteria and evidence.",
      },
      {
        label: "Act",
        detail: "Apply a scoped patch or run an authorized command.",
      },
      {
        label: "Observe",
        detail: "Read diagnostics and revise within the remaining budget.",
      },
      {
        label: "Submit",
        detail:
          "Freeze the candidate diff and request independent verification.",
      },
    ],
    loopBound:
      "Bound tool steps, retries, command timeouts, tokens, and wall time; cancellation terminates subprocesses and leaves an inspectable candidate.",
    artifacts: [
      "PatchTransaction",
      "CandidateDiff",
      "CommandResult",
      "CandidateRevision",
    ],
    milestones: [
      {
        id: "builder-stage",
        title: "Create a staging transaction",
        detail: "Start an isolated candidate from a known base revision.",
        proof:
          "A failed or cancelled task leaves the accepted workspace unchanged.",
      },
      {
        id: "builder-scope",
        title: "Enforce mutation scope",
        detail:
          "Validate patch paths, symlinks, and command capabilities before execution.",
        proof:
          "Traversal and symlink escape attempts cannot mutate outside the staging scope.",
      },
      {
        id: "builder-loop",
        title: "Implement the bounded tool loop",
        detail:
          "Handle tool requests, observations, retries, and cancellation explicitly.",
        proof:
          "A deliberately repeating worker terminates at its tool-step limit.",
      },
      {
        id: "builder-diff",
        title: "Freeze a candidate revision",
        detail:
          "Record the base, content digest, diff, and attached command outputs.",
        proof:
          "Changing a candidate after submission invalidates its identity.",
      },
      {
        id: "builder-promotion",
        title: "Gate candidate promotion",
        detail:
          "Require a matching verification receipt and detect a changed base.",
        proof: "A rejected, stale, or mismatched candidate cannot be promoted.",
      },
    ],
    decisions: [
      {
        question: "Where should the builder stage changes?",
        options: [
          "Directory copy with explicit scope checks",
          "Git worktree",
          "Container or micro-VM",
        ],
        recommendation:
          "Proposed: choose a worktree for version isolation; use an OS sandbox or container when command isolation is required. A worktree alone is not a security boundary.",
      },
      {
        question: "What edit format should tools accept?",
        options: [
          "Validated patch transactions",
          "Whole-file replacement with expected-content hash",
        ],
        recommendation:
          "Proposed starting point: patches with base validation; use full-file writes only for scoped new files or explicit replacements.",
      },
    ],
  },
  {
    id: "critic",
    name: "The Critic & Verifier",
    shortName: "Critic & Verifier",
    role: "Judge a frozen candidate against explicit acceptance criteria.",
    tag: "Adversarial Gatekeeper",
    runtime: "Code-Routed Verification Pipeline",
    topology: "Deterministic test harness → structured LLM judge → receipt",
    color: "rose",
    stage: 2,
    summary: "Make “done” a checkable claim with a recorded receipt.",
    purpose:
      "Separate producing a change from deciding whether it satisfies the task, and make rejection useful to the next attempt.",
    failureMode:
      "A plausible explanation hides broken tests, the builder grades its own output, or approval is reused after the candidate changes.",
    mentalModel:
      "An independent examiner: run the objective checks first, inspect the remaining criteria, and sign a receipt for exactly one submission.",
    stateOwnership: [
      "Reads a frozen candidate revision and an immutable acceptance specification.",
      "Produces an immutable VerificationReceipt with APPROVED or REJECTED and criterion-level evidence.",
      "Does not edit candidate source files, task state, or acceptance criteria.",
    ],
    allowedTools: [
      "run_tests (isolated harness)",
      "typecheck",
      "lint",
      "read_diff",
      "read_file",
      "emit_receipt",
    ],
    forbiddenTools: [
      "apply_patch",
      "write_file to candidate source",
      "Change acceptance criteria",
      "Promote candidate changes",
    ],
    modelStrategy:
      "Deterministic failures reject first. Proposed: a structured model judge evaluates only rubric criteria that cannot be decided by the harness; uncertainty rejects with reasons.",
    contextStrategy:
      "Frozen diff, acceptance rubric, source excerpts, and isolated test results; include task context without trusting builder explanations as proof.",
    flow: [
      {
        label: "Pin",
        detail: "Bind the review to a candidate digest and policy version.",
      },
      {
        label: "Execute",
        detail:
          "Run deterministic checks in a disposable verification workspace.",
      },
      {
        label: "Gate",
        detail:
          "Reject failed checks; only passing candidates reach rubric review.",
      },
      {
        label: "Judge",
        detail: "Evaluate remaining criteria with a schema-validated response.",
      },
      {
        label: "Receipt",
        detail: "Record the verdict, evidence, and any required corrections.",
      },
    ],
    loopBound:
      "One bounded pipeline per candidate; cap each check, judge tokens, total time, and the number of resubmissions at the orchestrator.",
    artifacts: [
      "VerificationReceipt",
      "CriterionResult",
      "HarnessReport",
      "RubricVersion",
    ],
    milestones: [
      {
        id: "critic-contract",
        title: "Define verification receipts",
        detail:
          "Bind verdicts to task, candidate digest, acceptance rubric, and evidence.",
        proof:
          "A receipt for another revision cannot approve the current candidate.",
      },
      {
        id: "critic-harness",
        title: "Build deterministic gates",
        detail:
          "Run task-specific assertions, tests, and type checks with explicit timeouts.",
        proof: "A failing test rejects before any judge-model request is made.",
      },
      {
        id: "critic-isolation",
        title: "Isolate verification execution",
        detail:
          "Run checks in a disposable copy and keep candidate source immutable.",
        proof: "A test that writes files cannot alter the submitted candidate.",
      },
      {
        id: "critic-judge",
        title: "Validate structured judgments",
        detail:
          "Require criterion outcomes, evidence references, and a valid verdict schema.",
        proof:
          "Malformed, unsupported, or uncertain judgments become a recorded rejection.",
      },
      {
        id: "critic-eval",
        title: "Measure false approvals",
        detail:
          "Review seeded good and faulty candidate patches against a fixed rubric.",
        proof:
          "The fixture report identifies false approvals and false rejections separately.",
      },
    ],
    decisions: [
      {
        question: "What is sufficient evidence for approval?",
        options: [
          "Deterministic checks only for measurable tasks",
          "Deterministic checks plus a bounded rubric judge",
        ],
        recommendation:
          "Proposed: use code assertions whenever possible and add a judge only for named qualitative criteria.",
      },
      {
        question: "How should uncertain judgments resolve?",
        options: ["Reject with missing evidence", "Pause for a human decision"],
        recommendation:
          "Proposed: reject incomplete machine evidence; reserve a human gate for explicitly designated approval criteria.",
      },
    ],
  },
  {
    id: "sentinel",
    name: "The Box Sentinel",
    shortName: "Box Sentinel",
    role: "Watch lifecycle signals and wake work only when something changes.",
    tag: "Reactive Observer",
    runtime: "Event-Driven Actor",
    topology: "Filesystem / telemetry events → observer → lifecycle requests",
    color: "teal",
    stage: 4,
    summary: "Sleep between events. Observe changes. Signal the supervisor.",
    purpose:
      "Detect workspace changes, command exits, and operational problems without repeatedly asking a model whether anything happened.",
    failureMode:
      "Polling burns model tokens, event bursts spawn duplicate work, or a missed filesystem notification leaves the run out of sync.",
    mentalModel:
      "A smoke detector with a logbook: react to signals, filter noise, and alert the owner rather than taking over the building.",
    stateOwnership: [
      "Owns a bounded event cursor, deduplication keys, and last-observed workspace fingerprint.",
      "Emits typed lifecycle observations or requests; the orchestrator decides state transitions.",
      "Does not edit source files or silently approve, retry, or terminate tasks itself.",
    ],
    allowedTools: [
      "watch_filesystem",
      "read_telemetry",
      "read_process_status",
      "emit_lifecycle_event",
    ],
    forbiddenTools: [
      "Unbounded model polling",
      "apply_patch",
      "Direct task state mutation",
      "Autonomous privilege escalation",
    ],
    modelStrategy:
      "Idle operation makes no model calls and consumes zero model tokens. Watchers and reconciliation still use ordinary compute; any optional model escalation is separately bounded.",
    contextStrategy:
      "Typed event payload, previous fingerprint, current run identity, and a minimal incident window only when escalation is justified.",
    flow: [
      {
        label: "Subscribe",
        detail: "Register workspace and process observers with bounded queues.",
      },
      { label: "Sleep", detail: "Wait for events with no model loop." },
      {
        label: "Coalesce",
        detail: "Deduplicate bursts and reconcile with current file state.",
      },
      {
        label: "Signal",
        detail: "Emit a typed event carrying scope and causal identifiers.",
      },
      { label: "Resume", detail: "Advance the cursor and return to waiting." },
    ],
    loopBound:
      "Cap queue depth, coalescing windows, retry count, and optional model escalations; reconcile after overflow and on restart.",
    artifacts: [
      "LifecycleEvent",
      "ObserverCursor",
      "WorkspaceFingerprint",
      "IncidentSignal",
    ],
    milestones: [
      {
        id: "sentinel-events",
        title: "Define lifecycle events",
        detail:
          "Give each event a source, run identity, timestamp, and deduplication key.",
        proof: "An event from an old run cannot wake its replacement.",
      },
      {
        id: "sentinel-watcher",
        title: "Observe files and processes",
        detail:
          "Subscribe to scoped filesystem and child-process lifecycle signals.",
        proof:
          "A fixture file change and command exit each emit the expected typed observation.",
      },
      {
        id: "sentinel-debounce",
        title: "Handle noisy event bursts",
        detail:
          "Coalesce repeated events with a bounded queue and explicit overflow handling.",
        proof:
          "A burst of duplicate changes produces one reconciled notification.",
      },
      {
        id: "sentinel-recovery",
        title: "Recover from missed events",
        detail:
          "Reconcile workspace fingerprints on restart and after queue overflow.",
        proof:
          "A change made while the observer is stopped is discovered on restart.",
      },
      {
        id: "sentinel-idle",
        title: "Verify idle behavior",
        detail:
          "Instrument model calls and watcher cleanup across a controlled idle interval.",
        proof:
          "Idle observation makes zero model calls and shutdown releases all watchers.",
      },
    ],
    decisions: [
      {
        question: "How should file changes be detected?",
        options: [
          "Filesystem watchers plus reconciliation",
          "Periodic fingerprint scans",
        ],
        recommendation:
          "Proposed: watchers for responsiveness with periodic bounded reconciliation for missed events. Confirm platform support first.",
      },
      {
        question: "When should an event wake a model?",
        options: [
          "Only explicit policy-matched incidents",
          "Every coalesced workspace change",
        ],
        recommendation:
          "Proposed: deterministic event routing first; a model wakes only for an explicitly approved incident class.",
      },
    ],
  },
  {
    id: "curator",
    name: "The Memory Curator",
    shortName: "Memory Curator",
    role: "Turn verified outcomes into scoped, reusable engineering lessons.",
    tag: "Post-Run Archivist",
    runtime: "Async Batch Pipeline",
    topology: "Completed run → distillation → validation → scoped memory",
    color: "slate",
    stage: 4,
    summary: "Preserve what worked, why it worked, and where it applies.",
    purpose:
      "Make successful repair trajectories reusable while keeping private box data, unverified guesses, and obsolete advice out of shared memory.",
    failureMode:
      "One bad run contaminates future tasks, project-specific secrets leak across boxes, or old lessons are retrieved without their original constraints.",
    mentalModel:
      "An archivist publishing reviewed field notes: keep provenance, remove sensitive details, and label exactly where each lesson applies.",
    stateOwnership: [
      "Reads finalized run records and verification receipts through an explicit scope grant.",
      "Writes versioned memory candidates and promotes them only after validation and disclosure-policy checks.",
      "Keeps box-local evidence separate from cross-box lessons; never rewrites historical execution events.",
    ],
    allowedTools: [
      "read_finalized_run",
      "read_receipt",
      "redact_sensitive_data",
      "deduplicate_memory",
      "write_memory_candidate",
      "promote_memory",
    ],
    forbiddenTools: [
      "Read unrelated box files",
      "Store credentials or raw private payloads",
      "Promote unverified claims",
      "Rewrite run history",
    ],
    modelStrategy:
      "Proposed: batch distillation after a run ends, with bounded input and output; deterministic provenance and scope checks gate publication.",
    contextStrategy:
      "Accepted patches, failed attempts that explain the repair, verification evidence, and environment constraints; exclude unrelated raw transcripts.",
    flow: [
      {
        label: "Collect",
        detail: "Read a finalized run and its evidence under a scoped grant.",
      },
      {
        label: "Distill",
        detail:
          "Extract the failure, repair, rationale, and conditions of use.",
      },
      {
        label: "Validate",
        detail:
          "Check provenance, redact sensitive content, and detect duplicates.",
      },
      {
        label: "Publish",
        detail: "Store a versioned lesson in its permitted memory scope.",
      },
      {
        label: "Reassess",
        detail: "Track reuse outcomes and retire contradicted lessons.",
      },
    ],
    loopBound:
      "Cap batch size, tokens per run, retry attempts, and stored lesson size; process jobs idempotently and leave failed jobs inspectable.",
    artifacts: [
      "MemoryCandidate",
      "VerifiedLesson",
      "RepairTrajectory",
      "ProvenanceRecord",
    ],
    milestones: [
      {
        id: "curator-schema",
        title: "Define a scoped lesson schema",
        detail:
          "Capture the problem, repair, constraints, provenance, version, and disclosure scope.",
        proof:
          "A lesson without a verified source receipt cannot be published.",
      },
      {
        id: "curator-jobs",
        title: "Queue finalized runs",
        detail:
          "Create bounded, retryable post-run jobs with idempotency keys.",
        proof:
          "Reprocessing the same finalized run does not duplicate lessons.",
      },
      {
        id: "curator-isolation",
        title: "Enforce memory boundaries",
        detail:
          "Separate per-box indexes from intentionally shared, sanitized lessons.",
        proof: "A query in another box cannot retrieve box-private text.",
      },
      {
        id: "curator-quality",
        title: "Validate before publication",
        detail:
          "Check provenance, sensitive fields, duplicates, and applicability constraints.",
        proof:
          "Seeded secrets and unverified suggestions are blocked from shared memory.",
      },
      {
        id: "curator-retrieval",
        title: "Evaluate reuse and retirement",
        detail:
          "Retrieve lessons against held-out tasks and retain success or contradiction evidence.",
        proof:
          "The report measures relevant retrieval and excludes retired lesson versions.",
      },
    ],
    decisions: [
      {
        question: "What can become cross-box memory?",
        options: [
          "Only verified, sanitized general lessons",
          "All summaries with retrieval-time filtering",
        ],
        recommendation:
          "Proposed: publish only verified, sanitized lessons with explicit scope; confirm the data-sharing policy before enabling it.",
      },
      {
        question: "How should lessons be retrieved initially?",
        options: [
          "Structured metadata and text search",
          "Embeddings with scope filters and reranking",
        ],
        recommendation:
          "Proposed starting point: structured filters and text search; introduce embeddings after measuring missed relevant lessons.",
      },
    ],
  },
];
