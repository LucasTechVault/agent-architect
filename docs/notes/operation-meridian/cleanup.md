This is to be within AI Building blocks, the high-level reference sheet:

Act as a Lead AI Infrastructure Architect. I am building an interactive, high-level Reference Architecture Sheet for hyperscale AI systems. I need you to generate a structured, nested Markdown document that acts as an "expandable" reference guide.

The high-level components:

For each of these 9 blocks, provide a 1-sentence contract and the key design choice/standard we use:

1. Runtime: What happens next and when do we stop? (Include failsafes like max_iterations and cyclic state detection).
2. State and Events: What is true, and what happened? (Include the Working Ledger / durable memory).
3. Context Engine: What should the model see right now? (Include pointer patterns for large data).
4. Model Gateway: Which model, and how do we call it safely? (Include Semantic Routing and Fallbacks).
5. Tools and Environment: What can the system actually do? (Include Read vs. Write execution gates, Fail-Soft wrappers, and the MCP - Model Context Protocol standard).
6. Knowledge and Memory: What does it know beyond model weights? (Include RAG and Vector stores).
7. Guardrails and Policy: What must never happen? Who may approve? (Include HITL / Human-in-the-loop).
8. Evaluation and Observability: Is it working, and how do we know?

[The Content]
On the Outside, we first define the Topology:

Under each section, provide the core definition, and then create a sub-list (representing the "expandable" variants and design decisions) using bullet points or nested tables.
Content to Include:
Layer 1: Composition Layer (Topology)

- Definition: The organizational chart. Who decides the next action—the code or the model?

- Variants to expand:
  Workflow (Deterministic): Code dictates the order. Includes Prompt Chaining, Routing, Scatter-Gather, and Evaluator-Optimizer.
  Autonomous (Probabilistic): Model dictates the order. Includes ReAct (Single Loop), Dynamic Supervisor, Handoff/Relay, and Peer-to-Peer Swarm.

[Component 1] Execution Layer (Runtime)

- Definition: The physical nervous system. How is state tracked, verified, and propagated? What triggers the next action?

- Variants to expand:
  Agent Loop: Bounded while loop, append-only state, context truncation.
  Graph / State Machine: Nodes/edges, explicit dependencies, state reducers.
  Event-Driven: Asynchronous pub/sub, ephemeral state, correlation IDs.
  Actor / Message Passing: Isolated state, A2A JSON envelopes, decentralized swarms.

- Design Decisions: Use a fixed pipeline when the sequence is known. Use an agent loop when the next permitted action depends on observations. Keep both bounded.
  (Tools and Environment), the core responsibility is to define what the system can actually do. To manage this, hyperscale architectures divide tools into four distinct functional archetypes based on their side effects and safety.

1. Sensors (Read-Only Retrieval)
   Sensors are strictly idempotent tools. An agent can call a sensor one time or one thousand times in a loop, and the outside world will not change.

- The Function: Fetching data from the external environment to build the agent's context.

- Examples: execute_select_sql, read_github_issue, get_weather_api, or searching a vector database.

- Engineering Rules: These tools require strict Context Protection (The Pointer Pattern). Because sensors can return massive datasets, the adapter must intercept heavy payloads, save them to disk, and return a lightweight summary or file pointer to the agent's context window. Under the Model Context Protocol (MCP), these are officially classified as "Resources" (the nouns of the system) rather than active tools.

---

Component 2: State and Events:
State is the authoritative ground truth of what is true, and Events are the immutable record of what actually happened.
When moving from a local prototype to a hyperscale system, managing State and Events requires specific architectural boundaries. If state is handled poorly, an agent loop cannot recover from a network drop, will duplicate destructive actions (like charging a credit card twice), and will poison future tasks with outdated facts.
The primary considerations for State and Events, along with their decision triggers, break down into five core patterns.

1. The Scope Split: Run State vs. Relationship State
   Never treat state as an unbounded chat-history dump. State must be partitioned into two completely different lifecycles:

- Run State (Mid-Run Autosave): Everything required to complete the active task. It holds the current step, the tool receipts, pending human approvals, and the event cursor position. Once the task concludes, this state can be archived or dropped.

- Relationship State (Long-Term Memory / Profile): Verified, source-tagged facts that remain valid across sessions months later (e.g., account tier, project constraints, user-specific rules).

- When to consider this: The moment your agent transitions from a single-turn chatbot to an agent handling asynchronous, multi-day, or multi-session workflows.

