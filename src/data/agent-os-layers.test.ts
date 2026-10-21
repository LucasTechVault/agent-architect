import { describe, expect, it } from "vitest";
import {
  agentOsLayers,
  buildOrderPhases,
  CONCEPT_STUDY_STORAGE_KEY,
  conceptGroups,
  countReviewedConcepts,
  createInitialConceptStudyState,
  l5EnforcementHooks,
  loadConceptStudyState,
  loopSimulationSteps,
  loopTerminationConditions,
} from "./agent-os-layers";
import {
  createInitialLayerMastery,
  evaluateRecallAttempt,
  LAYER_MASTERY_STORAGE_KEY,
  loadLayerMastery,
} from "../components/AgentOsBlueprint";
import {
  baselineStateContextImplications,
  compositionAspects,
  controlDirectionOptions,
  l1ComposableRolesSummary,
  l1CorePrinciple,
} from "./l1-orchestration";
import {
  l3ContextAssemblyStages,
  l3ContextSources,
  l3CrossLayerLinks,
  l3IntroStatement,
  l3OfflinePreparationStages,
  l3OnlineRetrievalStages,
  l3PipelineAccessProvenanceNote,
  l3PrefixCachingNote,
  l3SectionIntuitions,
  l3SharedContextPrinciple,
} from "./l3-context-memory";
import {
  l6CrossLayerLinks,
  l6ExampleAdapterComposition,
  l6ExecutionFlowStages,
  l6IntegrationOptions,
  l6IntroStatement,
  l6OutcomeCategories,
  l6SectionIntuitions,
  l6SharedOwnershipPrinciple,
} from "./l6-tools-actions";

