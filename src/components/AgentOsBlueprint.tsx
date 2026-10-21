import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  SkipForward,
  Wrench,
} from "lucide-react";
import {
  agentOsLayers,
  buildOrderPhases,
  l5EnforcementHooks,
  loopSimulationSteps,
  loopTerminationConditions,
  type AgentOsLayer,
  type LayerId,
} from "../data/agent-os-layers";

export type LensMode = "runtime" | "build";

export interface LayerRecallRecord {
  boundaryAttempt: string;
  invariantsAttempt: string;
  checked: boolean;
  matchedKeywords: string[];
  lockedIn: boolean;
  lockedAt?: string;
}

export type LayerMasteryState = Record<LayerId, LayerRecallRecord>;

export const LAYER_MASTERY_STORAGE_KEY = "agent-architect.layer-mastery.v1";

const defaultLayerRecord = (): LayerRecallRecord => ({
  boundaryAttempt: "",
  invariantsAttempt: "",
  checked: false,
  matchedKeywords: [],
  lockedIn: false,
});

export function createInitialLayerMastery(): LayerMasteryState {
  return {
    L1: defaultLayerRecord(),
    L2: defaultLayerRecord(),
    L3: defaultLayerRecord(),
    L4: defaultLayerRecord(),
    L5: defaultLayerRecord(),
    L6: defaultLayerRecord(),
    L7: defaultLayerRecord(),
  };
}

export function loadLayerMastery(): LayerMasteryState {
  try {
    const raw = localStorage.getItem(LAYER_MASTERY_STORAGE_KEY);
    if (!raw) return createInitialLayerMastery();
    const parsed = JSON.parse(raw) as Partial<LayerMasteryState>;
    const base = createInitialLayerMastery();
    for (const layer of agentOsLayers) {
      const item = parsed?.[layer.id];
      if (item && typeof item === "object") {
        const boundaryAttempt =
          typeof item.boundaryAttempt === "string" ? item.boundaryAttempt : "";
        const invariantsAttempt =
          typeof item.invariantsAttempt === "string"
            ? item.invariantsAttempt
            : "";
        const checked =
          Boolean(item.checked) &&
          boundaryAttempt.trim().length > 0 &&
          invariantsAttempt.trim().length > 0;
        base[layer.id] = {
          boundaryAttempt,
          invariantsAttempt,
          checked,
          matchedKeywords: Array.isArray(item.matchedKeywords)
            ? item.matchedKeywords.filter((k): k is string => typeof k === "string")
            : [],
          // Enforce rule: can only be locked in if recall check was completed
          lockedIn: Boolean(item.lockedIn) && checked,
          lockedAt: typeof item.lockedAt === "string" ? item.lockedAt : undefined,
        };
      }
    }
    return base;
  } catch {
    return createInitialLayerMastery();
  }
}

export function evaluateRecallAttempt(
  layer: AgentOsLayer,
  boundaryAttempt: string,
  invariantsAttempt: string,
): string[] {
  const combined = `${boundaryAttempt} ${invariantsAttempt}`.toLowerCase();
  return layer.recallKeywords.filter((kw) =>
    combined.includes(kw.toLowerCase()),
  );
}

