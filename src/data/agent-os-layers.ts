export type LayerId = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";

export type StudyStatus = "Not started" | "Learning" | "Reviewed";

export const STUDY_STATUS_OPTIONS: readonly StudyStatus[] = [
  "Not started",
  "Learning",
  "Reviewed",
];

export type ConceptStudyState = Record<LayerId, StudyStatus>;

export const CONCEPT_STUDY_STORAGE_KEY = "agent-architect.concept-study-status.v1";

export function createInitialConceptStudyState(): ConceptStudyState {
  return {
    L1: "Not started",
    L2: "Not started",
    L3: "Not started",
    L4: "Not started",
    L5: "Not started",
    L6: "Not started",
    L7: "Not started",
  };
}

export function loadConceptStudyState(): ConceptStudyState {
  try {
    const raw = localStorage.getItem(CONCEPT_STUDY_STORAGE_KEY);
    if (!raw) return createInitialConceptStudyState();
    const parsed = JSON.parse(raw) as Partial<Record<LayerId, unknown>>;
    const base = createInitialConceptStudyState();
    for (const id of ["L1", "L2", "L3", "L4", "L5", "L6", "L7"] as const) {
      const val = parsed?.[id];
      if (
        val === "Not started" ||
        val === "Learning" ||
        val === "Reviewed"
      ) {
        base[id] = val;
      }
    }
    return base;
  } catch {
    return createInitialConceptStudyState();
  }
}

export function countReviewedConcepts(state: ConceptStudyState): number {
  return Object.values(state).filter((status) => status === "Reviewed").length;
}

export interface BoundaryFlow {
  upstream: string;
  port: string;
  downstream: string;
}

export interface EnforcementHook {
  id: string;
  name: string;
  boundary: string;
  detail: string;
}

export interface AgentOsLayer {
  id: LayerId;
  number: number;
  landingTitle: string;
  landingDescription: string;
  title: string;
  shortTitle: string;
  subsystemTag: string;
  tier: "entry" | "loop" | "rail";
  buildStepNumber: 1 | 2 | 3 | 4;
  buildStepLabel: string;
  runtimeSummary: string;
  runtimeRole: string;
  buildOrderRole: string;
  boundaryFlow: BoundaryFlow;
  invariants: [string, string, string];
  errorTaxonomyNote?: string;
  hooks?: EnforcementHook[];
  contractTitle: string;
  contractCode: string;
  recallKeywords: string[];
}

export interface ConceptGroup {
  id: "entry" | "loop" | "rail";
  label: string;
  rangeLabel: string;
  layerIds: LayerId[];
}

export const conceptGroups: ConceptGroup[] = [
  {
    id: "entry",
    label: "Entry control",
    rangeLabel: "L1",
    layerIds: ["L1"],
  },
  {
    id: "loop",
    label: "Agent execution",
    rangeLabel: "L2–L6",
    layerIds: ["L2", "L3", "L4", "L5", "L6"],
  },
  {
    id: "rail",
    label: "Cross-cutting",
    rangeLabel: "L7",
    layerIds: ["L7"],
  },
];

export interface LoopTerminationCondition {
  id: string;
  badge: string;
  title: string;
  detail: string;
}

export interface BuildOrderPhase {
  step: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  layers: LayerId[];
  whyStep: string;
  realWorldProof: string;
  deliverables: string[];
}

export interface LoopSimStep {
  stepIndex: number;
  turn: 1 | 2;
  layerId: LayerId;
  label: string;
  detail: string;
  otelSpan: string;
  isReturnArc?: boolean;
  isTermination?: boolean;
}

export const loopTerminationConditions: LoopTerminationCondition[] = [
  {
    id: "terminal-answer",
    badge: "✅ Terminal Answer Emitted",
    title: "Schema satisfied, no further tool calls",
    detail:
      "L4 emits a schema-valid final response with zero pending tool_calls and L5 output policy passes.",
  },
  {
    id: "budget-exhausted",
    badge: "🛑 Run Budget Exhausted",
    title: "max_steps, max_cost_usd, or wall_clock_timeout reached",
    detail:
      "L2 ExecutionBudget denies admission for the next tick and emits a deterministic stop reason.",
  },
  {
    id: "hitl-interrupt",
    badge: "⏸️ Async HITL Interrupt",
    title: "WAITING_FOR_APPROVAL serialized to checkpoint; worker freed",
    detail:
      "L5 Hook 2 intercepts a high-risk tool call; L2 persists the checkpoint and releases the compute worker until approval arrives.",
  },
];

