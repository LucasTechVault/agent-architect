export type ControlDirectionId =
  | "code-directed"
  | "model-directed"
  | "mixed-control";

export interface ControlDirectionOption {
  id: ControlDirectionId;
  title: string;
  summary: string;
  definition: string;
  useCase: string;
  tradeoff: string;
  l2Implication: string;
  l3Implication: string;
}

export type CompositionAspectId =
  | "execution-structure"
  | "agent-coordination"
  | "invocation-delivery";

export interface CompositionAspect {
  id: CompositionAspectId;
  number: 1 | 2 | 3;
  title: string;
  shortDescription: string;
  explanationTitle: string;
  explanationBody: string;
  exampleFocusNote: string;
  l2Implication: string;
  l3Implication: string;
}

export interface StateContextImplication {
  id: string;
  title: string;
  detail: string;
  targetLayer: "L2" | "L3" | "L2 & L3";
}

export const l1CorePrinciple =
  "Execution and coordination choices shape state and context requirements.";

export const l1ComposableRolesSummary = [
  {
    id: "react-loops",
    term: "ReAct-style loops",
    role: "Describe iterative model decision-making, actions, and observations.",
  },
  {
    id: "graphs-state-machines",
    term: "Graphs and state machines",
    role: "Describe execution structure and stage transitions.",
  },
  {
    id: "event-driven",
    term: "Event-driven execution",
    role: "Describes how events trigger, resume, or coordinate work.",
  },
  {
    id: "multi-agent",
    term: "Multi-agent coordination",
    role: "Describes delegation, handoffs, and division of work.",
  },
] as const;

export const controlDirectionOptions: ControlDirectionOption[] = [
  {
    id: "code-directed",
    title: "Code-directed workflow",
    summary: "Authored control logic selects the next step.",
    definition:
      "Application code defines the sequence of steps and transition rules, calling models or tools at predetermined stages under explicit budgets, permissions, and stopping conditions.",
    useCase:
      "Predictable multi-stage pipelines—such as alert enrichment, schema validation, or report formatting—where the step order is known in advance.",
    tradeoff:
      "High predictability and straightforward verification, but cannot dynamically invent new investigation steps when unexpected evidence appears.",
    l2Implication:
      "L2 tracks the current stage index, step budgets, and stage-level checkpoints for recovery.",
    l3Implication:
      "L3 assembles stage-specific prompt templates with bounded inputs for each fixed model call.",
  },
  {
    id: "model-directed",
    title: "Model-directed agent",
    summary: "The model proposes the next action within runtime constraints.",
    definition:
      "Within runtime-enforced budgets, tool permissions, approval gates, and exit conditions, the model inspects observations and selects the next action iteratively.",
    useCase:
      "Open-ended diagnostics, root-cause investigation, or repository exploration where each check depends on what the prior observation revealed.",
    tradeoff:
      "Adapts flexibly to novel findings, at the cost of variable turn count, higher latency, and a broader trajectory space to evaluate.",
    l2Implication:
      "L2 enforces per-tick step/token budgets, records pending tool operations, and supports pause/resume if an action requires approval.",
    l3Implication:
      "L3 manages growing action–observation history across ticks via selection and compaction, keeping working context distinct from durable logs.",
  },
  {
    id: "mixed-control",
    title: "Mixed control",
    summary:
      "Defined stages contain model-directed work where adaptation is needed.",
    definition:
      "Code-directed outer stages govern intake, triage, verification, and delivery, while a bounded model-directed loop runs inside the stage that requires adaptive investigation.",
    useCase:
      "Incident triage and resolution systems that require deterministic intake and post-investigation verification around an open-ended diagnostic loop.",
    tradeoff:
      "Combines predictable outer guardrails with local autonomy, while requiring clear state and context contracts at stage boundaries.",
    l2Implication:
      "L2 tracks both outer stage transitions and inner loop tick budgets, checkpoints, and approval pauses.",
    l3Implication:
      "L3 isolates the inner loop's working trajectory from downstream stages, passing structured findings forward while retaining access to cited evidence when needed.",
  },
];

