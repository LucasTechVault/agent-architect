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
});
