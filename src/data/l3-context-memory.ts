import type { LayerId } from "./agent-os-layers";

export type ContextSourceId =
  | "working-context"
  | "retrieved-knowledge"
  | "skills-procedures"
  | "cross-session-memory";

export interface ContextSourceOption {
  id: ContextSourceId;
  number: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  definition: string;
  useCase: string;
  tradeoff: string;
  moreDetail: string[];
}

export interface SectionIntuition {
  sectionKey: "A" | "B" | "C";
  stepLabel: string;
  heading: string;
  intuitionTitle: string;
  intuitionBody: string;
}

export type RagPipelineTabId = "offline" | "online";

export interface PipelineStageItem {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  input: string;
  transformation: string;
  output: string;
  moreDetail: string[];
  handoffLayerId?: LayerId;
  handoffLabel?: string;
}

export interface ContextAssemblyStage {
  id: string;
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  input: string;
  transformation: string;
  output: string;
  moreDetail: string[];
  layerBadge?: string;
}

export interface CrossLayerReference {
  layerId: LayerId;
  title: string;
  relationship: string;
}

export const l3IntroStatement =
  "Working context, retrieved knowledge, skills, and long-term memory provide different inputs. L3 selects and assembles them within the model’s context budget.";

export const l3SectionIntuitions: Record<"A" | "B" | "C", SectionIntuition> = {
  A: {
    sectionKey: "A",
    stepLabel: "Section A · Context sources",
    heading: "Where does the model’s context come from?",
    intuitionTitle: "Why an agent needs context sources",
    intuitionBody:
      "A language model is stateless on each call—it has no built-in awareness of your active task progress, private documents, procedural playbooks, or prior sessions. Without assembling the right context sources, the agent cannot function properly: it loses track of the user's goal mid-run, guesses domain facts instead of checking evidence, and repeats mistakes across runs. L3 gathers four distinct input sources while keeping governing instructions strictly separated from untrusted data.",
  },
  B: {
    sectionKey: "B",
    stepLabel: "Section B · Knowledge preparation & retrieval",
    heading: "How does source information become useful evidence?",
    intuitionTitle: "Why raw sources must be prepared and retrieved within scope",
    intuitionBody:
      "Raw enterprise documents, manuals, and databases cannot simply be dumped into a prompt—they are too large, noisy, and mixed across permission boundaries. Without structured preparation and scoped retrieval, the agent overflows its context window with irrelevant text, leaks restricted records across users, or cites unsupported claims. These reference pipelines turn raw sources into traceable, access-controlled evidence.",
  },
  C: {
    sectionKey: "C",
    stepLabel: "Section C · Context assembly",
    heading: "How is the next model context assembled?",
    intuitionTitle: "Why selected inputs must be budgeted and structured before inference",
    intuitionBody:
      "Even after gathering turn history, retrieved evidence, skills, and memory, the model operates under a strict token budget and relies on clear role boundaries. Without disciplined assembly, bulky tool outputs crowd out system instructions, stale turns dilute active constraints, and untrusted text can be mistaken for instructions. L3 selects, scopes, compacts, and renders a canonical request before handing off to L4.",
  },
};

export const l3SharedContextPrinciple =
  "Governing instructions and authorised tool definitions occupy a privileged control role. Retrieved evidence and tool observations are untrusted data inputs—retrieved text must never silently become governing instruction.";