export const l5EnforcementHooks: EnforcementHook[] = [
  {
    id: "hook-1",
    name: "Hook 1 · Pre-Inference Input Rail",
    boundary: "L3 → L4",
    detail:
      "Applies Spotlighting delimiters (<untrusted_data>) and PII/secret scrubbing before prompt bytes reach ModelGateway.",
  },
  {
    id: "hook-2",
    name: "Hook 2 · Pre-Tool Action Gate",
    boundary: "L4 → L6",
    detail:
      "Enforces deterministic IAM caller/index/operation allowlists and triggers async HITL risk pause before L6 side effects.",
  },
  {
    id: "hook-3",
    name: "Hook 3 · Post-Tool Output Taint",
    boundary: "L6 → L2/L3",
    detail:
      "Flags state.tainted = True when L6 returns untrusted external content, stripping autonomous write/egress tools on subsequent turns.",
  },
];

export const agentOsLayers: AgentOsLayer[] = [
  {
    id: "L1",
    number: 1,
    landingTitle: "Orchestration",
    landingDescription:
      "Decide how an agent run starts and coordinates its work.",
    title: "L1 · Topology & Orchestration",
    shortTitle: "Topology & Orchestration",
    subsystemTag: "Entry Control Plane",
    tier: "entry",
    buildStepNumber: 4,
    buildStepLabel: "Build Step 4 · Scale the Topology Last",
    runtimeSummary:
      "Receives the incoming trigger/event, selects the agent pattern (Single-Agent Loop default vs. Planner–Executor / Router), and initializes the run into L2.",
    runtimeRole:
      "Entry Control Plane that binds the incoming trigger, selects the simplest sufficient control topology (Single-Agent Loop by default), assigns scoped budgets, and seeds L2.",
    buildOrderRole:
      "Built LAST (Step 4). Start with a single-agent loop; only split into Planner–Executor, Router, or DAG topologies when L7 benchmarks prove single-context saturation.",
    boundaryFlow: {
      upstream: "Trigger / API Event",
      port: "OrchestrationTopologyPort",
      downstream: "L2 Durable Runtime Kernel",
    },
    invariants: [
      "Default to a Single-Agent Loop; never introduce multi-agent orchestration without L7 benchmark proof of single-context saturation.",
      "Isolate sub-agent working contexts; handoffs pass compact, schema-validated artifacts (TaskLease / EvidenceBundle) rather than raw message transcripts.",
      "Never chain >3 serial autonomous handoffs without a deterministic verification gate (0.95^10 = 59.8% serial reliability collapse).",
    ],
    contractTitle: "L1 · OrchestrationTopologyPort (10% Contract)",
    contractCode: `export type TopologyMode = "SINGLE_LOOP" | "PLANNER_EXECUTOR" | "ROUTER_DAG";

export interface RunEnvelope {
  readonly runId: string;
  readonly objective: string;
  readonly topology: TopologyMode; // Default: "SINGLE_LOOP"
  readonly maxSerialHandoffs: 1 | 2 | 3; // Invariant: never > 3 unverified
  readonly budget: { maxSteps: number; maxCostUsd: number; timeoutMs: number };
}

export interface OrchestrationTopologyPort {
  /** Admits trigger, enforces single-loop default, and initializes L2 kernel state. */
  initializeRun(envelope: RunEnvelope): Promise<{ runId: string; initialCheckpointId: string }>;
  /** Validates sub-agent handoff artifact; rejects raw transcript dumping. */
  delegateScopedTask(runId: string, lease: { taskId: string; allowedTools: readonly string[] }): Promise<void>;
}`,
    recallKeywords: [
      "Trigger",
      "OrchestrationTopologyPort",
      "L2",
      "single",
      "loop",
      "isolate",
      "context",
      "handoff",
      "3",
      "verification",
    ],
  },
  {
    id: "L2",
    number: 2,
    landingTitle: "Runtime & State",
    landingDescription:
      "Manage execution state, budgets, checkpoints, and recovery.",
    title: "L2 · Durable Runtime & Idempotency",
    shortTitle: "Durable Runtime & Idempotency",
    subsystemTag: "Kernel",
    tier: "loop",
    buildStepNumber: 3,
    buildStepLabel: "Build Step 2 (Minimal Loop) → Step 3 (Durable Hardening)",
    runtimeSummary:
      "Applies immutable state reducer, checkpoints run_id, and logs Write-Ahead idempotency_key before tool mutations.",
    runtimeRole:
      "The state-machine heart of the cyclic loop: folds observations via a pure reducer, enforces step/cost/deadline budgets, and writes write-ahead idempotency intents before L6 mutations.",
    buildOrderRole:
      "Built in two passes: a minimal in-memory loop in Step 2 to get Iteration 0 scores, then hardened in Step 3 with durable checkpoints, write-ahead idempotency_key, and async HITL pause.",
    boundaryFlow: {
      upstream: "L1 Envelope / L6 Observation Delta",
      port: "DurableRuntimeKernelPort",
      downstream: "L3 Context MMU & Event Ledger",
    },
    invariants: [
      "State transitions must be pure and append-only: NextState = Reduce(PriorState, Event); replay never re-executes tools or LLM calls.",
      "Write-Ahead Intent + deterministic idempotency_key = sha256(run_id + step_id + tool + canonical_args) MUST commit to durable storage before any mutating L6 tool call.",
      "Async HITL pauses (WAITING_FOR_APPROVAL) must serialize state to a durable checkpoint and immediately free the compute worker thread.",
    ],
    contractTitle: "L2 · DurableRuntimeKernelPort (10% Contract)",
    contractCode: `export type RunLifecycleState =
  | "RUNNING"
  | "WAITING_FOR_APPROVAL" // Worker thread freed; resumes via webhook
  | "COMPLETED"
  | "BUDGET_EXHAUSTED"
  | "FAILED";

export interface WriteAheadMutationIntent {
  readonly runId: string;
  readonly stepId: number;
  readonly idempotencyKey: string; // sha256(runId + stepId + toolName + canonicalArgs)
  readonly toolName: string;
}

export interface DurableRuntimeKernelPort<State, Event> {
  /** Pure state fold: deterministic projection with zero external side effects. */
  reduce(prior: Readonly<State>, event: Event): Readonly<State>;
  /** Must flush to durable log BEFORE L6 executes any mutating tool. */
  recordWriteAheadIntent(intent: WriteAheadMutationIntent): Promise<void>;
  /** Serializes state on HITL interrupt or tick boundary so workers never block idle. */
  checkpoint(runId: string, state: Readonly<State>, status: RunLifecycleState): Promise<string>;
}`,
    recallKeywords: [
      "DurableRuntimeKernelPort",
      "pure",
      "append-only",
      "reduce",
      "write-ahead",
      "idempotency_key",
      "idempotency",
      "HITL",
      "checkpoint",
      "worker",
    ],
  },
  {
    id: "L3",
    number: 3,
    landingTitle: "Context & Memory",
    landingDescription:
      "Prepare the information the model needs for each step.",
    title: "L3 · Context MMU & PromptRenderer",
    shortTitle: "Context MMU & PromptRenderer",
    subsystemTag: "Memory / MMU",
    tier: "loop",
    buildStepNumber: 2,
    buildStepLabel: "Build Step 2 · Single-Turn Brain + Minimal Loop",
    runtimeSummary:
      "Executes Write / Select / Compress / Isolate and compiles a prefix-cached, token-budgeted CanonicalPromptPayload.",
    runtimeRole:
      "Acts as the Memory Management Unit (MMU): pages relevant slices into working memory, freezes the static prefix for KV-cache hits, offloads >2KB payloads to artifact:// URIs, and outputs CanonicalPromptPayload.",
    buildOrderRole:
      "Built in Step 2 alongside L4 ModelGateway so the single-turn brain has deterministic, token-budgeted prompt compilation from day one.",
    boundaryFlow: {
      upstream: "L2 RunState & Artifact Store",
      port: "PromptRendererPort",
      downstream: "L4 ModelGateway (via L5 Hook 1)",
    },
    invariants: [
      "Static prefix bytes (System Prompt → Tool Schemas → Pinned Context) must NEVER mutate mid-run (no dynamic timestamps in system prompt) to preserve ≥80% KV-cache hit rate.",
      "Bulky tool outputs (>2KB) are stored out-of-band and passed by reference (artifact://sha256) with a compact schema/summary preview.",
      "All retrieved external documents and tool observations must be wrapped in Spotlighting delimiters (<untrusted_data source='...'>) before rendering.",
    ],
    contractTitle: "L3 · PromptRendererPort (10% Contract)",
    contractCode: `export interface CanonicalPromptPayload {
  /** Frozen byte-identical prefix across ticks to guarantee KV-cache reuse. */
  readonly staticPrefixHash: string;
  readonly systemInstruction: string;
  readonly toolDeclarations: readonly Record<string, unknown>[];
  /** Dynamic suffix budgeted strictly within maxInputTokens. */
  readonly workingMessages: readonly {
    readonly role: "user" | "assistant" | "tool_observation";
    readonly content: string; // >2KB replaced by artifact:// pointer
    readonly spotlighted: boolean;
  }[];
  readonly estimatedInputTokens: number;
}

export interface PromptRendererPort<State> {
  /** Executes Select / Compress / Isolate and emits a provider-agnostic payload. */
  render(state: Readonly<State>, maxInputTokens: number): CanonicalPromptPayload;
  /** Offloads >2KB tool payloads to blob store and returns an artifact:// URI summary. */
  externalizeBulkyOutput(rawOutput: string, byteLimit?: number): { uri: string; preview: string };
}`,
    recallKeywords: [
      "PromptRendererPort",
      "prefix",
      "KV-cache",
      "cache",
      "2KB",
      "artifact://",
      "reference",
      "Spotlighting",
      "untrusted",
      "CanonicalPromptPayload",
    ],
  },
  {
    id: "L4",
    number: 4,
    landingTitle: "Model Gateway",
    landingDescription:
      "Connect the runtime to models through a consistent interface.",
    title: "L4 · ModelGateway & Constrained Decoding",
    shortTitle: "ModelGateway & Decoding",
    subsystemTag: "Compute Engine",
    tier: "loop",
    buildStepNumber: 2,
    buildStepLabel: "Build Step 2 · Single-Turn Brain + Minimal Loop",
    runtimeSummary:
      "Adapts canonical prompt to provider wire protocols (vLLM/Gemini/OpenAI), enforces grammar/schema decoding, and handles LLM provider rate limits (429) & model fallback routing.",
    runtimeRole:
      "Pure compute transport & grammar-constrained decoder: translates CanonicalPromptPayload to provider wire format, guarantees schema-valid JSON/tool calls via Constrained Decoding, and handles LLM 429/503 fallbacks.",
    buildOrderRole:
      "Built in Step 2 so all model calls go through one governed, fallback-capable interface evaluated against L7 golden fixtures.",
    boundaryFlow: {
      upstream: "L3 CanonicalPromptPayload",
      port: "ModelGatewayPort",
      downstream: "L5 Pre-Tool Gate / L2 Turn Output",
    },
    invariants: [
      "Zero prompt-formatting, business templates, or string concatenation allowed inside ModelGateway; L3 owns 100% of prompt assembly.",
      "Provider transport errors (HTTP 429 rate limits, 503 overloaded, network blips) and model fallback routing are handled transparently inside L4 within the run's remaining budget.",
      "Structured outputs and tool-call arguments are enforced via Grammar / Constrained Decoding at token generation time—never via brittle regex post-parsing.",
    ],
    errorTaxonomyNote:
      "L4 owns LLM Provider Errors (HTTP 429 Rate Limit, 502/503 Model Overloaded, ContextWindowExceeded) via exponential backoff + capability-equivalent fallback routing.",
    contractTitle: "L4 · ModelGatewayPort (10% Contract)",
    contractCode: `export type ModelGatewayError =
  | { kind: "PROVIDER_RATE_LIMIT_429"; retryAfterMs: number; fallbackEligible: true }
  | { kind: "PROVIDER_OVERLOADED_503"; provider: string; fallbackEligible: true }
  | { kind: "CONTEXT_WINDOW_EXCEEDED"; requestedTokens: number; limit: number };

export interface ModelTurnResponse<TOutput> {
  readonly finishReason: "TERMINAL_ANSWER" | "TOOL_CALLS";
  readonly structuredOutput?: TOutput; // Guaranteed by constrained decoding grammar
  readonly toolCalls?: readonly { callId: string; name: string; args: Record<string, unknown> }[];
  readonly usage: { promptTokens: number; cachedPrefixTokens: number; completionTokens: number };
}

export interface ModelGatewayPort {
  /** Translates CanonicalPromptPayload to wire protocol; handles 429/503 fallback transparently. */
  generateTurn<TOutput>(
    payload: CanonicalPromptPayload,
    responseSchema: Record<string, unknown>,
    signal: AbortSignal,
  ): Promise<ModelTurnResponse<TOutput>>;
}`,
    recallKeywords: [
      "ModelGatewayPort",
      "zero",
      "formatting",
      "prompt",
      "429",
      "503",
      "fallback",
      "rate",
      "Constrained Decoding",
      "schema",
    ],
  },
  {
    id: "L5",
    number: 5,
    landingTitle: "Guardrails & Policy",
    landingDescription: "Apply checks to inputs, actions, and outputs.",
    title: "L5 · Multi-Point Guardrails & Policy",
    shortTitle: "Multi-Point Guardrails",
    subsystemTag: "3 Enforcement Hooks",
    tier: "loop",
    buildStepNumber: 3,
    buildStepLabel: "Build Step 3 · Production Hardening & Blast-Radius Control",
    runtimeSummary:
      "Intercepts execution at 3 hooks: Hook 1 (Pre-Inference Input Rail), Hook 2 (Pre-Tool IAM & HITL Gate), and Hook 3 (Post-Tool Output Taint).",
    runtimeRole:
      "Deterministic security policy engine hooking into 3 boundaries: (1) L3→L4 Input Rail, (2) L4→L6 Pre-Tool IAM & HITL Gate, and (3) L6→L2/L3 Post-Tool Taint tracking.",
    buildOrderRole:
      "Built in Step 3 before exposing the agent to real production write tools or untrusted external documents.",
    boundaryFlow: {
      upstream: "L3 Input / L4 Tool Call / L6 Output",
      port: "GuardrailPolicyPort (3 Hooks)",
      downstream: "Authorized Target or PolicyRejection",
    },
    invariants: [
      "Security boundaries are enforced 100% in deterministic host code—never via 'please do not call this tool' system prompt instructions.",
      "Operates across all 3 enforcement hooks: Hook 1 (Pre-LLM Spotlighting/PII scrub), Hook 2 (Pre-Tool IAM allowlist & HITL risk gate), and Hook 3 (Post-Tool Output Taint).",
      "Once Hook 3 sets state.tainted = True (after ingesting untrusted external content), autonomous write and external-egress tools are deterministically stripped or forced to HITL approval.",
    ],
    hooks: l5EnforcementHooks,
    contractTitle: "L5 · GuardrailPolicyPort — 3 Hooks (10% Contract)",
    contractCode: `export type PolicyDecision =
  | { verdict: "ALLOW"; sanitizedPayload?: unknown }
  | { verdict: "REQUIRE_HITL_APPROVAL"; reason: string; riskLevel: "HIGH" | "CRITICAL" }
  | { verdict: "DENY"; violationCode: string; safeDiagnosticForModel: string };

export interface GuardrailPolicyPort {
  /** Hook 1 (L3 → L4): Scrubs PII/secrets and verifies Spotlighting delimiters. */
  inspectPreInferenceInput(payload: CanonicalPromptPayload): PolicyDecision;
  /** Hook 2 (L4 → L6): Evaluates deterministic IAM allowlist, path scope, and taint state. */
  authorizePreToolAction(call: { tool: string; args: unknown; stateTainted: boolean }): PolicyDecision;
  /** Hook 3 (L6 → L2/L3): Marks state.tainted = true if tool output comes from untrusted source. */
  evaluatePostToolTaint(toolName: string, rawOutput: unknown): { taintRaised: boolean; sanitizedOutput: string };
}`,
    recallKeywords: [
      "GuardrailPolicyPort",
      "deterministic",
      "code",
      "Hook 1",
      "Hook 2",
      "Hook 3",
      "Pre-LLM",
      "Pre-Tool",
      "Post-Tool",
      "tainted",
      "taint",
      "write",
    ],
  },
  {
    id: "L6",
    number: 6,
    landingTitle: "Tools & Actions",
    landingDescription:
      "Execute tool requests and return structured results.",
    title: "L6 · Hexagonal Tools & Service Facade",
    shortTitle: "Hexagonal Tools & Facade",
    subsystemTag: "I/O Drivers",
    tier: "loop",
    buildStepNumber: 1,
    buildStepLabel: "Build Step 1 · The Test Bench & Hands First",
    runtimeSummary:
      "Invokes ToolExecutionPort → ToolAdapter → Enterprise Facade. Separates Retryable Downstream I/O Errors (503/timeout) from Model-Correctable Argument Failures.",
    runtimeRole:
      "Hexagonal I/O boundary: translates domain tool calls into enterprise APIs via anti-corruption facades, handles retryable downstream 503/socket blips in the adapter, and converts argument errors into structured observations for L3.",
    buildOrderRole:
      "Built FIRST in Step 1 alongside L7 fixtures. Until your Service Facades (e.g. ELK Facade) are contract-tested in isolation, an agent has no reliable hands.",
    boundaryFlow: {
      upstream: "L5-Authorized ToolInvocation",
      port: "ToolExecutionPort",
      downstream: "ToolAdapter → Enterprise Service Facade",
    },
    invariants: [
      "The agent runtime depends strictly on the abstract ToolExecutionPort; concrete REST/gRPC/SQL drivers live behind an anti-corruption Enterprise Service Facade.",
      "Retryable Downstream I/O Errors (socket timeout, HTTP 503, connection reset) are retried with bounded jitter inside the L6 adapter using the L2 idempotency_key.",
      "Model-Correctable Argument Failures (schema mismatch, invalid query syntax, missing field) are NEVER retried blindly by L6; they return as structured diagnostic observations to L3 so the LLM can self-correct on the next turn.",
    ],
    errorTaxonomyNote:
      "L6 strictly separates Retryable Downstream I/O Blips (503/socket timeout → adapter retries with idempotency_key) from Model-Correctable Argument Errors (400/validation → returned as observation to L3).",
    contractTitle: "L6 · ToolExecutionPort & Error Taxonomy (10% Contract)",
    contractCode: `export type ToolExecutionOutcome =
  | { status: "SUCCESS"; data: unknown; sourceTrust: "TRUSTED_INTERNAL" | "UNTRUSTED_EXTERNAL" }
  | {
      status: "MODEL_CORRECTABLE_ERROR"; // Returned via Observation Return Arc to L3 for LLM self-repair
      invalidField: string;
      correctiveHint: string;
    }
  | {
      status: "DOWNSTREAM_IO_EXHAUSTED"; // Adapter retried 503/timeout with idempotencyKey and failed
      service: string;
      attempts: number;
    };

export interface ToolExecutionPort {
  /** Executes authorized tool via Enterprise Facade; never leaks raw stack traces to the LLM. */
  execute(request: {
    toolName: string;
    args: Record<string, unknown>;
    idempotencyKey: string;
    signal: AbortSignal;
  }): Promise<ToolExecutionOutcome>;
}`,
    recallKeywords: [
      "ToolExecutionPort",
      "ToolAdapter",
      "Facade",
      "503",
      "timeout",
      "retryable",
      "argument",
      "validation",
      "self-correction",
      "observation",
    ],
  },
  {
    id: "L7",
    number: 7,
    landingTitle: "Observability & Evaluation",
    landingDescription:
      "Trace runs and assess their behaviour and outcomes.",
    title: "L7 · Observability & Verification Bus",
    shortTitle: "Observability & Verification Bus",
    subsystemTag: "Cross-Cutting Foundation Rail",
    tier: "rail",
    buildStepNumber: 1,
    buildStepLabel: "Build Step 1 · The Test Bench & Hands First",
    runtimeSummary:
      "Full-width horizontal foundation bus receiving vertical OTel telemetry spans from L1–L6 Online and grading trajectories against Golden Fixtures & pass^k Offline.",
    runtimeRole:
      "Dual-Tempo Cross-Cutting Rail: (1) Online Per-Tick Telemetry ingests OpenTelemetry GenAI spans from L1–L6 in real time; (2) Offline/CI Parity & Correctness Grading evaluates trajectories and outcomes against golden fixtures and pass^k.",
    buildOrderRole:
      "Built FIRST in Step 1 (alongside L6). Resolves the Runtime vs. Build paradox: every layer emits to L7 at runtime, which is why you build L7 as your foundational test bench before writing agent loops.",
    boundaryFlow: {
      upstream: "L1–L6 Vertical OTel Telemetry Taps",
      port: "TelemetryAndEvalBusPort",
      downstream: "OTel Span Sink + Golden Fixture Grader",
    },
    invariants: [
      "Every layer (L1 through L6) emits structured OpenTelemetry GenAI spans keyed by (run_id, step_id) capturing latency, token/cache counts, tool retries, and policy verdicts.",
      "Evaluation grades BOTH Outcome (final state/answer) AND Trajectory (tool sequence, forbidden mutations, budget adherence) against 20–50 sanitized Golden Fixtures.",
      "LLM judges must use calibrated binary (PASS/FAIL) rubrics aligned against human labels, and autonomous reliability is measured by pass^k = p^k (all k trials succeed), not pass@k.",
    ],
    contractTitle: "L7 · TelemetryAndEvalBusPort (10% Contract)",
    contractCode: `export interface OTelAgentSpan {
  readonly runId: string;
  readonly stepId: number;
  readonly layer: "L1" | "L2" | "L3" | "L4" | "L5" | "L6";
  readonly operation: string;
  readonly durationMs: number;
  readonly attributes: Record<string, string | number | boolean>;
}

export interface TrajectoryEvalReport {
  readonly fixtureId: string;
  readonly outcomeVerdict: "PASS" | "FAIL"; // Binary rubric only
  readonly trajectoryVerdict: "PASS" | "FAIL";
  readonly passHatK: number; // p^k consistency metric across k trials
}

export interface TelemetryAndEvalBusPort {
  /** Online Tempo: non-blocking per-tick span emission from L1–L6 vertical taps. */
  emitSpan(span: OTelAgentSpan): void;
  /** Offline / CI Tempo: grades recorded run trace against sanitized Golden Fixture. */
  evaluateRun(runId: string, fixtureId: string, trialsK: number): Promise<TrajectoryEvalReport>;
}`,
    recallKeywords: [
      "TelemetryAndEvalBusPort",
      "OTel",
      "span",
      "run_id",
      "step_id",
      "Trajectory",
      "Outcome",
      "binary",
      "PASS/FAIL",
      "pass^k",
    ],
  },
];