2. Event Sourcing vs. In-Place Mutation (Append-Only Ledger)
   In traditional CRUD applications, you update a database row in place (e.g., status = "completed"). In AI infrastructure, in-place updates destroy the causal chain.

- The Pattern: Treat state as an append-only log of immutable events (UserPromptReceived, ModelProposedAction, ToolReceiptCommitted, HumanApproved). The current "State" is simply the computed projection (reducer) of all past events.

- Why it matters: If an agent hallucinates or makes a catastrophic decision on turn 8, you cannot debug it if previous turns were overwritten. An event log allows deterministic time-travel: you can reconstruct the exact prompt, retrieved document, model response, and policy decision behind a bad answer.

- When to consider this: Whenever you require auditability, regulatory compliance, or debugging of non-deterministic model failures.

3. Crash Recovery and the "Tool Receipt" (Idempotency)
   When an agent fails mid-run due to an OOM error, a server redeployment, or a two-day pause waiting for a human signature, it must rehydrate safely.

- The Danger (The Ghost Action): If an agent runs a tool called charge_invoice(), and the server restarts before the LLM generates its summary, a naive system will reboot, see the task incomplete, and call charge_invoice() a second time.

- The Pattern: You must record Tool Receipts directly into the event store before returning control to the agent loop. A tool receipt pairs an idempotency key with the verified output of the external action.

- The Recovery Mechanic: When the runtime rehydrates the run from disk, it checks the event log. If an external effect already has a committed receipt, the runtime replays the cached receipt instead of re-executing the external API.

- When to consider this: Whenever your agent has access to Actuators (write tools) or encounters Human-in-the-Loop (HITL) gates.

4. State Concurrency Across Topologies
   How state is shared depends directly on the topology and runtime model:

- Single-Agent Loop: A single append-only array. One thread reads, updates, and appends.

- Workflow DAG (Module 14): Explicit typed inputs and outputs passed between nodes. A verified artifact from each step becomes the next step's input; nodes do not share a global mutable state.

- Multi-Agent Swarm / Actor Runtime (Module 15): Strict state isolation. Agent A never accesses Agent B’s ledger directly. They communicate exclusively through verified artifacts wrapped in message envelopes (like A2A).

- When to consider this: When scaling beyond a single worker (Level 01) into coordinated, specialized workers (Level 04).

5. Provenance, TTL, and Governed Forgetting
   Knowledge decays over time. If a user says "I am travelling to Tokyo next week," that fact is temporarily critical, but three weeks later it becomes poison if the agent assumes they are still in Tokyo.

- The Pattern: Every fact stored in the relationship state must carry metadata: Source Provenance (where it came from), Confidence Tier, and a Time-to-Live (TTL).

- Active Invalidation: The state engine must support explicit deletion and correction primitives. When a source document updates or permissions revoke, all derived facts across memory stores must be synchronously purged.

- When to consider this: When managing long-term personalization, cross-team data access, or multi-tenant enterprise data where stale evidence leads to factual drift.

---

[Component 3] Context Engine

If State is the hard drive, the Context Engine (Block 03) is the RAM.
In a local script, developers just append every new message, tool result, and PDF text into the LLM’s messages array until the API throws a TokenLimitExceeded error and the script crashes.
In enterprise infrastructure, this is unacceptable. Not only do massive context windows increase latency and cost, but they also cause "Context Rot." Research shows that as context grows, models suffer from the "Lost-in-the-Middle" phenomenon: they reliably use information at the very beginning (primacy bias) and the very end (recency bias) of a prompt, but become blind to information buried in the middle.
To prevent this, the Context Engine sits between your State Ledger and your Model Gateway. It acts as a strict, highly engineered funnel.
Here are the 4 core design patterns you must implement in a Context Engine.

1. Token Budget Partitioning
   A Context Engine treats the maximum context window like a strict financial budget. You never let one component consume the whole budget.
   The Pattern: You partition the prompt into reserved slices. For an 8k token budget, you might allocate:
   1k tokens: System Instructions & Persona.
   2k tokens: Tool Schemas (The MCP Manifest).
   3k tokens: Retrieved Evidence (RAG) or Tool Results.
   1k tokens: Working Memory (Recent conversation history).
   1k tokens: Reserved for the model's output generation limit.
   Why it matters: If an agent pulls a massive document from a vector database, it cannot accidentally overwrite the system instructions or push the tool schemas out of the context window.