export const l3ContextSources: ContextSourceOption[] = [
  {
    id: "working-context",
    number: 1,
    title: "Working context & turn history",
    subtitle:
      "Carry forward the goal, relevant observations, and current task context.",
    definition:
      "Assembles the active user request, pinned task goal, relevant conversation turns, working notes, selected tool observations, and execution metadata supplied by L2 into a model-visible view.",
    useCase:
      "Multi-step reasoning and tool loops where each model call needs current progress, recent observations, and pending objectives without exceeding the context window.",
    tradeoff:
      "Compaction and summarisation keep long runs within budget, but require careful selection so critical constraints or pending obligations are not dropped from the working view.",
    moreDetail: [
      "L2 remains authoritative for durable execution state, checkpoints, and crash recovery; L3 prepares a bounded, model-visible projection for the next call.",
      "Compacting or summarising working context in L3 does not erase the system's durable execution record in L2.",
      "Large tool outputs can be summarised or referenced by handle in working context while full payloads remain stored out-of-band.",
    ],
  },
  {
    id: "retrieved-knowledge",
    number: 2,
    title: "Retrieved knowledge · RAG",
    subtitle: "Bring authorised external evidence into the current task.",
    definition:
      "Supplies external domain evidence from unstructured sources (documents, pages, manuals, text) and structured sources (database records, graph results, API responses) within the caller's permitted scope.",
    useCase:
      "Grounding answers and decisions in up-to-date manuals, runbooks, tickets, relational records, or live service state that are not part of the base model weights.",
    tradeoff:
      "Improves factual grounding and source attribution, while adding retrieval latency, relevance filtering requirements, and strict access-scope enforcement.",
    moreDetail: [
      "Source type and retrieval timing are independent choices: retrieval can be application-prepared before a model call or agent-directed during a run.",
      "Not every source should be chunked and embedded—structured database, graph, or API sources use source-appropriate query methods rather than forced vector chunking.",
      "Every retrieved item carries provenance (source identity, version, and location) and remains scoped to the caller's authorisation boundary.",
    ],
  },
  {
    id: "skills-procedures",
    number: 3,
    title: "Skills & procedures",
    subtitle:
      "Load reusable instructions and supporting resources when relevant.",
    definition:
      "Uses progressive disclosure to keep the full catalog of procedural playbooks out of the initial prompt: (1) discover lightweight catalog metadata, (2) load the selected skill's instructions, and (3) load referenced resources or execute scripts only when needed.",
    useCase:
      "Equipping an agent with dozens of domain workflows, coding conventions, or diagnostic runbooks without paying the token cost of every procedure on every turn.",
    tradeoff:
      "Preserves context budget and reduces instruction dilution, while requiring accurate catalog matching so the right skill is loaded when needed.",
    moreDetail: [
      "Architectural boundary: L3 prepares selected skill instructions and reference documents as context, whereas executable scripts or actions run through the controlled L6 execution path.",
      "Skill content does not itself grant runtime permissions or override governing system instructions and L5 policy rules.",
    ],
  },
  {
    id: "cross-session-memory",
    number: 4,
    title: "Cross-session memory",
    subtitle: "Reuse relevant facts and past experiences across runs.",
    definition:
      "Stores and retrieves scoped long-term knowledge across sessions, distinguishing semantic memory (facts, preferences, domain conventions) from episodic memory (past events, run experiences, and outcomes).",
    useCase:
      "Personalised assistants or recurring operational workflows that benefit from remembering user preferences, environment facts, or lessons from prior incidents.",
    tradeoff:
      "Reduces repeated discovery across runs, but introduces staleness, cross-tenant leakage, and memory-poisoning risks if writes are not governed.",
    moreDetail: [
      "Memory retrieval and memory writing are separate architectural decisions: observations or generated summaries are not automatically promoted to trusted long-term facts.",
      "Every memory record requires explicit user, project, or tenant scope along with provenance, freshness tracking, correction, and deletion support.",
    ],
  },
];

export const l3PipelineReferenceNote =
  "Reference architectures — specific stages and techniques are optional or source-dependent.";

export const l3PipelineAccessProvenanceNote =
  "Access scope and provenance persist continuously across retrieval, parent expansion, evidence assembly, and citation resolution.";