describe("7-Layer Agent OS Blueprint Data & Invariant Recall Vault", () => {
  it("defines all 7 layers (L1..L7) with 3-Box Boundary Flows, 3 Invariants, and 10% Contracts", () => {
    expect(agentOsLayers.map((l) => l.id)).toEqual([
      "L1",
      "L2",
      "L3",
      "L4",
      "L5",
      "L6",
      "L7",
    ]);

    for (const layer of agentOsLayers) {
      expect(layer.invariants).toHaveLength(3);
      expect(layer.boundaryFlow.upstream.length).toBeGreaterThan(3);
      expect(layer.boundaryFlow.port.length).toBeGreaterThan(3);
      expect(layer.boundaryFlow.downstream.length).toBeGreaterThan(3);
      expect(layer.contractCode).toContain("interface ");
      expect(layer.runtimeRole.length).toBeGreaterThan(15);
      expect(layer.buildOrderRole.length).toBeGreaterThan(15);
    }
  });

  it("assigns L1 to entry tier, L2..L6 to cyclic loop tier, and L7 to cross-cutting rail tier", () => {
    expect(agentOsLayers.find((l) => l.id === "L1")?.tier).toBe("entry");
    expect(
      agentOsLayers.filter((l) => l.tier === "loop").map((l) => l.id),
    ).toEqual(["L2", "L3", "L4", "L5", "L6"]);
    expect(agentOsLayers.find((l) => l.id === "L7")?.tier).toBe("rail");
  });

  it("defines all 3 L5 enforcement hooks across L3->L4, L4->L6, and L6->L2/L3", () => {
    expect(l5EnforcementHooks).toHaveLength(3);
    expect(l5EnforcementHooks.map((h) => h.boundary)).toEqual([
      "L3 → L4",
      "L4 → L6",
      "L6 → L2/L3",
    ]);
  });

  it("defines all 3 explicit loop termination conditions", () => {
    expect(loopTerminationConditions).toHaveLength(3);
    expect(loopTerminationConditions.map((c) => c.badge)).toEqual([
      "✅ Terminal Answer Emitted",
      "🛑 Run Budget Exhausted",
      "⏸️ Async HITL Interrupt",
    ]);
  });

  it("defines the 4-Step Project Build Order starting with L7 + L6 (Test Bench & Hands First)", () => {
    expect(buildOrderPhases).toHaveLength(4);
    expect(buildOrderPhases[0].layers).toEqual(["L7", "L6"]);
    expect(buildOrderPhases[1].layers).toEqual(["L4", "L3", "L2"]);
    expect(buildOrderPhases[2].layers).toEqual(["L2", "L5"]);
    expect(buildOrderPhases[3].layers).toEqual(["L1"]);
  });

  it("includes an Observation Return Arc step and Terminal Exit step in loopSimulationSteps", () => {
    expect(loopSimulationSteps.some((s) => s.isReturnArc)).toBe(true);
    expect(loopSimulationSteps.some((s) => s.isTermination)).toBe(true);
    expect(loopSimulationSteps.every((s) => s.otelSpan.startsWith("otel.span["))).toBe(
      true,
    );
  });

  it("evaluates cold recall attempts against layer domain anchor keywords", () => {
    const l2 = agentOsLayers.find((l) => l.id === "L2")!;
    const matched = evaluateRecallAttempt(
      l2,
      "L1 Envelope -> DurableRuntimeKernelPort -> L3 MMU",
      "Immutable state reduce checkpoint and write-ahead idempotency_key before L6 mutation",
    );
    expect(matched).toContain("reduce");
    expect(matched).toContain("idempotency_key");
    expect(matched).toContain("checkpoint");
  });

  it("prevents passive mastery lock-in when recall check was not completed", () => {
    const initial = createInitialLayerMastery();
    expect(Object.values(initial).every((r) => !r.lockedIn && !r.checked)).toBe(
      true,
    );

    const mockStorage = new Map<string, string>();
    const originalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => mockStorage.get(k) ?? null,
        setItem: (k: string, v: string) => mockStorage.set(k, v),
      },
      configurable: true,
    });

    try {
      // Attempt to tamper with storage by setting lockedIn: true without completing recall inputs
      mockStorage.set(
        LAYER_MASTERY_STORAGE_KEY,
        JSON.stringify({
          L2: {
            boundaryAttempt: "",
            invariantsAttempt: "",
            checked: false,
            matchedKeywords: [],
            lockedIn: true,
          },
        }),
      );
      const loaded = loadLayerMastery();
      expect(loaded.L2.lockedIn).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: originalStorage,
        configurable: true,
      });
    }
  });

  it("defines landing-page titles, descriptions, and groupings for all 7 concepts", () => {
    expect(
      agentOsLayers.map((l) => ({
        id: l.id,
        title: l.landingTitle,
        desc: l.landingDescription,
      })),
    ).toEqual([
      {
        id: "L1",
        title: "Orchestration",
        desc: "Start the run and coordinate its work.",
      },
      {
        id: "L2",
        title: "Runtime & State",
        desc: "Manage state, budgets, checkpoints, and recovery.",
      },
      {
        id: "L3",
        title: "Context & Memory",
        desc: "Prepare the context for the next model call.",
      },
      {
        id: "L4",
        title: "Model Gateway",
        desc: "Translate model requests and responses.",
      },
      {
        id: "L5",
        title: "Guardrails & Policy",
        desc: "Check inputs, actions, and returned outputs.",
      },
      {
        id: "L6",
        title: "Tools & Actions",
        desc: "Execute tool requests and return observations.",
      },
      {
        id: "L7",
        title: "Observability & Evaluation",
        desc: "Trace execution and evaluate behaviour.",
      },
    ]);

    expect(
      conceptGroups.map((g) => ({
        label: g.label,
        range: g.rangeLabel,
        ids: g.layerIds,
      })),
    ).toEqual([
      { label: "Entry control", range: "L1", ids: ["L1"] },
      {
        label: "Agent execution",
        range: "L2–L6",
        ids: ["L2", "L3", "L4", "L5", "L6"],
      },
      { label: "Cross-cutting", range: "L7", ids: ["L7"] },
    ]);
  });

  it("persists manual concept study statuses independently from recall-verified mastery", () => {
    const initial = createInitialConceptStudyState();
    expect(countReviewedConcepts(initial)).toBe(0);

    const mockStorage = new Map<string, string>();
    const originalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => mockStorage.get(k) ?? null,
        setItem: (k: string, v: string) => mockStorage.set(k, v),
      },
      configurable: true,
    });

    try {
      mockStorage.set(
        CONCEPT_STUDY_STORAGE_KEY,
        JSON.stringify({
          L1: "Reviewed",
          L2: "Learning",
          L3: "Reviewed",
          L4: "InvalidStatusIgnored",
        }),
      );
      const loaded = loadConceptStudyState();
      expect(loaded.L1).toBe("Reviewed");
      expect(loaded.L2).toBe("Learning");
      expect(loaded.L3).toBe("Reviewed");
      expect(loaded.L4).toBe("Not started");
      expect(countReviewedConcepts(loaded)).toBe(2);

      // Verify marking concepts "Reviewed" does NOT unlock recall-verified mastery
      const mastery = loadLayerMastery();
      expect(mastery.L1.lockedIn).toBe(false);
      expect(mastery.L3.lockedIn).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: originalStorage,
        configurable: true,
      });
    }
  });

  it("models L1 orchestration as composable design choices and links state/context mechanics to L2 and L3", () => {
    expect(l1CorePrinciple).toBe(
      "Execution and coordination choices shape state and context requirements.",
    );

    expect(l1ComposableRolesSummary).toHaveLength(4);
    expect(l1ComposableRolesSummary.map((r) => r.term)).toEqual([
      "ReAct-style loops",
      "Graphs and state machines",
      "Event-driven execution",
      "Multi-agent coordination",
    ]);

    expect(
      controlDirectionOptions.map((c) => ({
        id: c.id,
        title: c.title,
        summary: c.summary,
      })),
    ).toEqual([
      {
        id: "code-directed",
        title: "Code-directed workflow",
        summary: "Authored control logic selects the next step.",
      },
      {
        id: "model-directed",
        title: "Model-directed agent",
        summary:
          "The model proposes the next action within runtime constraints.",
      },
      {
        id: "mixed-control",
        title: "Mixed control",
        summary:
          "Defined stages contain model-directed work where adaptation is needed.",
      },
    ]);

    for (const option of controlDirectionOptions) {
      expect(option.definition.length).toBeGreaterThan(20);
      expect(option.useCase.length).toBeGreaterThan(20);
      expect(option.tradeoff.length).toBeGreaterThan(20);
      expect(option.l2Implication.length).toBeGreaterThan(20);
      expect(option.l3Implication.length).toBeGreaterThan(20);
    }

    expect(compositionAspects.map((a) => a.title)).toEqual([
      "Execution structure",
      "Agent coordination",
      "Invocation and delivery",
    ]);

    expect(baselineStateContextImplications).toHaveLength(4);
    expect(
      baselineStateContextImplications.some((i) =>
        i.detail.includes("event sourcing"),
      ),
    ).toBe(true);
  });

  it("models L3 Context & Memory with 4 context sources, 6 offline stages, 7 online stages, and 5 assembly steps", () => {
    expect(l3IntroStatement).toBe(
      "Working context, retrieved knowledge, skills, and long-term memory provide different inputs. L3 selects and assembles them within the model’s context budget.",
    );
    expect(l3SharedContextPrinciple).toContain("untrusted data inputs");
    expect(l3PipelineAccessProvenanceNote).toContain("Access scope and provenance");
    expect(l3PrefixCachingNote).toContain(
      "Stable prefixes can improve cache reuse when supported by the serving implementation.",
    );

    expect(
      l3ContextSources.map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
      })),
    ).toEqual([
      {
        id: "working-context",
        title: "Working context & turn history",
        subtitle:
          "Carry forward the goal, relevant observations, and current task context.",
      },
      {
        id: "retrieved-knowledge",
        title: "Retrieved knowledge · RAG",
        subtitle: "Bring authorised external evidence into the current task.",
      },
      {
        id: "skills-procedures",
        title: "Skills & procedures",
        subtitle:
          "Load reusable instructions and supporting resources when relevant.",
      },
      {
        id: "cross-session-memory",
        title: "Cross-session memory",
        subtitle: "Reuse relevant facts and past experiences across runs.",
      },
    ]);

    expect(l3ContextSources.map((s) => s.number)).toEqual([1, 2, 3, 4]);
    expect(l3SectionIntuitions.A.intuitionBody).toContain("stateless");
    expect(l3SectionIntuitions.B.intuitionBody).toContain("permission boundaries");
    expect(l3SectionIntuitions.C.intuitionBody).toContain("token budget");

    expect(l3OfflinePreparationStages).toHaveLength(6);
    expect(l3OfflinePreparationStages.map((s) => s.title)).toEqual([
      "Landing",
      "Register & deduplicate",
      "Parse",
      "Chunk",
      "Enrich",
      "Embed, index & publish",
    ]);

    expect(l3OnlineRetrievalStages).toHaveLength(7);
    expect(l3OnlineRetrievalStages.map((s) => s.title)).toEqual([
      "Form the retrieval request",
      "Retrieve authorised candidates",
      "Fuse & deduplicate",
      "Rerank",
      "Assemble evidence",
      "Generate through L4",
      "Validate references & render citations",
    ]);
    expect(l3OnlineRetrievalStages[5].handoffLayerId).toBe("L4");

    expect(l3ContextAssemblyStages).toHaveLength(5);
    expect(l3ContextAssemblyStages.map((s) => s.title)).toEqual([
      "Select relevant inputs",
      "Check scope and organise evidence",
      "Budget, deduplicate, and compact",
      "Render the canonical context",
      "Hand off to L4",
    ]);

    expect(l3CrossLayerLinks.map((l) => l.layerId)).toEqual([
      "L2",
      "L4",
      "L5",
      "L6",
      "L7",
    ]);
  });

  it("models L6 Tools & Actions with 3 integration cards, 5 outcome categories, and 6 execution flow stages", () => {
    expect(l6IntroStatement).toBe(
      "Domain interfaces, integration protocols, and execution environments solve different problems. They can be combined behind the same controlled tool boundary.",
    );
    expect(l6SharedOwnershipPrinciple).toContain("model-provider failures belong to L4");

    expect(
      l6IntegrationOptions.map((o) => ({
        id: o.id,
        title: o.title,
        subtitle: o.subtitle,
      })),
    ).toEqual([
      {
        id: "enterprise-facades",
        title: "Enterprise APIs & service façades",
        subtitle: "Expose clear domain operations through stable contracts.",
      },
      {
        id: "mcp-adapters",
        title: "MCP client adapters",
        subtitle:
          "Connect standard capabilities to the application’s interfaces.",
      },
      {
        id: "isolated-environments",
        title: "Isolated code & browser environments",
        subtitle: "Execute code or browser work within explicit boundaries.",
      },
    ]);

    expect(l6IntegrationOptions.map((o) => o.number)).toEqual([1, 2, 3]);
    expect(
      l6IntegrationOptions[1].mcpPrimitives?.map((p) => p.number),
    ).toEqual(["2.1", "2.2", "2.3"]);
    expect(l6SectionIntuitions.A.intuitionBody).toContain("blast-radius");
    expect(l6SectionIntuitions.B.intuitionBody).toContain("duplicate side effects");
    expect(l6SectionIntuitions.C.intuitionBody).toContain("proposal");

    expect(
      l6IntegrationOptions[1].mcpPrimitives?.map((p) => p.primitive),
    ).toEqual(["Tools", "Resources", "Prompts"]);
    expect(l6IntegrationOptions[2].sandboxLifecycle).toEqual([
      "Provision",
      "Execute",
      "Collect results",
      "Clean up",
    ]);

    expect(l6OutcomeCategories).toHaveLength(5);
    expect(l6OutcomeCategories.map((o) => o.title)).toEqual([
      "Safe transient failure",
      "Correctable input or generated code",
      "Unknown execution outcome",
      "Denied, paused, or cancelled",
      "Contract or configuration failure",
    ]);

    expect(l6ExecutionFlowStages).toHaveLength(6);
    expect(l6ExecutionFlowStages.map((s) => s.title)).toEqual([
      "Proposed call",
      "Validate & authorise",
      "Prepare the operation",
      "Execute through the adapter",
      "Check & record the result",
      "Return the observation",
    ]);
    expect(l6ExecutionFlowStages[3].hasExampleComposition).toBe(true);
    expect(l6ExampleAdapterComposition.chain).toEqual([
      "Internal port",
      "MCP client adapter",
      "MCP server",
      "Enterprise API or sandbox worker",
    ]);

    expect(l6CrossLayerLinks.map((l) => l.layerId)).toEqual([
      "L2",
      "L3",
      "L4",
      "L5",
      "L7",
    ]);
  });
});