export const compositionAspects: CompositionAspect[] = [
  {
    id: "execution-structure",
    number: 1,
    title: "Execution structure",
    shortDescription:
      "Combine outer workflow stages with inner action–observation loops.",
    explanationTitle: "Execution structure in the example",
    explanationBody:
      "A graph or state machine defines the outer progression (Triage → Investigation → Verification → Report), while a ReAct-style action–observation loop operates inside the Investigation stage until findings are ready or a limit is reached.",
    exampleFocusNote:
      "Highlighted: Triage stage → Investigation stage (with Action ⇄ Observation loop) → Verification gate.",
    l2Implication:
      "L2 tracks both stage transitions and per-tick loop state; durable checkpoints or optional event logs allow recovery without re-running completed stages.",
    l3Implication:
      "L3 compiles working context for each investigation tick while keeping durable execution records separate from the prompt payload.",
  },
  {
    id: "agent-coordination",
    number: 2,
    title: "Agent coordination",
    shortDescription:
      "Decide when one agent suffices and how specialists exchange work.",
    explanationTitle: "Agent coordination in the example",
    explanationBody:
      "During the Investigation stage, the primary agent can delegate a focused check to a Specialist check agent and receive structured findings back before proceeding to Verification.",
    exampleFocusNote:
      "Highlighted: Delegation and findings return between Investigation stage and Specialist check.",
    l2Implication:
      "Parallel or delegated workers require task ownership, bounded timeouts, and deterministic result aggregation in L2.",
    l3Implication:
      "Multiple agents require explicit context boundaries and handoff contracts in L3—choosing deliberately when to pass a scoped summary, selected raw evidence, or both.",
  },
  {
    id: "invocation-delivery",
    number: 3,
    title: "Invocation and delivery",
    shortDescription:
      "Connect events, triggers, and resume signals to run lifecycle.",
    explanationTitle: "Invocation and delivery in the example",
    explanationBody:
      "An incoming Alert event starts the run into Triage, external approval or callback events can resume a paused check, and verified findings are emitted as an Incident report.",
    exampleFocusNote:
      "Highlighted: Incoming Alert event trigger and outgoing Incident report delivery.",
    l2Implication:
      "Repeated event delivery from queues or webhooks requires a deliberate duplicate-handling strategy, and pause/resume requires persisted execution state in L2.",
    l3Implication:
      "L3 extracts the relevant trigger payload and prior run context needed to initialize or resume model reasoning cleanly.",
  },
];

export const baselineStateContextImplications: StateContextImplication[] = [
  {
    id: "pause-resume",
    title: "Pause/resume requires persisted execution state",
    detail:
      "When a run pauses for approval or an async callback, L2 persists execution progress so compute workers are not held idle. Teams can persist state via snapshots, relational records, or optional event sourcing.",
    targetLayer: "L2",
  },
  {
    id: "parallel-workers",
    title: "Parallel workers require task ownership and aggregation",
    detail:
      "When L1 fans out or delegates work, L2 tracks task leases, timeouts, and how partial results merge back into the parent run.",
    targetLayer: "L2",
  },
  {
    id: "duplicate-events",
    title: "Repeated event delivery requires duplicate handling",
    detail:
      "Event-driven triggers and resume webhooks can fire more than once; L2 pairs run/step identifiers with idempotency checks to prevent duplicate execution.",
    targetLayer: "L2",
  },
  {
    id: "context-boundaries",
    title: "Multiple agents require explicit context boundaries and handoff contracts",
    detail:
      "Durable execution records in L2 are distinct from the selected or compacted context L3 sends to a model. Scoped handoffs are a deliberate design choice: a specialist may receive a concise brief, original evidence slices, or both.",
    targetLayer: "L3",
  },
];