export const l3OfflinePreparationStages: PipelineStageItem[] = [
  {
    id: "offline-landing",
    number: 1,
    title: "Landing",
    subtitle: "Capture a versioned source snapshot.",
    input: "Upstream documents, manuals, pages, or exported source snapshots.",
    transformation:
      "Capture source identity, version, acquisition timestamp, and provenance while applying access and retention rules to the landed snapshot.",
    output:
      "Traceable, versioned source snapshot ready for registration.",
    moreDetail: [
      "Retains original content so downstream units can always resolve back to the exact source version.",
      "Describing a snapshot as immutable refers to version integrity (edits create a new version) and does not prevent lifecycle retention or compliance deletion.",
    ],
  },
  {
    id: "offline-register",
    number: 2,
    title: "Register & deduplicate",
    subtitle: "Establish identity and process changes consistently.",
    input: "Versioned source snapshot and associated access metadata.",
    transformation:
      "Register the source in the canonical ingestion representation using source identity, version, and content checksums so repeated ingestion is idempotent.",
    output:
      "Registered source record with up-to-date permissions and change status.",
    moreDetail: [
      "Preserves permission and metadata updates even when the underlying text checksum is unchanged.",
      "Never deduplicates across access scopes in a way that merges or widens caller permissions.",
    ],
  },
  {
    id: "offline-parse",
    number: 3,
    title: "Parse",
    subtitle: "Preserve the source’s meaningful structure.",
    input: "Registered source content in its native format.",
    transformation:
      "Extract headings, paragraphs, tables, lists, and document hierarchy while recording page numbers, section paths, or character offsets.",
    output:
      "Structured document representation linked to original source locations.",
    moreDetail: [
      "Preserves table structure and section hierarchy rather than flattening everything into undifferentiated text.",
      "Retains stable links back to the original source version and offset.",
    ],
  },
  {
    id: "offline-chunk",
    number: 4,
    title: "Chunk",
    subtitle: "Create useful retrieval units with source links.",
    input: "Parsed document structure or structured source records.",
    transformation:
      "Segment unstructured text along meaningful document boundaries—using parent–child links where useful—while preserving source version and location on every unit.",
    output:
      "Addressable retrieval units with parent pointers and provenance metadata.",
    moreDetail: [
      "Structured records (such as relational rows, API objects, or graph nodes) may use a direct schema-preserving preparation path rather than text chunking.",
      "Parent–child relationships allow narrow retrieval matching while supporting broader context expansion within scope.",
    ],
  },
  {
    id: "offline-enrich",
    number: 5,
    title: "Enrich",
    subtitle: "Add metadata and optional retrieval context.",
    input: "Retrieval units with structural and provenance attributes.",
    transformation:
      "Attach deterministic metadata (product, date, owner, scope) and optionally generate contextual preludes or indexing aids clearly marked as derived.",
    output:
      "Enriched retrieval units where original source text and derived aids remain distinct.",
    moreDetail: [
      "Generated preludes or summaries can assist retrieval matching, but must remain distinguishable from original source content and are not treated as primary source evidence.",
    ],
  },
  {
    id: "offline-publish",
    number: 6,
    title: "Embed, index & publish",
    subtitle: "Publish searchable representations and maintain them.",
    input: "Enriched retrieval units and access-control attributes.",
    transformation:
      "Build dense/vector and lexical indexes where appropriate, attach filterable permission and source metadata, and publish version-aware updates.",
    output:
      "Searchable indexes supporting scoped queries, upserts, permission updates, and deletion propagation.",
    moreDetail: [
      "Supports ongoing maintenance including upserts, permission changes, and deletion propagation via tombstones or equivalent index removal.",
      "Offline indexing is supporting infrastructure for L3—it is not repeated on every model invocation.",
    ],
  },
];