2. Compaction and Eviction (Handling Overflow)
   What happens when an autonomous loop hits turn 50, and the conversation history exceeds the 1k token budget allocated to it?
   FIFO Eviction (The naive way): Drop the oldest messages. Danger: The agent forgets the user's original goal.
   The Compaction Pattern (The enterprise way): The Context Engine uses a fast, cheap model (like Llama 3 8B) in the background to asynchronously compress the middle of the conversation into a dense "Scratchpad Summary."
   The Mechanic:
   Keep Turn 1 (The original goal).
   Compress Turns 2-40 into: [Prior Steps: Searched DB, found 0 results. Tried alternative table, found 3 candidates.]
   Keep Turns 41-50 verbatim.
3. Progressive Disclosure (The Pointer Pattern)
   When a model executes a tool like read_database(), the State Ledger might receive 100,000 rows of SQL data. You cannot put this in the context window.
   The Pattern: The Context Engine acts as a firewall against payload bloat. Instead of rendering the raw data into the prompt, it renders a Pointer.
   The Mechanic: The engine truncates the payload and injects: [System: Tool executed successfully. 100,000 rows saved to State ID #A92. First 3 rows shown below: ...]
   Why it matters: The model knows the data exists and what its schema looks like. If it needs deeper analysis, it can use a different tool (like run_python_script) to execute math against State ID #A92, all without ever loading the 100,000 rows into its own neural network.
4. Attention Geometry (Mitigating "Lost-in-the-Middle")
   Because models suffer from positional bias, where you place information in the prompt is just as important as what you place in it.
   The Pattern: Never put the most critical constraints or the exact user question in the middle of a massive prompt template.
   The Mechanic:
   Top (Primacy Zone): Place non-negotiable guardrails, security policies, and strict formatting rules here.
   Middle (The Dead Zone): Place reference material, RAG context, and historical tool receipts here. The model can scan this, but shouldn't rely on it for strict rule-following.
   Bottom (Recency Zone): Repeat the active task, the explicit success contract, and the immediate next step right before the generation trigger.
   Tying it Back to the Loop
   Look at the One Run Loop from the architecture diagrams: [Assemble -> Decide -> Validate -> Act -> Record -> Control].
   The Context Engine completely owns the very first step: Assemble (Build the view).
   Before the brain (Model Gateway) is allowed to Decide, the Context Engine looks at the total accumulated State, applies the Budget, Compresses the history, inserts Pointers for large data, and places the final question at the very bottom. Only then does it hand the bounded, safe payload over to the LLM.

---

[Component 4] Model Gateway

1. The Unified Abstraction Layer (The Strategy Pattern)
   Every LLM provider requires a different JSON payload, handles tool calling differently, and uses a different tokenizer. You cannot leak these provider-specific details into your agent's runtime.

- The Component: A unified interface (e.g., Gateway.generate()). The runtime passes a standardized internal representation of the state to this interface.

- The Mechanic: The Gateway uses the Strategy Pattern to dynamically inject the correct client adapter. If routed to Claude, the adapter formats the payload to Anthropic's XML-heavy structure and calculates tokens using Anthropic's tokenizer. If routed to GPT-4, it translates the same state into OpenAI's strict JSON schema.

- Why it matters: It treats the LLM as a swappable, high-latency API. You can upgrade models or switch providers without changing a single line of your agent's core while loop.

2. Semantic Routing (Dynamic Brain Selection)
   As you noted, models have different capabilities (reasoning, non-reasoning, finetuned). Waking up a massive, expensive reasoning model to do a simple extraction task is a waste of compute and money.

- The Component: A lightweight classifier (often a fast embedding model or a tiny LLM like Llama-3 8B) sitting at the entrance of the gateway.

- The Mechanic: When a prompt arrives, the router evaluates its complexity.
  Routine/Parsing: Routed to a cheap, fast, non-reasoning model.
  Domain-Specific: Routed to a model finetuned on proprietary company data.
  Complex/Autonomous: Routed to an expensive reasoning model (e.g., o1 or Claude 3.5 Sonnet) that supports advanced ToolProposals.

3. Resiliency & Fallbacks (The Circuit Breaker)
   At enterprise scale, cloud LLM APIs will fail, rate-limit you, or time out. A fragile agent will crash entirely if its single API call fails.

- The Component: An automated failover and retry engine.

- The Mechanic: The gateway wraps all calls in exponential backoff logic. If the primary model (e.g., OpenAI) returns a 500 error or a rate-limit exception, the gateway intercepts the error. It automatically seamlessly swaps the Strategy Pattern to a compatible alternative (e.g., Anthropic), re-translates the payload, and tries again.

- Why it matters: The agent's loop continues running without ever realizing the primary brain went offline.

4. Semantic Caching (The Reflex)
   If 10,000 users ask a customer support swarm, "How do I reset my password?", calling the LLM 10,000 times will bankrupt your API budget and introduce unnecessary latency.

- The Component: A fast Vector Database integrated directly into the gateway.

- The Mechanic: Before the gateway sends a prompt to an LLM, it embeds the prompt and checks the Vector DB for a semantically similar previous query (e.g., "Where is the password reset button?").

- The Result: If it finds a 98% match, the gateway returns the cached answer instantly. $0 cost, 10ms latency. The signal never even reaches the main brain; it is handled by the brainstem's reflex.

---

[Component 5] Tools & Environment

While "Ports and Adapters" is the precise software engineering pattern used to wire the system together, the tools themselves fall into a strict operational taxonomy. In enterprise architecture, you cannot treat all tools equally because they carry vastly different risk profiles and context loads.
Within Block 05 (Tools and Environment), the core responsibility is to define what the system can actually do. To manage this, hyperscale architectures divide tools into four distinct functional archetypes based on their side effects and safety.

1. Sensors (Read-Only Retrieval)
   Sensors are strictly idempotent tools. An agent can call a sensor one time or one thousand times in a loop, and the outside world will not change.
   The Function: Fetching data from the external environment to build the agent's context.
   Examples: execute_select_sql, read_github_issue, get_weather_api, or searching a vector database.
   Engineering Rules: These tools require strict Context Protection (The Pointer Pattern). Because sensors can return massive datasets, the adapter must intercept heavy payloads, save them to disk, and return a lightweight summary or file pointer to the agent's context window. Under the Model Context Protocol (MCP), these are officially classified as "Resources" (the nouns of the system) rather than active tools.
2. Actuators (State-Mutating Actions)
   Actuators are the "hands" that actually change the world. They turn untrusted tool proposals from the brain into bounded physical effects with faithful receipts.
   The Function: Executing writes, updates, deletions, or communications.
   Examples: send_slack_message, drop_database_table, refund_stripe_charge, create_pull_request.
   Engineering Rules: Actuators must be hidden behind Execution Gates. You never allow an autonomous loop to execute an actuator blindly. When the LLM proposes an actuator, the runtime intercepts the proposal, suspends the state, and triggers a Human-in-the-Loop (HITL) approval dashboard.
3. Compute / Synthetic Tools (Sandboxes)
   These tools do not interact with the outside world at all. Instead, they provide the LLM with a safe environment to perform deterministic work that neural networks are notoriously bad at.
   The Function: Offloading math, logic, and data transformation to deterministic code.
   Examples: python_code_interpreter, regex_parser, calculator.
   Engineering Rules: These must be run in highly isolated, ephemeral Docker containers or WebAssembly sandboxes. If an agent writes a Python script containing an infinite while loop, the sandbox must enforce a hard wall-clock timeout and return the stack trace to the agent as a tool observation.
4. Control Flow / Delegation Tools
   In multi-agent systems, tools are not just used to manipulate data; they are used to manipulate the topology of the system itself.
   The Function: Escaping the current loop or transferring the conversational state to another entity.
   Examples: transfer_to_billing_agent, escalate_to_human, mark_task_complete.
   Engineering Rules: These tools dictate the routing logic. When an agent calls mark_task_complete, the runtime uses that tool receipt as the explicit signal to break the while loop, verify the final artifact, and hand off to the next station in the workflow.
   By categorizing your Tool Registry into these four buckets, you apply granular security: you let the agent spam Sensor tools autonomously, you heavily sandbox Compute tools, and you strictly gate Actuator tools.

---

[Component 6] Knowledge and Memory

To understand Knowledge and Memory (Block 06), look at the note in your reference architecture diagram:
"Retrieval finds candidates. Context selection decides what enters this call."
This single sentence defines how Knowledge & Memory, State & Events, and the Context Engine divide responsibilities.
The Contrast: State vs. Knowledge vs. Context

Layer
The Core Question
Where it Lives
Analogy
State & Events (Block 02)
What is true right now, and what just happened in this run?
Active Run DB / Append-Only Event Log
The Scratchpad: The list of steps you took 30 seconds ago, pending tool approvals, and active run state.
Knowledge & Memory (Block 06)
What does the system know beyond model weights and beyond this single run?
Vector DBs, Lexical Indices, Long-Term Profile Stores
The Library & Rolodex: Thousands of enterprise manuals (RAG) plus facts remembered about the user from 3 months ago.
Context Engine (Block 03)
What specific tokens should enter the model's attention window right this second?
Prompt Assembly / Token Budget Funnel
The Desk Surface: Limited space; holds 1 page from the scratchpad and 2 pages pulled from the library.

State only cares about this specific execution (run state, tool receipts, execution cursor).
Knowledge & Memory exists before the run starts and persists after the run finishes.
Context Engine queries Knowledge, inspects State, and merges them into a single bounded prompt under your token budget.
The Two Halves of Knowledge & Memory
Knowledge and Memory splits into two distinct storage engines: Enterprise Knowledge (RAG) and Agent/User Long-Term Memory (Profiles).

1. Enterprise Knowledge (Retrieval-Augmented Generation / RAG)
   This is external factual data that the LLM was never trained on (internal wikis, code repositories, PDF manuals, customer documentation).
   Offline Indexing (Module 09): Documents cannot be embedded naively. You canonicalize messy formats into structured Markdown, chunk them based on semantic boundaries, generate embeddings, and build two parallel search indices: Dense Vector Search (for conceptual similarity) and Sparse Lexical Search / BM25 (for exact keywords, part numbers, and UUIDs).
   Online Retrieval (Module 10): When the agent needs evidence, it fires a query against the index. Hyperscale RAG uses a Hybrid Search Pipeline:
   Retrieve: Fetch top-100 candidates from both Vector and Lexical search.
   Fuse: Merge results using Reciprocal Rank Fusion (RRF).
   Re-rank: Pass candidates through a Cross-Encoder Re-ranker to score relevance against the exact query under a strict latency deadline.
   Hand off: Send the top candidates to the Context Engine to fit into the token budget.
2. User & Relationship Memory (The Player Profile)
   Covered in Module 13 (The Player Profile): an agent needs to remember user preferences across sessions without dumping months of raw chat history into every prompt.
   Fact Extraction (The Scribe): At the end of a session, a background worker parses the conversation and extracts permanent, reusable facts (e.g., "User prefers TypeScript over Python", "Account Tier: Enterprise").
   Source Provenance: Every memory must store where it was learned, when it was created, and who authorized it.
   Governed Forgetting & TTL: Unlike static RAG documents, user memories decay. If a user says "I am in New York this week," that memory must have an expiration date (TTL) so future sessions don't assume the user lives in New York.
   The 3 Critical Engineering Considerations for Knowledge & Memory
3. Document-Level Access Control (ACL Filtering)
   In an enterprise, an intern and a CFO might use the exact same agent. If the intern asks, "What are our upcoming acquisition targets?", the RAG pipeline must never retrieve the confidential M&A memo.
   The Pattern: You must attach real identity permissions (ACL metadata tags) directly to vector embeddings and document chunks at ingestion time.
   The Enforcement: When the agent retrieves evidence, the query filter must strictly inherit the calling user's verified identity token:

$$\text{SearchQuery} = \text{Embedding}(\text{prompt}) \quad \text{WHERE} \quad \text{user\_groups} \cap \text{doc\_acls} \neq \emptyset$$

Chunks outside the user's authorization are filtered out before the LLM ever sees them. 2. The Freshness & Deletion Problem (Cache Invalidation)
As noted in Module 11 (RAG — Freshness & Deletion), source documents constantly change, get edited, or get deleted.
The Danger (Ghost Evidence): If an engineer deletes an outdated runbook from Google Drive, but the vector database still contains the chunks, the agent will continue serving obsolete answers.
The Pattern (Tombstones & Invalidation Pipelines): You must implement event-driven synchronization (e.g., Kafka / change-data-capture). When a source file is edited or deleted, the system pushes a deletion event that propagates down to delete vectors, BM25 indices, and any cached answers derived from that document. 3. Citations & Attribution Verification
An autonomous agent must never state a factual claim without a paper trail.
The Pattern: Every chunk supplied by the retrieval layer is injected with an immutable chunk ID and source URI.
The Check: The output validator checks that every claim made by the model includes a valid citation pointer linking back to the verified retrieved chunk. If the model hallucinates a fact not grounded in the retrieved chunks, the output is rejected.

[1. User Request]
│
▼
[2. State & Events] ──── Record the prompt into the active ledger[span_61](start_span)[span_61](end_span)[span_62](start_span)[span_62](end_span)
│
├───────────────────────────────────────────────────────┐
▼ ▼
[3. Knowledge & Memory (RAG / Profile)] [4. Runtime State] - Hybrid Search (Vector + Lexical)[span_63](start_span)[span_63](end_span) - Active step[span_64](start_span)[span_64](end_span) - ACL Filter (Identity enforcement)[span_65](start_span)[span_65](end_span) - Tool receipts[span_66](start_span)[span_66](end_span) - Long-term user profile[span_67](start_span)[span_67](end_span) - Recent turns[span_68](start_span)[span_68](end_span)
│ │
└───────────────────────────┬───────────────────────────┘
▼
[5. Context Engine] - Applies Token Budget[span_69](start_span)[span_69](end_span) - Compresses History - Re-ranks & Pointers[span_70](start_span)[span_70](end_span)[span_71](start_span)[span_71](end_span)
│
▼
[6. Model Gateway] ─── Invokes LLM[span_72](start_span)[span_72](end_span)[span_73](start_span)[span_73](end_span)

---

[Component 7] Guardrails & Policy

If Tools (Block 05) dictate what the system can do, Guardrails and Policy (Block 07) dictate what the system is allowed to do.
The most dangerous assumption a developer can make is treating a system prompt as a security boundary. Telling an LLM "You are a helpful assistant. DO NOT delete the database" is not a guardrail; it is merely a suggestion to a probabilistic text generator.
In hyperscale architectures, Guardrails and Policy are deterministic code layers that wrap around the model and the tools. They form the system's immune system and bouncers.
Here are the 4 core design considerations and types of guardrails you must implement, mapped directly to Modules 16 and 17 of your curriculum.

1. Identity & Authorization (The "Who")
   Covered in Module 16 (Identity, Authorization & AI Security), an enterprise agent cannot operate with "God Mode" permissions.
   The Principle: The agent must strictly inherit the calling user's real permissions. If a junior analyst asks the agent for an unreleased earnings draft, the retrieval and tools must deny it under that user's identity.
   The Design Considerations:
   Pass-Through Authentication: When the agent calls the MCP Server or the external API, it must pass the OAuth token or JWT of the human user, not a global service account token.
   Data-Layer ACLs: As discussed in the Knowledge section, Vector DB searches must enforce row-level security. The agent cannot summarize a document the user isn't allowed to read.
2. Effect Boundaries & HITL (The "Approval")
   Covered in Module 17 (Guardrails, Approval & Control Plane), you must enforce policy exactly where an action hits the real world (the effect boundary).
   The Principle: Destructive tool proposals must be blocked, redacted, or held for required human approval.
   The Types of HITL (Human-in-the-Loop):
   Synchronous Confirmation: A simple confirmation dialog in the chat interface ("Are you sure you want me to send this email to the CEO?"). The runtime waits for a 'yes/no' token.
   Asynchronous Approval (The Control Plane): For high-stakes workflows (e.g., executing a $50,000 AWS infrastructure change), the human isn't sitting in the chat. The agent proposes the tool, the runtime suspends the state to the durable ledger, and fires a webhook to a dashboard. Two days later, a manager clicks "Approve," the state rehydrates, and the agent executes the tool.
   The Design Consideration: The model never "waits" for the human. The Runtime waits for the human. The LLM is completely unaware of the pause.
3. Input & Output Firewalls (The "What Must Never Happen")
   You must protect the system from malicious users (Input) and protect the users from hallucinating models (Output).
   Input Guardrails (Prompt Injection Defense):
   Semantic Classifiers: Before the prompt reaches the expensive reasoning model, it passes through a fast, cheap classifier (or a dedicated model like Llama Guard) trained to detect prompt injections, jailbreaks, or out-of-bounds topics. If detected, the prompt is rejected deterministically.
   PII Redaction: A middleware layer detects Social Security Numbers or Credit Cards in the user's prompt and replaces them with <REDACTED> before the prompt is sent to OpenAI or Anthropic.
   Output Guardrails (Verification):
   Format Validation: If the workflow requires a JSON output, the guardrail runs a pydantic validation. If it fails, the guardrail bounces the error back to the LLM automatically to self-correct, never showing the broken JSON to the user.
   Toxicity/Competitor Filters: A secondary classifier checks the output for brand-safety violations or mentions of competitors before streaming it to the user.
4. The Policy Control Plane (The "Emergency Brake")
   In a massive multi-agent swarm, you cannot rely entirely on individual agent loops to self-regulate. You need a top-down operational control plane.
   The Principle: Administrators must be able to change the rules of engagement instantly without redeploying code.
   The Design Considerations:
   Global Kill Switches: The ability to disable a specific tool (e.g., execute_sql) globally across all agents instantly if a zero-day vulnerability is found.
   Budget & Rate Limits: Guardrails that monitor the cost/token ledger. If an autonomous agent loop gets stuck in a recursive error spiral, the guardrail detects the cyclic state and terminates the run deterministically, escalating to a human.
   Summary: Where Guardrails Live
   A robust architecture places Guardrails at three distinct choke points:
   At the Gateway (Input/Output Guardrails): Checking prompts for injection and outputs for formatting/toxicity before they cross the network.
   At the Tool Adapter (Effect Boundaries): Forcing IAM identity inheritance and triggering HITL workflows before an actuator mutates state.
   At the Runtime (Control Plane): Tracking budgets, enforcing max-loop limits, and orchestrating approvals.

---

[Component 8] Evaluation & Observability

If the Model Gateway is the brainstem and the Runtime is the nervous system, Evaluation and Observability (Block 08) is the medical imaging and laboratory testing suite.
In traditional software, observability means monitoring latency, error rates, and CPU usage. If an API returns a 200 OK in 50 milliseconds, it is working. In AI infrastructure, a model can return a 200 OK in 50 milliseconds but hallucinate a fabricated legal precedent that gets your company sued.
Therefore, you must permanently separate Observability (recording what happened) from Evaluation (scoring whether it was good).
Based on the curriculum's "Inspectors" and "War Room" modules, here are the 4 core design considerations you must implement.

1. AI Observability & Tracing (The "What Happened")
   Before you can grade an agent's performance, you must be able to see its thoughts. The industry standard for this is adopting the OpenTelemetry (OTel) GenAI Semantic Conventions.
   The Component: A distributed tracing pipeline that captures the causal hierarchy of an agent's actions.
   The Mechanic (Causal Traces): When a system fails, the war room must be able to reconstruct exactly one execution. The trace must link the exact prompt, the retrieved document, the model response, the tool result, and the policy decision behind a bad answer.
   The Engineering Constraint: You must implement strict data masking at the tracing layer to ensure you record the causal trace without leaking PII or corporate secrets into your logging backend.
2. Offline Evaluation & Benchmarking (The "Test Before Release")
   You cannot push a change to a system prompt or swap a model (e.g., upgrading from GPT-4 to Claude 3.5) without mathematically proving it makes the system better.
   The Component: A continuous integration (CI) pipeline for prompts and models.
   The Mechanic: Before release, a new prompt or model is compared against a versioned baseline dataset. It must pass strict regression checks on important task slices.
   The Grading Methods: Verification can include deterministic tests (checking for specific JSON keys), calibrated graders (using a larger model like GPT-4 to grade the output of a smaller model), and human judgment.
3. Production Evaluation & Feedback (The "Live Quality")
   No offline benchmark survives contact with real users. You must have a production feedback loop to notice when live quality slips.
   The Component: A telemetry aggregation layer that ties user actions to system traces.
   The Mechanic: You capture consented, redacted traces combined with explicit user feedback (e.g., thumbs up/down, edited responses).
   Why it matters: These live failures reveal edge cases that were entirely absent from your offline benchmark. You take these failed traces, extract them, and add them back to the Offline Benchmark dataset to prevent the edge case from happening in the next release.
4. Reliability, Rollouts & Incident Ops (The "Damage Control")
   Even with perfect offline evaluation, a new model might behave unpredictably in the real world.
   The Component: Deployment infrastructure supporting traffic splitting.
   The Mechanic (Controlled Releases): You do not deploy a new agent to 100% of users. You use shadow and canary releases to expose regressions early. For example, a shadow release sends live user traffic to the new model in the background, but only returns the old model's answer to the user, allowing you to compare outputs safely.
   The Safety Net: An incident runbook must be prepared that contains the impact radius and verifies the rollback procedures if the system fails.

---