export const buildOrderPhases: BuildOrderPhase[] = [
  {
    step: 1,
    title: "BUILD STEP 1: The Test Bench & Hands First",
    subtitle: "L7 Verification Harness + L6 Hexagonal Tools & Facade",
    layers: ["L7", "L6"],
    whyStep:
      "You cannot build or tune an agent until you have (a) 20–50 golden sanitized fixtures defining correctness (L7 foundation rail), and (b) contract-tested ToolPort / Service Facades (L6) that retrieve real data safely.",
    realWorldProof:
      "Built ELK Facade (L6) + Meenu's sanitized fixtures (L7) before touching agent orchestration.",
    deliverables: [
      "20–50 sanitized Golden Fixtures + binary PASS/FAIL evaluator (L7)",
      "Contract-tested ToolExecutionPort + Enterprise Service Facade (L6)",
      "Separation of Retryable I/O Errors (503/timeout) vs. Model-Correctable Argument Errors (L6)",
    ],
  },
  {
    step: 2,
    title: "BUILD STEP 2: Single-Turn Brain + Minimal In-Memory Loop",
    subtitle: "L4 ModelGateway + L3 PromptRenderer + L2 Minimal Loop",
    layers: ["L4", "L3", "L2"],
    whyStep:
      "A single agent needs a minimal in-memory loop to call tools. Wire PromptRenderer (L3) → ModelGateway (L4) → ToolPort (L6) inside a basic loop and benchmark against your L7 fixtures to establish your Iteration 0 Baseline Score.",
    realWorldProof:
      "PocketAgent Core (PromptRenderer → ModelGateway → Minimal Tool Loop).",
    deliverables: [
      "Prefix-cached CanonicalPromptPayload compiler + >2KB artifact:// offloading (L3)",
      "ModelGateway with Constrained Decoding & 429/503 provider fallback routing (L4)",
      "Minimal in-memory step loop evaluated against L7 to record Iteration 0 Baseline Score (L2)",
    ],
  },
  {
    step: 3,
    title: "BUILD STEP 3: Production Hardening & Blast-Radius Control",
    subtitle: "L2 Durable Checkpoints & Idempotency + L5 Multi-Hook Guardrails & HITL",
    layers: ["L2", "L5"],
    whyStep:
      "Upgrade the minimal loop into a crash-resilient state machine (run_id persistence, write-ahead idempotency_key hashing, retry policies) and enforce the 3 L5 security hooks (input spotlighting, pre-tool IAM/HITL gates, post-tool taint tracking).",
    realWorldProof:
      "Prevents duplicate mutations on crash recovery & blocks untrusted prompt-injection side effects.",
    deliverables: [
      "Append-only reducer, durable run_id checkpoints, and write-ahead idempotency_key before mutations (L2)",
      "Hook 1 (Pre-LLM Spotlighting), Hook 2 (Pre-Tool IAM & HITL pause), Hook 3 (Post-Tool Taint) (L5)",
      "Worker release on WAITING_FOR_APPROVAL with deterministic resume (L2 + L5)",
    ],
  },
  {
    step: 4,
    title: "BUILD STEP 4: Scale the Topology Last",
    subtitle: "L1 Multi-Agent Orchestration",
    layers: ["L1"],
    whyStep:
      "Start with L1 as a single-agent loop. Only split L1 into Planner–Executor, Router, or Map-Reduce topologies if your L7 evaluation metrics prove a single context window is saturating.",
    realWorldProof:
      "Avoids premature multi-agent coordination tax & 0.95^10 serial error compounding.",
    deliverables: [
      "Single-Agent Loop default enforcement with explicit run envelope budgets (L1)",
      "Scoped sub-agent TaskLease handoffs with isolated context windows when justified by L7 metrics (L1)",
      "Hard cap of ≤3 serial autonomous handoffs before a deterministic verification gate (L1)",
    ],
  },
];