export const l3OnlineRetrievalStages: PipelineStageItem[] = [
  {
    id: "online-request",
    number: 1,
    title: "Form the retrieval request",
    subtitle: "Preserve the question and derive useful searches.",
    input:
      "User or agent question plus caller and resource scope from trusted application context.",
    transformation:
      "Retain the original question and optionally rewrite, expand, or derive structured queries while preserving exact identifiers, error codes, quoted strings, dates, quantities, and negations.",
    output:
      "Scoped retrieval request containing original and derived queries under an explicit latency budget.",
    moreDetail: [
      "Preserving exact literal values (such as ticket IDs, SKU codes, or negations) prevents semantic rewriting from dropping critical constraints, while still allowing helpful query reformulation.",
      "Caller identity and permitted resource scope come from trusted host context rather than model-generated arguments.",
    ],
  },
  {
    id: "online-retrieve",
    number: 2,
    title: "Retrieve authorised candidates",
    subtitle: "Search within the permitted source scope.",
    input: "Scoped retrieval request and caller authorisation attributes.",
    transformation:
      "Execute dense, lexical, SQL, graph, or API searches with access constraints enforced inside the trusted retrieval boundary (preferring query-time filtering).",
    output:
      "Authorised candidate sets from relevant indexes or structured sources.",
    moreDetail: [
      "Access control is enforced at retrieval time—never as an afterthought filter applied only after unrestricted candidates have been sent to downstream rerankers or model context.",
      "Fails closed when caller authorisation or source permission scope cannot be established.",
    ],
  },
  {
    id: "online-fuse",
    number: 3,
    title: "Fuse & deduplicate",
    subtitle: "Combine relevant candidate sets.",
    input: "Authorised candidate lists from one or more retrieval paths.",
    transformation:
      "Combine complementary candidate lists when useful (for example, using reciprocal rank fusion) and deduplicate overlapping units while preserving provenance.",
    output: "Unified, deduplicated candidate pool with intact source metadata.",
    moreDetail: [
      "Preserves meaningful conflicting evidence across different sources or versions rather than silently discarding disagreements during deduplication.",
    ],
  },
  {
    id: "online-rerank",
    number: 4,
    title: "Rerank",
    subtitle: "Improve ordering when the benefit justifies the cost.",
    input: "Bounded set of authorised, deduplicated candidates.",
    transformation:
      "Optionally score and reorder candidates (for example, with a cross-encoder) within a strict candidate-count and latency cap.",
    output: "Prioritised candidate list ready for evidence assembly.",
    moreDetail: [
      "Operates strictly on authorised candidates.",
      "Optional stage: can be skipped when initial retrieval ranking is sufficient or when latency budgets are tight.",
    ],
  },
  {
    id: "online-assemble",
    number: 5,
    title: "Assemble evidence",
    subtitle: "Build a scoped evidence set within budget.",
    input: "Top-ranked authorised candidates and available context token budget.",
    transformation:
      "Optionally expand parent sections within permitted scope (rechecking access on dereference), assign stable evidence IDs, and pack evidence within budget while keeping it distinct from governing instructions.",
    output:
      "Token-budgeted evidence bundle with stable IDs, or an explicit insufficient-evidence outcome.",
    moreDetail: [
      "Reserves context budget for governing instructions, tool declarations, working history, and model output.",
      "Can return an explicit insufficient-evidence outcome when authorised sources do not contain relevant support.",
    ],
  },
  {
    id: "online-generate",
    number: 6,
    title: "Generate through L4",
    subtitle: "Ask the model to answer using the selected evidence.",
    input: "Canonical context containing instructions, question, and numbered evidence set.",
    transformation:
      "Hand off the assembled context to L4 · Model Gateway so the model generates a response referencing supporting evidence IDs.",
    output:
      "Model response with structured claim-to-evidence references or an insufficient-evidence reply.",
    moreDetail: [
      "L3 prepares the evidence-grounded context and reference contract; L4 · Model Gateway performs the actual model invocation.",
    ],
    handoffLayerId: "L4",
    handoffLabel: "Handoff to L4 · Model Gateway",
  },
  {
    id: "online-validate",
    number: 7,
    title: "Validate references & render citations",
    subtitle: "Resolve sources and assess answer support.",
    input: "Model response with evidence references and the permitted evidence set.",
    transformation:
      "Verify citation integrity (referenced IDs exist in the permitted set), assess claim support where required, and resolve stable IDs to source versions and locations.",
    output:
      "Answer with resolved citations, or a fallback route when support is insufficient.",
    moreDetail: [
      "Distinguishes three checks: (1) Citation integrity (ID exists in permitted evidence), (2) Claim support (evidence actually supports the statement), and (3) Citation rendering (ID resolves deterministically to source version and location).",
      "Deterministic ID resolution alone does not prove factual support. When support is insufficient, the system can qualify the answer, omit unsupported claims, retrieve further evidence within budget, or return an insufficient-evidence result.",
    ],
  },
];

