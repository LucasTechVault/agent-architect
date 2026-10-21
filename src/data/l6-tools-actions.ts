import type { LayerId } from "./agent-os-layers";

export type L6IntegrationId =
  | "enterprise-facades"
  | "mcp-adapters"
  | "isolated-environments";

export interface L6IntegrationOption {
  id: L6IntegrationId;
  title: string;
  subtitle: string;
  definition: string;
  useCase: string;
  tradeoff: string;
  moreDetail: string[];
  mcpPrimitives?: {
    primitive: "Tools" | "Resources" | "Prompts";
    role: string;
    layerTarget: string;
  }[];
  sandboxLifecycle?: string[];
}

export type L6OutcomeId =
  | "safe-transient"
  | "correctable-input"
  | "unknown-outcome"
  | "denied-paused-cancelled"
  | "contract-configuration";

export interface L6OutcomeCategory {
  id: L6OutcomeId;
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  shortPurpose: string;
  detectedCondition: string;
  handlingDecision: string;
  returnedOutcome: string;
  moreDetail: string[];
  highlightedFlowStages: (1 | 2 | 3 | 4 | 5 | 6)[];
  flowHighlightNote: string;
}

export interface L6ExecutionFlowStage {
  id: string;
  number: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  subtitle: string;
  layerTag: string;
  input: string;
  transformation: string;
  output: string;
  moreDetail: string[];
  hasExampleComposition?: boolean;
}

export interface L6CrossLayerLink {
  layerId: LayerId;
  title: string;
  relationship: string;
}

export const l6IntroStatement =
  "Domain interfaces, integration protocols, and execution environments solve different problems. They can be combined behind the same controlled tool boundary.";

export const l6ComposableNote =
  "These three mechanisms are composable: for example, an MCP-exposed tool can invoke an enterprise service façade or dispatch work into an isolated sandbox behind the same internal port.";

export const l6IntegrationOptions: L6IntegrationOption[] = [
  {
    id: "enterprise-facades",
    title: "Enterprise APIs & service façades",
    subtitle: "Expose clear domain operations through stable contracts.",
    definition:
      "Internal ports and service façades expose intent-based domain operations with typed input/output contracts, isolating the agent runtime from raw backend APIs and enforcing caller/resource restrictions from trusted execution context.",
    useCase:
      "Connecting agents to internal ticketing, order, telemetry, or database services where raw backend APIs are too broad, noisy, or coupled to internal schemas.",
    tradeoff:
      "Requires authoring and maintaining domain façades, in exchange for clear blast-radius control, testability, and stable contracts across environments.",
    moreDetail: [
      "Maintains consistent contracts across environments (such as dev, UAT, and production) while keeping credentials, data stores, and configuration strictly separate—contract parity does not mean identical access rights.",
      "Caller and resource scoping is injected by the host adapter from trusted context, and downstream backend services still enforce their own resource permissions.",
    ],
  },
  {
    id: "mcp-adapters",
    title: "MCP client adapters",
    subtitle: "Connect standard capabilities to the application’s interfaces.",
    definition:
      "The host application uses an MCP client adapter to communicate with an MCP server over a standard protocol, mapping discovered capabilities into the application's internal interfaces rather than bypassing runtime controls.",
    useCase:
      "Integrating external or shared capability servers through a common protocol without writing bespoke wire adapters for every integration.",
    tradeoff:
      "Standardises capability exchange across servers, but application policy, output handling, execution isolation, and retry safety must still be implemented explicitly.",
    moreDetail: [
      "Not every MCP primitive is a tool call: Tools route through the L6 execution boundary, whereas Resources (contextual data) and Prompts (reusable message/instruction templates) feed L3 context preparation where appropriate.",
      "An MCP tool can still be backed by an enterprise service façade or an isolated sandbox on the server side.",
    ],
    mcpPrimitives: [
      {
        primitive: "Tools",
        role: "Callable capabilities invoked behind the internal L6 execution interface.",
        layerTarget: "L6 · Tools & Actions",
      },
      {
        primitive: "Resources",
        role: "Contextual data and reference payloads supplied to context preparation.",
        layerTarget: "L3 · Context & Memory",
      },
      {
        primitive: "Prompts",
        role: "Reusable message or instruction templates integrated during context assembly.",
        layerTarget: "L3 · Context & Memory",
      },
    ],
  },
  {
    id: "isolated-environments",
    title: "Isolated code & browser environments",
    subtitle: "Execute code or browser work within explicit boundaries.",
    definition:
      "Runs generated code, shell commands, or browser automation inside explicit container, microVM, or isolated session boundaries with strict filesystem, network, process, credential, and time limits.",
    useCase:
      "Data analysis scripts, repository test execution, or web interaction where work must run in a controlled environment with bounded output and guaranteed cleanup.",
    tradeoff:
      "Provides strong containment for untrusted code and dynamic actions, at the cost of provisioning overhead, lifecycle management, and artifact collection rules.",
    moreDetail: [
      "A browser profile or browser context provides session separation, but is not equivalent to a container or microVM OS/kernel security boundary.",
      "Enforces wall-clock timeouts, explicit process-tree termination on cancellation, bounded stdout/stderr/artifact collection, and deterministic environment cleanup.",
    ],
    sandboxLifecycle: [
      "Provision",
      "Execute",
      "Collect results",
      "Clean up",
    ],
  },
];