export const loopSimulationSteps: LoopSimStep[] = [
  {
    stepIndex: 0,
    turn: 1,
    layerId: "L1",
    label: "1. L1 Entry Control Plane",
    detail:
      "Admits incoming trigger, selects Single-Agent Loop default topology, sets run budget, and initializes L2.",
    otelSpan: "otel.span[L1]: initializeRun(topology='SINGLE_LOOP', maxSteps=8) → L7",
  },
  {
    stepIndex: 1,
    turn: 1,
    layerId: "L2",
    label: "2. L2 Kernel State & Budget Admission",
    detail:
      "Admits Turn 1 step budget, folds initial event into immutable RunState, and checkpoints run_id.",
    otelSpan: "otel.span[L2]: startStep(step=1, tokensRemaining=16000) → L7",
  },
  {
    stepIndex: 2,
    turn: 1,
    layerId: "L3",
    label: "3. L3 Context MMU + L5 Hook 1 (Input Rail)",
    detail:
      "Compiles prefix-cached CanonicalPromptPayload; L5 Hook 1 wraps external inputs in Spotlighting delimiters.",
    otelSpan: "otel.span[L3/L5]: renderPrompt(prefixCacheHit=true, hook1='ALLOW') → L7",
  },
  {
    stepIndex: 3,
    turn: 1,
    layerId: "L4",
    label: "4. L4 ModelGateway & Constrained Decoding",
    detail:
      "Calls provider with grammar-constrained schema; model emits tool_call: query_orders({ orderId: 'ORD-42' }).",
    otelSpan: "otel.span[L4]: generateTurn(finish='TOOL_CALLS', cachedPct=86%) → L7",
  },
  {
    stepIndex: 4,
    turn: 1,
    layerId: "L5",
    label: "5. L5 Hook 2 (Pre-Tool Action Gate)",
    detail:
      "Verifies caller IAM allowlist & taint state; L2 commits Write-Ahead idempotency_key before L6 dispatch.",
    otelSpan: "otel.span[L5/L2]: authorizePreTool(verdict='ALLOW', idempotencyKey='sha256:9f3a') → L7",
  },
  {
    stepIndex: 5,
    turn: 1,
    layerId: "L6",
    label: "6. L6 Hexagonal Tool & Service Facade",
    detail:
      "Invokes ToolExecutionPort → Enterprise Facade (survives one 503 blip via adapter retry) and returns order payload.",
    otelSpan: "otel.span[L6]: executeTool(tool='query_orders', retries=1, status='SUCCESS') → L7",
  },
  {
    stepIndex: 6,
    turn: 2,
    layerId: "L2",
    label: "7. Observation Return Arc (L6 ──► L2/L3 for Turn 2)",
    detail:
      "L5 Hook 3 checks post-tool taint; Observation & State Delta loop back from L6 into L2 Reducer and L3 PromptRenderer!",
    otelSpan: "otel.span[L6→L2/L3]: returnObservationDelta(taintRaised=false, turn=2) → L7",
    isReturnArc: true,
  },
  {
    stepIndex: 7,
    turn: 2,
    layerId: "L4",
    label: "8. Turn 2 Synthesis → Loop Termination Gate (✅)",
    detail:
      "L3 renders Turn 2 observation → L4 emits schema-valid Terminal Answer → Loop exits cleanly and L7 grades trajectory.",
    otelSpan: "otel.span[L4/L7]: terminateLoop(reason='TERMINAL_ANSWER_EMITTED', passHatK=1.0) → L7",
    isTermination: true,
  },
];