export const l3ContextAssemblyStages: ContextAssemblyStage[] = [
  {
    id: "assembly-select",
    number: 1,
    title: "Select relevant inputs",
    subtitle: "Gather task goal, active turns, evidence, skills, and memory.",
    input:
      "Working context (L2 state projection), retrieved evidence, active skill instructions, and scoped cross-session memory.",
    transformation:
      "Select only the inputs relevant to the current step and task goal rather than dumping entire histories or catalogs.",
    output: "Candidate context slices tagged by input role and provenance.",
    moreDetail: [
      "Treats governing instructions, task goal, tool definitions, retrieved evidence, selected turn history, and memory as distinct input categories.",
    ],
    layerBadge: "From L2 & L3 sources",
  },
  {
    id: "assembly-scope",
    number: 2,
    title: "Check scope and organise evidence",
    subtitle: "Keep governing instructions distinct from untrusted evidence.",
    input: "Selected context slices and caller authorisation scope.",
    transformation:
      "Verify that all evidence and memory items match the caller's scope and clearly separate untrusted external data from governing instructions and tool declarations.",
    output: "Role-separated, scope-verified context sections.",
    moreDetail: [
      "Prevents retrieved text or tool observations from being confused with system instructions.",
      "Retains source identifiers and provenance metadata for downstream citation and audit.",
    ],
  },
  {
    id: "assembly-budget",
    number: 3,
    title: "Budget, deduplicate, and compact",
    subtitle: "Fit the whole request budget while preserving critical facts.",
    input: "Role-separated context sections and total request token budget.",
    transformation:
      "Account for the full request budget (instructions, tool schemas, evidence, history, and reserved output tokens), deduplicate repeated items, and compact older turns while preserving critical task facts and pending work.",
    output: "Token-budgeted context components that fit within model limits.",
    moreDetail: [
      "Compaction preserves pinned goals, unresolved questions, and active constraints while offloading bulky payloads by reference.",
    ],
  },
  {
    id: "assembly-render",
    number: 4,
    title: "Render the canonical context",
    subtitle: "Assemble a stable, traceable prompt structure.",
    input: "Budgeted context sections.",
    transformation:
      "Order sections consistently—placing stable governing instructions and tool definitions ahead of dynamic working history and evidence—and record selected evidence/memory IDs for traceability.",
    output: "Canonical model context payload ready for policy inspection.",
    moreDetail: [
      "Prefix caching note: Stable prefixes can improve cache reuse when supported by the serving implementation. However, dynamic content or compaction changes the prefix at the point of mutation, and serving-specific cache mechanics belong to L4.",
    ],
  },
  {
    id: "assembly-handoff",
    number: 5,
    title: "Hand off to L4",
    subtitle: "Pass through L5 input policy check to L4 · Model Gateway.",
    input: "Canonical model context payload.",
    transformation:
      "Apply the L5 pre-inference input policy check (such as delimiter verification and sensitive-data scrubbing) before passing the request to L4 · Model Gateway.",
    output: "Governed model invocation at L4 and trace metadata recorded in L7.",
    moreDetail: [
      "L3 owns context selection and assembly; L5 enforces input policy at the L3 → L4 boundary; L4 handles provider wire translation and model execution.",
    ],
    layerBadge: "L5 input check → L4 · Model Gateway",
  },
];

export const l3PrefixCachingNote =
  "Stable prefixes can improve cache reuse when supported by the serving implementation. Dynamic content and compaction can change the prefix, and serving-specific cache behaviour belongs with L4.";

export const l3CrossLayerLinks: CrossLayerReference[] = [
  {
    layerId: "L2",
    title: "L2 · Runtime & State",
    relationship:
      "Remains authoritative for durable execution state, pending work, checkpoints, and recovery.",
  },
  {
    layerId: "L4",
    title: "L4 · Model Gateway",
    relationship:
      "Executes the model call using L3's assembled context and manages serving-level prefix caching.",
  },
  {
    layerId: "L5",
    title: "L5 · Guardrails & Policy",
    relationship:
      "Inspects assembled context before model input and flags untrusted tool outputs.",
  },
  {
    layerId: "L6",
    title: "L6 · Tools & Actions",
    relationship:
      "Executes agent-directed retrieval calls and any scripts referenced by skills.",
  },
  {
    layerId: "L7",
    title: "L7 · Observability & Evaluation",
    relationship:
      "Traces context token usage, retrieval latency, and citation/grounding quality.",
  },
];