export const l6SharedOwnershipPrinciple =
  "Use the dependency boundary to determine ownership: model-provider failures belong to L4 handling, while downstream tool-service failures belong to the relevant L6 adapter. Keep outcome facts distinct from the runtime’s control status.";

export const l6OutcomeCategories: L6OutcomeCategory[] = [
  {
    id: "safe-transient",
    number: 1,
    title: "Safe transient failure",
    shortPurpose:
      "Temporary dependency unavailability, rate limit, or transport blip on a safe-to-repeat operation.",
    detectedCondition:
      "Downstream rate limiting (e.g., HTTP 429), temporary service unavailability (e.g., HTTP 503), or transient transport failure on an operation known to be read-only or reliably deduplicated.",
    handlingDecision:
      "Retry inside the L6 adapter only when the operation is safe to repeat or backed by a verified idempotency contract, using bounded backoff with jitter and honouring service retry guidance such as Retry-After.",
    returnedOutcome:
      "Return the normalised result if a bounded retry succeeds; if attempts or deadlines are exhausted, return a structured exhausted-retry outcome without flooding model context with intermediate attempt noise.",
    moreDetail: [
      "Respects attempt limits, run deadlines, cancellation signals, and remaining L2 budgets.",
      "Avoids multiplying retries across nested layers (for example, adapter retries multiplied by client SDK retries and agent loop retries).",
    ],
    highlightedFlowStages: [4, 5],
    flowHighlightNote:
      "Highlighted in Section C: Stage 4 (bounded adapter retry within deadline) and Stage 5 (record final attempt outcome).",
  },
  {
    id: "correctable-input",
    number: 2,
    title: "Correctable input or generated code",
    shortPurpose:
      "Invalid model arguments, malformed query syntax, or a repairable script error.",
    detectedCondition:
      "Model-supplied arguments fail schema validation, a query is malformed, or a generated script fails with an error the model can reasonably repair on a subsequent turn.",
    handlingDecision:
      "Do not retry identical arguments inside the adapter; distinguish caller/model mistakes from adapter or service-contract bugs and cap total repair turns.",
    returnedOutcome:
      "Return a bounded, structured diagnostic observation preserving enough context for a useful correction while stripping sensitive configuration and irrelevant stack traces.",
    moreDetail: [
      "An HTTP 400 status code alone does not prove the model should retry with different arguments—adapter bugs or broken service contracts require operator fixes rather than model guessing.",
    ],
    highlightedFlowStages: [2, 4, 6],
    flowHighlightNote:
      "Highlighted in Section C: Stage 2 (contract validation), Stage 4 (execution diagnostic), and Stage 6 (structured repair observation to L3).",
  },
  {
    id: "unknown-outcome",
    number: 3,
    title: "Unknown execution outcome",
    shortPurpose:
      "A side-effecting operation was dispatched, but confirmation timed out before completion.",
    detectedCondition:
      "A mutating or side-effecting request crossed the adapter boundary, but the caller timed out or lost connection before receiving a definitive commit or failure response.",
    handlingDecision:
      "Record that the execution outcome is unknown and reconcile using operation identity, status checks, or reliable idempotency records—never blindly repeat the side-effecting action.",
    returnedOutcome:
      "Return an explicit unknown-outcome status to L2 so the runtime can reconcile state, reuse the same operation identity under a supported idempotency contract, or pause safely.",
    moreDetail: [
      "Generating an idempotency key in the caller does not make an arbitrary downstream service idempotent; the target service or façade must actually honour deduplication for that key.",
    ],
    highlightedFlowStages: [3, 4, 5],
    flowHighlightNote:
      "Highlighted in Section C: Stage 3 (durable operation identity), Stage 4 (in-flight timeout), and Stage 5 (record unknown outcome for reconciliation).",
  },
  {
    id: "denied-paused-cancelled",
    number: 4,
    title: "Denied, paused, or cancelled",
    shortPurpose:
      "Blocked by policy, waiting for approval, cancelled, or stopped at a deadline/budget.",
    detectedCondition:
      "L5 policy denies the action, the operation requires human approval, a cancellation signal arrives, or L2 stops execution because a deadline or budget limit was reached.",
    handlingDecision:
      "Follow L5 policy and L2 lifecycle behaviour immediately; never treat a policy denial as an argument-repair challenge for the model.",
    returnedOutcome:
      "Record the distinct lifecycle outcome (denied by policy, waiting for approval, cancelled, or budget-stopped); if cancellation occurs after a remote side effect was dispatched, preserve an unknown-outcome record when appropriate.",
    moreDetail: [
      "Cancelling a local awaiting call does not automatically roll back a remote side effect that has already begun executing.",
    ],
    highlightedFlowStages: [2, 3],
    flowHighlightNote:
      "Highlighted in Section C: Stage 2 (L5 policy denial or approval gate) and Stage 3 (L2 budget/deadline or cancellation lifecycle).",
  },
  {
    id: "contract-configuration",
    number: 5,
    title: "Contract or configuration failure",
    shortPurpose:
      "Broken credentials, missing configuration, or an incompatible upstream response schema.",
    detectedCondition:
      "Unsupported adapter contract, missing environment configuration, broken service credentials, or a downstream response that violates the expected schema.",
    handlingDecision:
      "Stop the affected operation, record diagnostic context in L7 with appropriate secret/PII redaction, and follow the alerting or escalation policy.",
    returnedOutcome:
      "Return a normalised capability failure without asking the model to guess credentials, repair deployment configuration, or work around an access restriction.",
    moreDetail: [
      "Separates infrastructure and integration defects (which require engineering/operator intervention) from task-level observations.",
    ],
    highlightedFlowStages: [4, 5],
    flowHighlightNote:
      "Highlighted in Section C: Stage 4 (adapter/environment failure) and Stage 5 (normalised failure + redacted L7 diagnostic).",
  },
];