export default function AgentOsBlueprint() {
  const [lens, setLens] = useState<LensMode>("runtime");
  const [selectedLayerId, setSelectedLayerId] = useState<LayerId>("L2");
  const [mastery, setMastery] = useState<LayerMasteryState>(loadLayerMastery);

  // Loop simulator state
  const [simActive, setSimActive] = useState(false);
  const [simStepIdx, setSimStepIdx] = useState<number>(0);
  const [simAutoPlay, setSimAutoPlay] = useState(false);

  // 60s Cold Recall Gate state
  const [recallModeActive, setRecallModeActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [boundaryInput, setBoundaryInput] = useState("");
  const [invariantsInput, setInvariantsInput] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  const selectedLayer = useMemo(
    () => agentOsLayers.find((l) => l.id === selectedLayerId) ?? agentOsLayers[1],
    [selectedLayerId],
  );

  const lockedInCount = useMemo(
    () => agentOsLayers.filter((l) => mastery[l.id]?.lockedIn).length,
    [mastery],
  );

  const activeSimStep = simActive ? loopSimulationSteps[simStepIdx] : undefined;

  // Save mastery state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LAYER_MASTERY_STORAGE_KEY, JSON.stringify(mastery));
    } catch {
      // Ignore storage quota errors in restricted environments
    }
  }, [mastery]);

  // Sync recall inputs when switching selected layer
  useEffect(() => {
    const rec = mastery[selectedLayerId];
    setBoundaryInput(rec?.boundaryAttempt ?? "");
    setInvariantsInput(rec?.invariantsAttempt ?? "");
    setRecallModeActive(false);
    setSecondsRemaining(60);
    setValidationMessage("");
  }, [selectedLayerId]);

  // 60-second countdown timer during active recall test
  useEffect(() => {
    if (!recallModeActive) return;
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [recallModeActive]);

  // Simulator auto-play interval
  useEffect(() => {
    if (!simActive || !simAutoPlay) return;
    const timer = window.setInterval(() => {
      setSimStepIdx((prev) => {
        const next = (prev + 1) % loopSimulationSteps.length;
        setSelectedLayerId(loopSimulationSteps[next].layerId);
        return next;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [simActive, simAutoPlay]);

  function handleStartSim() {
    if (!simActive) {
      setSimActive(true);
      setSimStepIdx(0);
      setSelectedLayerId(loopSimulationSteps[0].layerId);
    } else {
      const next = (simStepIdx + 1) % loopSimulationSteps.length;
      setSimStepIdx(next);
      setSelectedLayerId(loopSimulationSteps[next].layerId);
    }
  }

  function handleResetSim() {
    setSimActive(false);
    setSimAutoPlay(false);
    setSimStepIdx(0);
  }

  function startRecallTest() {
    setRecallModeActive(true);
    setSecondsRemaining(60);
    setValidationMessage("");
  }

  function handleCheckAndReveal() {
    if (!boundaryInput.trim() || !invariantsInput.trim()) {
      setValidationMessage(
        "Complete both fields (1. 3-Box Boundary Flow and 2. Key Port Invariants) before revealing.",
      );
      return;
    }
    const matched = evaluateRecallAttempt(
      selectedLayer,
      boundaryInput,
      invariantsInput,
    );
    setRecallModeActive(false);
    setValidationMessage("");
    setMastery((prev) => ({
      ...prev,
      [selectedLayerId]: {
        ...prev[selectedLayerId],
        boundaryAttempt: boundaryInput,
        invariantsAttempt: invariantsInput,
        checked: true,
        matchedKeywords: matched,
      },
    }));
  }

  function handleLockInLayer() {
    const current = mastery[selectedLayerId];
    if (
      !current?.checked ||
      !current.boundaryAttempt.trim() ||
      !current.invariantsAttempt.trim()
    ) {
      setValidationMessage(
        "Complete the 60s Cold Recall Test and click 'Check & Reveal' before locking in mastery.",
      );
      return;
    }
    setMastery((prev) => ({
      ...prev,
      [selectedLayerId]: {
        ...prev[selectedLayerId],
        lockedIn: true,
        lockedAt: new Date().toISOString(),
      },
    }));
  }

  const currentLayerRecord = mastery[selectedLayerId];
  const loopLayers = agentOsLayers.filter((l) => l.tier === "loop");
  const entryLayer = agentOsLayers.find((l) => l.id === "L1")!;
  const railLayer = agentOsLayers.find((l) => l.id === "L7")!;

  return (
    <div className="ft-blueprint-shell">
      {/* 1. TOP MASTHEAD & DUAL-LENS MODE SWITCHER */}
      <header className="ft-masthead" role="banner">
        <div className="ft-masthead-left">
          <div className="ft-brand-row">
            <span className="ft-brand-mark" aria-hidden="true">
              🏛️
            </span>
            <div>
              <h1 className="ft-brand-title">Agent Architect</h1>
              <p className="ft-brand-subtitle">
                The 7-Layer Agent OS Blueprint &amp; Invariant Vault
              </p>
            </div>
          </div>
          <nav className="ft-secondary-links" aria-label="Vault sections">
            <a href="#blueprint" className="ft-pill-link active">
              7-Layer OS Blueprint
            </a>
            <a href="#archetypes" className="ft-pill-link">
              6 Role Archetypes
            </a>
            <a href="#roadmap" className="ft-pill-link">
              M0–M5 Build Issues
            </a>
          </nav>
        </div>

        <div
          className="ft-lens-switcher"
          role="tablist"
          aria-label="Dual-Lens Architecture Switcher"
        >
          <button
            type="button"
            role="tab"
            id="lens-tab-runtime"
            aria-selected={lens === "runtime"}
            className={`ft-lens-button ${lens === "runtime" ? "active" : ""}`}
            onClick={() => setLens("runtime")}
          >
            <span className="ft-lens-title">
              🔄 Runtime Execution Loop &amp; Bus (L1 → [L2..L6 Loop] + L7 Rail)
            </span>
            <small className="ft-lens-desc">
              How an agent executes cyclic ticks and emits telemetry at runtime
            </small>
          </button>
          <button
            type="button"
            role="tab"
            id="lens-tab-build"
            aria-selected={lens === "build"}
            className={`ft-lens-button ${lens === "build" ? "active" : ""}`}
            onClick={() => setLens("build")}
          >
            <span className="ft-lens-title">
              🛠️ Project Build Order (Step 1 → Step 4)
            </span>
            <small className="ft-lens-desc">
              How you implement an agent from scratch (Test Bench &amp; Hands First)
            </small>
          </button>
        </div>

        <div className="ft-mastery-box" aria-live="polite">
          <div className="ft-mastery-header">
            <Lock size={14} aria-hidden="true" />
            <strong data-testid="mastery-counter">
              Mastery: {lockedInCount} / 7 Layers Locked In
            </strong>
          </div>
          <div className="ft-mastery-pips" aria-label="Layer mastery status">
            {agentOsLayers.map((l) => {
              const isLocked = mastery[l.id]?.lockedIn;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLayerId(l.id)}
                  className={`ft-mastery-pip ${isLocked ? "locked" : ""} ${selectedLayerId === l.id ? "selected" : ""}`}
                  title={`${l.title}: ${isLocked ? "Locked In ✓" : "Complete 60s Cold Recall to Lock In"}`}
                >
                  {l.id}
                  {isLocked ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <small className="ft-mastery-rule">
            Requires 60s Cold Recall check per layer
          </small>
        </div>
      </header>

      {/* MAIN WORKSPACE: LEFT 64% STAGE + RIGHT 36% DEEP-DIVE */}
      <div className="ft-main-grid">
        {/* 2. MAIN INTERACTIVE BLUEPRINT STAGE (LEFT 64%) */}
        <section
          className="ft-blueprint-stage"
          aria-label="Interactive 7-Layer Agent OS Stage"
        >
          {lens === "runtime" ? (
            <div className="ft-runtime-view">
              {/* Interactive Loop Simulator Bar */}
              <div className="ft-sim-bar">
                <div className="ft-sim-controls">
                  <button
                    type="button"
                    className="ft-btn ft-btn-primary"
                    onClick={handleStartSim}
                  >
                    <Play size={14} aria-hidden="true" />
                    <span>
                      {simActive
                        ? "▶ Next Agent Tick Step"
                        : "▶ Step Through Agent Loop"}
                    </span>
                  </button>
                  {simActive && (
                    <>
                      <button
                        type="button"
                        className={`ft-btn ${simAutoPlay ? "active" : ""}`}
                        onClick={() => setSimAutoPlay((v) => !v)}
                      >
                        <SkipForward size={13} aria-hidden="true" />
                        <span>{simAutoPlay ? "Pause Auto" : "Auto-Play"}</span>
                      </button>
                      <button
                        type="button"
                        className="ft-btn"
                        onClick={handleResetSim}
                      >
                        <RotateCcw size={13} aria-hidden="true" />
                        <span>Reset</span>
                      </button>
                    </>
                  )}
                </div>

                {activeSimStep ? (
                  <div className="ft-sim-status" role="status">
                    <div className="ft-sim-step-head">
                      <span className="ft-badge-turn">
                        TURN {activeSimStep.turn} · STEP{" "}
                        {activeSimStep.stepIndex + 1}/
                        {loopSimulationSteps.length}
                      </span>
                      <strong>{activeSimStep.label}</strong>
                    </div>
                    <p>{activeSimStep.detail}</p>
                    <code className="ft-sim-otel">
                      📡 {activeSimStep.otelSpan}
                    </code>
                  </div>
                ) : (
                  <div className="ft-sim-hint">
                    <span>
                      Click <strong>▶ Step Through Agent Loop</strong> to trace a
                      2-turn execution tick across <code>L1 → [L2..L6]</code>{" "}
                      with live OTel span drops into the <code>L7</code> rail.
                    </span>
                  </div>
                )}
              </div>

              {/* TIER 1: ENTRY CONTROL PLANE (L1) */}
              <div className="ft-tier ft-tier-entry">
                <div className="ft-tier-header">
                  <span className="ft-tier-index">
                    TIER 1 · ENTRY CONTROL PLANE
                  </span>
                  <span className="ft-tier-caption">
                    Trigger Admission &amp; Pattern Selection (Single-Agent Loop
                    Default vs. Planner–Executor / Router)
                  </span>
                </div>

                <div className="ft-entry-row">
                  <button
                    type="button"
                    data-testid="layer-card-L1"
                    className={`ft-layer-card ft-card-entry ${selectedLayerId === "L1" ? "is-selected" : ""} ${activeSimStep?.layerId === "L1" ? "is-sim-active" : ""}`}
                    onClick={() => setSelectedLayerId("L1")}
                  >
                    <div className="ft-card-top">
                      <span className="ft-layer-id">L1</span>
                      <span className="ft-subsystem-tag">
                        {entryLayer.subsystemTag}
                      </span>
                      <span className="ft-build-tag">Step 4 (Scale Last)</span>
                      {mastery.L1.lockedIn && (
                        <span className="ft-locked-badge">Locked In ✓</span>
                      )}
                    </div>
                    <h3>{entryLayer.title}</h3>
                    <p>{entryLayer.runtimeSummary}</p>
                    <div className="ft-card-chips">
                      <code>Default: Single-Agent Loop</code>
                      <code>Isolate Sub-Agent Contexts</code>
                      <code>≤3 Unverified Serial Handoffs</code>
                    </div>
                  </button>

                  <div className="ft-entry-arrow" aria-hidden="true">
                    <ArrowDown size={18} />
                    <code>Seeds RunEnvelope(run_id, budget) into L2 ↓</code>
                  </div>
                </div>
              </div>

              {/* TIER 2: THE CYCLIC AGENT EXECUTION LOOP (L2 -> L3 -> L4 -> L5 -> L6 ──► L2/L3) */}
              <div className="ft-tier ft-tier-loop">
                <div className="ft-tier-header">
                  <span className="ft-tier-index">
                    TIER 2 · THE CYCLIC AGENT EXECUTION LOOP (L2 → L3 → L4 → L5 →
                    L6 ──Observation Return Arc──► L2/L3)
                  </span>
                  <span className="ft-tier-caption">
                    Closed-Loop Multi-Turn Tick Execution · Multi-Hook L5 Policy
                    · Separated L4 vs. L6 Error Taxonomies
                  </span>
                </div>

                {/* Loop Cards Grid (L2, L3, L4, L5, L6) + Loop Termination Badge */}
                <div className="ft-loop-grid">
                  {loopLayers.map((layer, idx) => {
                    const isSelected = selectedLayerId === layer.id;
                    const isSimCurrent = activeSimStep?.layerId === layer.id;
                    const isLocked = mastery[layer.id]?.lockedIn;
                    return (
                      <div key={layer.id} className="ft-loop-cell">
                        <button
                          type="button"
                          data-testid={`layer-card-${layer.id}`}
                          className={`ft-layer-card ft-card-loop ${isSelected ? "is-selected" : ""} ${isSimCurrent ? "is-sim-active" : ""}`}
                          onClick={() => setSelectedLayerId(layer.id)}
                        >
                          <div className="ft-card-top">
                            <span className="ft-layer-id">{layer.id}</span>
                            <span className="ft-subsystem-tag">
                              {layer.subsystemTag}
                            </span>
                            <span className="ft-build-tag">
                              Build Step {layer.buildStepNumber}
                            </span>
                            {isLocked && (
                              <span className="ft-locked-badge">
                                Locked In ✓
                              </span>
                            )}
                          </div>
                          <h3>{layer.title}</h3>
                          <p>{layer.runtimeSummary}</p>

                          {/* Special visual breakdown for L4 vs L6 error taxonomy and L5 3-Hooks */}
                          {layer.id === "L4" && (
                            <div className="ft-taxonomy-box ft-taxonomy-l4">
                              <strong>L4 Compute Error Taxonomy:</strong>
                              <span>
                                Handles LLM Provider Rate Limits (
                                <code>HTTP 429</code>), Overloaded (
                                <code>503</code>) &amp; Model Fallback Routing
                                transparently; enforces Constrained Decoding.
                              </span>
                            </div>
                          )}

                          {layer.id === "L5" && (
                            <div
                              className="ft-hooks-list"
                              aria-label="L5 3 Enforcement Hooks"
                            >
                              {l5EnforcementHooks.map((hook) => (
                                <div key={hook.id} className="ft-hook-item">
                                  <code>
                                    {hook.name} ({hook.boundary})
                                  </code>
                                  <span>{hook.detail}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {layer.id === "L6" && (
                            <div className="ft-taxonomy-box ft-taxonomy-l6">
                              <strong>L6 I/O Error Split:</strong>
                              <span>
                                1. <em>Retryable Downstream I/O Errors</em> (
                                <code>503</code> / socket timeout) retried by
                                adapter with <code>idempotency_key</code>.<br />
                                2. <em>Model-Correctable Argument Failures</em>{" "}
                                returned as observations to <code>L3</code> for
                                self-correction.
                              </span>
                            </div>
                          )}
                        </button>
                        {idx < loopLayers.length - 1 && (
                          <div className="ft-forward-connector" aria-hidden="true">
                            <ArrowRight size={15} />
                            <span>
                              {layer.id === "L3"
                                ? "Hook 1 (Spotlighting)"
                                : layer.id === "L4"
                                  ? "Tool Proposal"
                                  : layer.id === "L5"
                                    ? "Hook 2 (IAM/HITL)"
                                    : "Next"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Explicit Loop Termination Badge (Next to L4/L5) */}
                  <aside
                    className={`ft-termination-card ${activeSimStep?.isTermination ? "is-sim-active" : ""}`}
                    aria-label="Loop Termination Conditions"
                  >
                    <div className="ft-termination-header">
                      <ShieldAlert size={15} aria-hidden="true" />
                      <strong>
                        EXPLICIT LOOP TERMINATION GATE (NEXT TO L4 / L5)
                      </strong>
                    </div>
                    <p className="ft-termination-sub">
                      A cyclic agent tick ONLY exits when one of these 3
                      deterministic conditions fires:
                    </p>
                    <ul className="ft-termination-list">
                      {loopTerminationConditions.map((cond) => (
                        <li key={cond.id}>
                          <code>{cond.badge}</code>
                          <span>{cond.title}</span>
                          <small>{cond.detail}</small>
                        </li>
                      ))}
                    </ul>
                  </aside>
                </div>

                {/* Prominent SVG / Visual Observation Return Arc: L6 ──(Tool Observation & State Delta)──► L2/L3 */}
                <div
                  className={`ft-return-arc-banner ${activeSimStep?.isReturnArc ? "is-sim-active" : ""}`}
                  data-testid="observation-return-arc"
                >
                  <svg
                    className="ft-return-arc-svg"
                    viewBox="0 0 800 44"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <marker
                        id="return-arrowhead"
                        markerWidth="8"
                        markerHeight="8"
                        refX="3"
                        refY="4"
                        orient="auto"
                      >
                        <path d="M8,0 L0,4 L8,8 Z" fill="#9E2F50" />
                      </marker>
                    </defs>
                    <path
                      d="M 760 8 C 760 36, 40 36, 40 10"
                      fill="none"
                      stroke="#9E2F50"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      markerEnd="url(#return-arrowhead)"
                    />
                  </svg>
                  <div className="ft-return-arc-label">
                    <code>
                      ↺ OBSERVATION RETURN ARC: L6 (Hexagonal Tools) ──[ Hook 3
                      Post-Tool Taint + Tool Observation &amp; State Delta ]──►
                      L2 (State Reducer) &amp; L3 (PromptRenderer) for Next Turn
                    </code>
                  </div>
                </div>
              </div>

              {/* VERTICAL TELEMETRY TAP LINES DROPPING FROM EVERY LAYER (L1..L6) INTO L7 */}
              <div
                className="ft-telemetry-taps"
                aria-label="Vertical OpenTelemetry taps from L1–L6 into L7"
              >
                {(["L1", "L2", "L3", "L4", "L5", "L6"] as LayerId[]).map(
                  (tapId) => {
                    const isTapHighlighted =
                      selectedLayerId === tapId ||
                      activeSimStep?.layerId === tapId;
                    return (
                      <div
                        key={tapId}
                        className={`ft-tap-column ${isTapHighlighted ? "active" : ""}`}
                      >
                        <span className="ft-tap-label">{tapId} OTel Tap</span>
                        <div className="ft-tap-line" />
                        <ArrowDown size={13} />
                      </div>
                    );
                })}
              </div>

              {/* TIER 3: CROSS-CUTTING FOUNDATION RAIL (L7 · OBSERVABILITY & VERIFICATION BUS) */}
              <div className="ft-tier ft-tier-rail">
                <div
                  role="button"
                  tabIndex={0}
                  data-testid="layer-card-L7"
                  className={`ft-l7-rail-card ${selectedLayerId === "L7" ? "is-selected" : ""} ${simActive ? "is-sim-active" : ""}`}
                  onClick={() => setSelectedLayerId("L7")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedLayerId("L7");
                    }
                  }}
                >
                  <div className="ft-l7-rail-top">
                    <div>
                      <span className="ft-layer-id">L7</span>
                      <span className="ft-subsystem-tag">
                        TIER 3 · CROSS-CUTTING FOUNDATION RAIL
                      </span>
                      <span className="ft-build-tag">
                        Build Step 1 · Test Bench First
                      </span>
                      {mastery.L7.lockedIn && (
                        <span className="ft-locked-badge">Locked In ✓</span>
                      )}
                    </div>
                    <h3>{railLayer.title}</h3>
                  </div>

                  <div className="ft-l7-tempos">
                    <div className="ft-tempo-card">
                      <div className="ft-tempo-head">
                        <Activity size={14} aria-hidden="true" />
                        <strong>1. Live Per-Tick Telemetry (Online)</strong>
                      </div>
                      <p>
                        Every layer (<code>L1–L6</code>) emits OpenTelemetry
                        GenAI spans (<code>run_id</code>, <code>step_id</code>,
                        token/cache counts, latency, retries, policy decisions)
                        in real time.
                      </p>
                    </div>

                    <div className="ft-tempo-card">
                      <div className="ft-tempo-head">
                        <Sparkles size={14} aria-hidden="true" />
                        <strong>
                          2. Parity &amp; Correctness Grading (Offline / CI /
                          Sampled)
                        </strong>
                      </div>
                      <p>
                        Evaluates recorded trajectories and final outcomes
                        against 20–50 Sanitized Golden Fixtures, calibrated
                        binary rubrics (<code>PASS/FAIL</code>), and{" "}
                        <code>pass^k = p^k</code> consistency metrics.
                      </p>
                    </div>
                  </div>

                  <div className="ft-l7-paradox-banner">
                    <strong>Why L7 is a Cross-Cutting Bottom Rail:</strong>{" "}
                    Drawing L7 as a cross-cutting bottom rail resolves the
                    Runtime vs. Build paradox: every layer emits to L7 at
                    runtime, which is why you build L7 as your foundational test
                    bench in Build Step 1.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MODE 2: PROJECT BUILD ORDER (STEP 1 -> STEP 4) */
            <div className="ft-build-order-view" data-testid="build-order-view">
              <div className="ft-build-intro">
                <div>
                  <span className="ft-tier-index">
                    LENS 2 · SEQUENTIAL IMPLEMENTATION ORDER (FROM GROUND TRUTH
                    INWARD)
                  </span>
                  <h2>
                    How You Implement an Agent From Scratch: Test Bench &amp;
                    Hands First
                  </h2>
                  <p>
                    At runtime an agent starts at <code>L1</code>, loops through{" "}
                    <code>L2–L6</code>, and emits spans into <code>L7</code>.
                    When building from scratch, you invert the order: establish
                    your <code>L7</code> Golden Fixtures and <code>L6</code>{" "}
                    Service Facades first, wire a minimal <code>L4+L3+L2</code>{" "}
                    loop second, harden <code>L2+L5</code> durability and
                    guardrails third, and scale <code>L1</code> topologies last.
                  </p>
                </div>
              </div>

              <div className="ft-build-steps-list">
                {buildOrderPhases.map((phase) => (
                  <article
                    key={phase.step}
                    className="ft-build-step-card"
                    data-testid={`build-step-${phase.step}`}
                  >
                    <div className="ft-build-step-header">
                      <span className="ft-step-badge">STEP 0{phase.step}</span>
                      <div>
                        <h3>{phase.title}</h3>
                        <code className="ft-step-subtitle">
                          {phase.subtitle}
                        </code>
                      </div>
                      <div className="ft-step-layer-pills">
                        {phase.layers.map((layerId) => {
                          const layer = agentOsLayers.find(
                            (l) => l.id === layerId,
                          )!;
                          const isLocked = mastery[layerId]?.lockedIn;
                          return (
                            <button
                              key={`${phase.step}-${layerId}`}
                              type="button"
                              className={`ft-layer-pill ${selectedLayerId === layerId ? "active" : ""}`}
                              onClick={() => setSelectedLayerId(layerId)}
                            >
                              <Wrench size={12} aria-hidden="true" />
                              <span>{layer.title}</span>
                              {isLocked && <strong>✓</strong>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="ft-build-step-body">
                      <div className="ft-build-why">
                        <span className="ft-field-label">
                          WHY STEP {phase.step}
                        </span>
                        <p>{phase.whyStep}</p>
                      </div>
                      <div className="ft-build-proof">
                        <span className="ft-field-label">REAL-WORLD PROOF</span>
                        <p>
                          <code>{phase.realWorldProof}</code>
                        </p>
                      </div>
                    </div>

                    <div className="ft-build-deliverables">
                      <span className="ft-field-label">
                        KEY ENGINEERING DELIVERABLES
                      </span>
                      <ul>
                        {phase.deliverables.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 3. RIGHT-HAND LAYER DEEP-DIVE PANEL (RIGHT 36%) */}
        <aside
          className="ft-deep-dive-panel"
          aria-label="Layer Specification, Port Invariants, and 60s Cold Recall Gate"
        >
          {/* Section 1: Layer Header & Dual-Role Summary */}
          <div className="ft-panel-section ft-panel-header">
            <div className="ft-panel-top-row">
              <span className="ft-layer-badge-lg">{selectedLayer.id}</span>
              <span className="ft-subsystem-tag">
                {selectedLayer.subsystemTag}
              </span>
              <span
                className={`ft-mastery-status-badge ${currentLayerRecord.lockedIn ? "verified" : "unverified"}`}
                data-testid="selected-layer-mastery-badge"
              >
                {currentLayerRecord.lockedIn
                  ? "✅ Recall Verified · Locked In ✓"
                  : "📖 Unverified"}
              </span>
            </div>

            <h2>{selectedLayer.title}</h2>

            <div className="ft-dual-role-grid">
              <div>
                <span className="ft-field-label">🔄 RUNTIME ROLE</span>
                <p>{selectedLayer.runtimeRole}</p>
              </div>
              <div>
                <span className="ft-field-label">
                  🛠️ BUILD ORDER ({selectedLayer.buildStepLabel})
                </span>
                <p>{selectedLayer.buildOrderRole}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Port Invariants & "Never-Do" Rules (Highlighted Callout Box ABOVE Contract) */}
          <div
            className={`ft-panel-section ft-invariants-callout ${recallModeActive ? "is-blurred" : ""}`}
            data-testid="port-invariants-box"
          >
            <div className="ft-section-title-row">
              <span className="ft-field-label">
                ⚡ PORT INVARIANTS &amp; &ldquo;NEVER-DO&rdquo; RULES (
                {selectedLayer.id})
              </span>
              {recallModeActive && (
                <span className="ft-blur-pill">
                  <EyeOff size={12} /> Blurred for 60s Recall
                </span>
              )}
            </div>
            <ul className="ft-invariants-list">
              {selectedLayer.invariants.map((inv, idx) => (
                <li key={inv}>
                  <code>0{idx + 1}</code>
                  <span>{inv}</span>
                </li>
              ))}
            </ul>
            {selectedLayer.errorTaxonomyNote && (
              <div className="ft-error-taxonomy-callout">
                <strong>Error Taxonomy Boundary:</strong>{" "}
                {selectedLayer.errorTaxonomyNote}
              </div>
            )}
          </div>

          {/* Section 3: The 10% Abstract Class Contract + 3-Box Boundary Flow */}
          <div
            className={`ft-panel-section ft-contract-section ${recallModeActive ? "is-blurred" : ""}`}
            data-testid="contract-section-box"
          >
            <div className="ft-section-title-row">
              <span className="ft-field-label">
                📐 3-BOX HEXAGONAL BOUNDARY &amp; 10% CONTRACT
              </span>
              <code>TypeScript / Protocol</code>
            </div>

            <div
              className="ft-boundary-boxes"
              aria-label="3-Box Boundary Flow"
            >
              <div className="ft-boundary-node">
                <small>UPSTREAM</small>
                <code>{selectedLayer.boundaryFlow.upstream}</code>
              </div>
              <ArrowRight size={14} aria-hidden="true" />
              <div className="ft-boundary-node ft-port-node">
                <small>PORT INTERFACE</small>
                <code>{selectedLayer.boundaryFlow.port}</code>
              </div>
              <ArrowRight size={14} aria-hidden="true" />
              <div className="ft-boundary-node">
                <small>DOWNSTREAM</small>
                <code>{selectedLayer.boundaryFlow.downstream}</code>
              </div>
            </div>

            <pre className="ft-contract-code">
              <code>{selectedLayer.contractCode}</code>
            </pre>
          </div>

          {/* Section 4: Earned Mastery — The 60s Cold Recall Gate */}
          <div
            className="ft-panel-section ft-recall-gate"
            data-testid="cold-recall-gate"
          >
            <div className="ft-recall-header">
              <div>
                <span className="ft-field-label">
                  🎯 EARNED MASTERY · 60S COLD RECALL GATE
                </span>
                <h3>
                  🙈 Blur &amp; Test Recall for {selectedLayer.id}
                </h3>
              </div>
              {recallModeActive ? (
                <div className="ft-timer-badge" role="timer">
                  <Clock size={14} aria-hidden="true" />
                  <span>{secondsRemaining}s</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="ft-btn ft-btn-accent"
                  data-testid="start-recall-btn"
                  onClick={startRecallTest}
                >
                  <EyeOff size={14} aria-hidden="true" />
                  <span>🎯 Start 60s Recall Test</span>
                </button>
              )}
            </div>

            <p className="ft-recall-instructions">
              To lock in <strong>{selectedLayer.id}</strong> mastery, blur the
              invariants &amp; contract above and type from memory: (1) the{" "}
              <strong>3-Box Boundary Flow</strong> and (2) at least{" "}
              <strong>2 Key Port Invariants / Failure Modes</strong>.
            </p>

            {(recallModeActive || currentLayerRecord.checked) && (
              <div className="ft-recall-form">
                <label htmlFor="recall-boundary-input">
                  <span>
                    1. 3-Box Boundary Flow (
                    <code>[Upstream] → [Port] → [Downstream]</code>)
                  </span>
                  <input
                    id="recall-boundary-input"
                    data-testid="recall-boundary-input"
                    type="text"
                    value={boundaryInput}
                    onChange={(e) => setBoundaryInput(e.target.value)}
                    placeholder="e.g., L1 Envelope / L6 Delta -> DurableRuntimeKernelPort -> L3 Context MMU"
                  />
                </label>

                <label htmlFor="recall-invariants-input">
                  <span>
                    2. At least 2 Key Port Invariants / Failure Modes for{" "}
                    {selectedLayer.id}
                  </span>
                  <textarea
                    id="recall-invariants-input"
                    data-testid="recall-invariants-input"
                    rows={3}
                    value={invariantsInput}
                    onChange={(e) => setInvariantsInput(e.target.value)}
                    placeholder="Type at least 2 non-negotiable invariants and what breaks without them…"
                  />
                </label>

                {validationMessage && (
                  <p className="ft-recall-error" role="alert">
                    {validationMessage}
                  </p>
                )}

                <div className="ft-recall-actions">
                  <button
                    type="button"
                    className="ft-btn ft-btn-primary"
                    data-testid="check-reveal-btn"
                    onClick={handleCheckAndReveal}
                  >
                    <Eye size={14} aria-hidden="true" />
                    <span>Check &amp; Reveal</span>
                  </button>

                  {recallModeActive && (
                    <button
                      type="button"
                      className="ft-btn"
                      onClick={() => setRecallModeActive(false)}
                    >
                      Cancel Blur
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Side-by-side comparison + Lock In Layer Mastery Button (ONLY enabled after Check & Reveal) */}
            {currentLayerRecord.checked && !recallModeActive && (
              <div
                className="ft-recall-comparison"
                data-testid="recall-comparison-result"
              >
                <div className="ft-comparison-head">
                  <strong>Side-by-Side Recall Verification</strong>
                  <span className="ft-keyword-score">
                    Matched {currentLayerRecord.matchedKeywords.length} /{" "}
                    {selectedLayer.recallKeywords.length} domain anchor terms
                  </span>
                </div>

                <div className="ft-comparison-columns">
                  <div className="ft-comp-col">
                    <small>YOUR RECALL ATTEMPT</small>
                    <p>
                      <strong>Boundary:</strong>{" "}
                      {currentLayerRecord.boundaryAttempt}
                    </p>
                    <p>
                      <strong>Invariants:</strong>{" "}
                      {currentLayerRecord.invariantsAttempt}
                    </p>
                  </div>
                  <div className="ft-comp-col">
                    <small>GROUND-TRUTH INVARIANTS ({selectedLayer.id})</small>
                    <p>
                      <strong>Boundary:</strong>{" "}
                      <code>
                        {selectedLayer.boundaryFlow.upstream} →{" "}
                        {selectedLayer.boundaryFlow.port} →{" "}
                        {selectedLayer.boundaryFlow.downstream}
                      </code>
                    </p>
                    <ul>
                      {selectedLayer.invariants.map((inv) => (
                        <li key={inv}>{inv}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="ft-lock-in-bar">
              <button
                type="button"
                data-testid="lock-in-mastery-btn"
                disabled={!currentLayerRecord.checked || recallModeActive}
                className={`ft-btn ft-btn-lock ${currentLayerRecord.lockedIn ? "is-locked" : ""}`}
                onClick={handleLockInLayer}
                title={
                  currentLayerRecord.checked
                    ? "Lock in verified recall mastery for this layer"
                    : "Complete the 60s Cold Recall Test and click Check & Reveal first"
                }
              >
                <CheckCircle2 size={15} aria-hidden="true" />
                <span>
                  {currentLayerRecord.lockedIn
                    ? `Locked In ✓ (${selectedLayer.id} Mastery Recorded)`
                    : "✅ Lock In Layer Mastery"}
                </span>
              </button>
              {!currentLayerRecord.checked && (
                <small className="ft-lock-hint">
                  <Layers size={12} aria-hidden="true" /> Locked until you
                  complete <strong>Start 60s Recall Test</strong> →{" "}
                  <strong>Check &amp; Reveal</strong>.
                </small>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