export const l6ExampleAdapterComposition = {
  label: "Example adapter composition (illustrative — MCP is optional)",
  chain: [
    "Internal port",
    "MCP client adapter",
    "MCP server",
    "Enterprise API or sandbox worker",
  ],
  note:
    "An application can also connect an internal port directly to an enterprise API façade or sandbox manager without MCP.",
};

export const l6ExecutionFlowStages: L6ExecutionFlowStage[] = [
  {
    id: "flow-proposed-call",
    number: 1,
    title: "Proposed call",
    subtitle: "The agent/model requests an available capability.",
    layerTag: "From L4 · Model Gateway",
    input: "Structured tool call name and arguments emitted by the model turn.",
    transformation:
      "Capture the requested capability name, call identifier, and structured arguments proposed by the model.",
    output: "Candidate tool invocation ready for contract and policy validation.",
    moreDetail: [
      "A model's tool call is a proposal, not an immediate execution command.",
    ],
  },
  {
    id: "flow-validate-authorise",
    number: 2,
    title: "Validate & authorise",
    subtitle:
      "Resolve the tool, validate the invocation contract, and apply L5 policy or approval requirements.",
    layerTag: "L5 · Pre-tool policy",
    input: "Candidate tool invocation plus caller scope and current run taint state.",
    transformation:
      "Verify that the tool exists, validate argument types against the contract, and evaluate L5 policy rules (allow, deny, or pause for required approval).",
    output:
      "Authorised invocation, policy denial, or a paused approval request.",
    moreDetail: [
      "Caller identity and resource permissions are bound from trusted host context rather than model-supplied parameters.",
    ],
  },
  {
    id: "flow-prepare-operation",
    number: 3,
    title: "Prepare the operation",
    subtitle:
      "L2 provides operation identity, execution budget, and durable intent/progress handling where required.",
    layerTag: "L2 · Runtime & State",
    input: "Authorised tool invocation and active run budget.",
    transformation:
      "Assign or verify the operation identity (such as an idempotency key), enforce remaining step/time budgets, and record durable intent before side-effecting execution.",
    output:
      "Prepared operation envelope with deadline, cancellation signal, and operation identity.",
    moreDetail: [
      "Recording intent before dispatch allows L2 to detect and reconcile in-flight operations if a worker crashes or times out.",
    ],
  },
  {
    id: "flow-execute-adapter",
    number: 4,
    title: "Execute through the adapter",
    subtitle:
      "L6 invokes the selected API, MCP client adapter, or isolated execution environment.",
    layerTag: "L6 · Adapter boundary",
    input: "Prepared operation envelope and trusted caller/environment bindings.",
    transformation:
      "Invoke the target capability behind the internal port—via an enterprise service façade, an MCP client adapter, or an isolated sandbox—under bounded time and output limits.",
    output: "Raw adapter response, transient error, or timeout state.",
    moreDetail: [
      "Applies safe, bounded retries only when the failure is transient and the operation is safe to repeat.",
      "Enforces explicit process/session cleanup when isolated execution finishes or is cancelled.",
    ],
    hasExampleComposition: true,
  },
  {
    id: "flow-check-record",
    number: 5,
    title: "Check & record the result",
    subtitle:
      "Normalise the result, apply L5 output checks, and record the execution outcome through L2.",
    layerTag: "L5 + L2",
    input: "Adapter execution result or failure state.",
    transformation:
      "Normalise the outcome into the internal contract, run L5 post-tool output checks (such as untrusted-content tainting or redaction), and persist the durable outcome record in L2.",
    output: "Recorded execution outcome and policy-checked payload.",
    moreDetail: [
      "Keeps the factual execution outcome (success, retry exhausted, unknown outcome, contract failure) distinct from how the runtime decides to proceed.",
    ],
  },
  {
    id: "flow-return-observation",
    number: 6,
    title: "Return the observation",
    subtitle:
      "L3 selects the useful result or diagnostic for the next model context.",
    layerTag: "To L3 · Context & Memory",
    input: "Recorded execution outcome and policy-checked payload.",
    transformation:
      "Select the relevant fields or structured diagnostic, offload bulky payloads by reference if needed, and format a bounded observation for the next model call.",
    output: "Scoped, budgeted observation ready for L3 context assembly.",
    moreDetail: [
      "Raw tool responses are not automatically dumped verbatim into the prompt; L3 curates and budgets what enters the next model context.",
    ],
  },
];

export const l6TelemetryNote =
  "Across all six stages, L7 · Observability & Evaluation records attempt latency, retry counts, policy verdicts, and redacted outcome classifications.";

export const l6CrossLayerLinks: L6CrossLayerLink[] = [
  {
    layerId: "L2",
    title: "L2 · Runtime & State",
    relationship:
      "Provides operation identity, deadlines, durable intent records, and unknown-outcome reconciliation.",
  },
  {
    layerId: "L3",
    title: "L3 · Context & Memory",
    relationship:
      "Selects bounded observations for the next turn and consumes MCP resources/prompts.",
  },
  {
    layerId: "L4",
    title: "L4 · Model Gateway",
    relationship:
      "Emits structured tool-call proposals and owns model-provider transport retries/fallbacks.",
  },
  {
    layerId: "L5",
    title: "L5 · Guardrails & Policy",
    relationship:
      "Authorises tool calls before execution, triggers approval pauses, and inspects returned outputs.",
  },
  {
    layerId: "L7",
    title: "L7 · Observability & Evaluation",
    relationship:
      "Captures adapter spans, redacted failure diagnostics, and contract-fixture verification.",
  },
];
