import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Circle, Disc } from "lucide-react";
import {
  agentOsLayers,
  CONCEPT_STUDY_STORAGE_KEY,
  countReviewedConcepts,
  l5EnforcementHooks,
  loadConceptStudyState,
  loopTerminationConditions,
  STUDY_STATUS_OPTIONS,
  type AgentOsLayer,
  type ConceptStudyState,
  type LayerId,
  type StudyStatus,
} from "../data/agent-os-layers";

function StatusIcon({ status }: { status: StudyStatus }) {
  if (status === "Reviewed") {
    return <Check size={12} aria-hidden="true" className="lp-status-icon" />;
  }
  if (status === "Learning") {
    return <Disc size={12} aria-hidden="true" className="lp-status-icon" />;
  }
  return <Circle size={11} aria-hidden="true" className="lp-status-icon" />;
}

interface ConceptCardProps {
  layer: AgentOsLayer;
  status: StudyStatus;
  scopeNote?: string;
  extraFooter?: React.ReactNode;
  openStatusLayer: LayerId | null;
  setOpenStatusLayer: (id: LayerId | null) => void;
  onStatusChange: (id: LayerId, next: StudyStatus) => void;
}

function ConceptCard({
  layer,
  status,
  scopeNote,
  extraFooter,
  openStatusLayer,
  setOpenStatusLayer,
  onStatusChange,
}: ConceptCardProps) {
  const statusSlug = status.toLowerCase().replace(/\s+/g, "-");
  const isMenuOpen = openStatusLayer === layer.id;
  const detailHref = `#blueprint?layer=${layer.id}`;

  return (
    <article
      className={`lp-card lp-card-${layer.id.toLowerCase()}`}
      data-testid={`concept-row-${layer.id}`}
    >
      <div className="lp-card-top">
        <div className="lp-card-id-group">
          <span className="lp-layer-id">{layer.id}</span>
          {scopeNote && <span className="lp-scope-note">{scopeNote}</span>}
        </div>

        <div className="lp-status-wrapper">
          <button
            type="button"
            className={`lp-status-pill status-${statusSlug}`}
            aria-label={`Study status for ${layer.id} ${layer.landingTitle}: ${status}. Activate to change status.`}
            aria-haspopup="listbox"
            aria-expanded={isMenuOpen}
            data-testid={`status-trigger-${layer.id}`}
            onClick={() => setOpenStatusLayer(isMenuOpen ? null : layer.id)}
          >
            <StatusIcon status={status} />
            <span>{status}</span>
          </button>

          {/* Keep hidden native select for assistive technology & automated test compatibility */}
          <select
            className="sr-only"
            tabIndex={-1}
            aria-label={`Set study status for ${layer.id} ${layer.landingTitle}`}
            data-testid={`status-select-${layer.id}`}
            value={status}
            onChange={(e) =>
              onStatusChange(layer.id, e.target.value as StudyStatus)
            }
          >
            {STUDY_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {isMenuOpen && (
            <div
              className="lp-status-popover"
              role="listbox"
              aria-label={`Select study status for ${layer.landingTitle}`}
            >
              {STUDY_STATUS_OPTIONS.map((option) => {
                const selected = option === status;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`lp-status-option ${selected ? "selected" : ""}`}
                    onClick={() => {
                      onStatusChange(layer.id, option);
                      setOpenStatusLayer(null);
                    }}
                  >
                    <StatusIcon status={option} />
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <a
        href={detailHref}
        className="lp-card-link"
        aria-label={`${layer.id} ${layer.landingTitle}: ${layer.landingDescription} Open detailed blueprint.`}
      >
        <h3 className="lp-card-title">{layer.landingTitle}</h3>
        <p className="lp-card-desc">{layer.landingDescription}</p>
      </a>

      {extraFooter && <div className="lp-card-extra">{extraFooter}</div>}
    </article>
  );
}

export default function LandingPage() {
  const [studyState, setStudyState] = useState<ConceptStudyState>(
    loadConceptStudyState,
  );
  const [openStatusLayer, setOpenStatusLayer] = useState<LayerId | null>(null);
  const [activeHookInfo, setActiveHookInfo] = useState<string | null>(null);
  const [gateDetailsOpen, setGateDetailsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        CONCEPT_STUDY_STORAGE_KEY,
        JSON.stringify(studyState),
      );
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [studyState]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenStatusLayer(null);
        setActiveHookInfo(null);
        setGateDetailsOpen(false);
      }
    }
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest(".lp-status-wrapper")) {
        setOpenStatusLayer(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const reviewedCount = useMemo(
    () => countReviewedConcepts(studyState),
    [studyState],
  );

  function handleStatusChange(id: LayerId, next: StudyStatus) {
    setStudyState((prev) => ({
      ...prev,
      [id]: next,
    }));
  }

  const layerById = useMemo(() => {
    const map = {} as Record<LayerId, AgentOsLayer>;
    for (const l of agentOsLayers) {
      map[l.id] = l;
    }
    return map;
  }, []);

  const hookAnnotations = [
    {
      id: "hook-1",
      shortLabel: "Before model input",
      hook: l5EnforcementHooks[0],
    },
    {
      id: "hook-2",
      shortLabel: "Before tool execution",
      hook: l5EnforcementHooks[1],
    },
    {
      id: "hook-3",
      shortLabel: "After tool output",
      hook: l5EnforcementHooks[2],
    },
  ];

  const selectedHookObj = hookAnnotations.find(
    (h) => h.id === activeHookInfo,
  );

  return (
    <div className="lp-root" ref={containerRef}>
      {/* A. Slim Header */}
      <header className="lp-header" role="banner">
        <div className="lp-header-inner">
          <a href="#overview" className="lp-wordmark">
            Agent Architect
          </a>

          <nav className="lp-nav" aria-label="Primary navigation">
            <a href="#blueprint" className="lp-nav-primary">
              <span>Detailed blueprint</span>
              <ArrowRight size={14} aria-hidden="true" />
            </a>
            <div className="lp-nav-secondary" aria-label="Additional views">
              <a href="#archetypes">Archetypes</a>
              <a href="#map">System map</a>
              <a href="#roadmap">Roadmap</a>
            </div>
          </nav>
        </div>
      </header>

      <div className="lp-container">
        {/* B. Short Introduction & Lightweight Progress Summary */}
        <div className="lp-top-bar">
          <section className="lp-intro" aria-labelledby="lp-heading">
            <h1 id="lp-heading">Agent architecture</h1>
            <p className="lp-subtitle">
              Explore how the seven concepts work together to form an agent
              system.
            </p>
          </section>

          <div
            className="lp-progress-summary"
            role="status"
            aria-live="polite"
            data-testid="concepts-progress-summary"
          >
            <span>
              {reviewedCount} of {agentOsLayers.length} concepts reviewed
            </span>
          </div>
        </div>

        {/* C. Interactive Minimal Architecture Map (Regions A, B, C) */}
        <div
          className="lp-architecture-map"
          role="region"
          aria-label="Seven-concept agent architecture map"
        >
          {/* REGION A — ENTRY AND ORCHESTRATION (L1) */}
          <section
            className="lp-region lp-region-entry"
            aria-label="Entry and orchestration"
          >
            <ConceptCard
              layer={layerById.L1}
              status={studyState.L1}
              scopeNote="Entry control"
              openStatusLayer={openStatusLayer}
              setOpenStatusLayer={setOpenStatusLayer}
              onStatusChange={handleStatusChange}
            />
          </section>

          {/* Connector: L1 -> L2 ("Initialize run") */}
          <div
            className="lp-connector-initialize"
            aria-label="L1 initializes run into L2"
          >
            <div className="lp-init-track">
              <svg
                className="lp-svg-v"
                viewBox="0 0 24 42"
                aria-hidden="true"
              >
                <line
                  x1="12"
                  y1="0"
                  x2="12"
                  y2="35"
                  stroke="#64748B"
                  strokeWidth="1.75"
                />
                <path
                  d="M7 31 L12 39 L17 31"
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="lp-connector-label">Initialize run</span>
            </div>
          </div>

          {/* REGION B — AGENT EXECUTION LOOP (L2, L3, L4, Gate, L5, L6) */}
          <section
            className="lp-region lp-region-loop"
            aria-labelledby="lp-loop-heading"
          >
            <div className="lp-loop-header">
              <h2 id="lp-loop-heading" className="lp-region-title">
                Agent execution loop
              </h2>
              <span className="lp-loop-caption">
                Cyclic per-tick execution · L5 enforces policy at 3 points
              </span>
            </div>

            <div className="lp-loop-grid">
              {/* TOP LEFT (Row 1, Col 1): L2 · Runtime & State */}
              <div className="lp-grid-cell lp-pos-l2">
                <ConceptCard
                  layer={layerById.L2}
                  status={studyState.L2}
                  openStatusLayer={openStatusLayer}
                  setOpenStatusLayer={setOpenStatusLayer}
                  onStatusChange={handleStatusChange}
                />
              </div>

              {/* CONNECTOR (Row 1, Col 2): L2 -> L3 */}
              <div
                className="lp-grid-conn lp-conn-l2-l3"
                aria-hidden="true"
              >
                <svg className="lp-svg-h" viewBox="0 0 88 28">
                  <line
                    x1="4"
                    y1="14"
                    x2="78"
                    y2="14"
                    stroke="#64748B"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M73 9 L81 14 L73 19"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* TOP CENTRE (Row 1, Col 3): L3 · Context & Memory */}
              <div className="lp-grid-cell lp-pos-l3">
                <ConceptCard
                  layer={layerById.L3}
                  status={studyState.L3}
                  openStatusLayer={openStatusLayer}
                  setOpenStatusLayer={setOpenStatusLayer}
                  onStatusChange={handleStatusChange}
                />
              </div>

              {/* CONNECTOR (Row 1, Col 4): L3 -> L4 (with L5 Hook 1 marker: Before model input) */}
              <div className="lp-grid-conn lp-conn-l3-l4">
                <button
                  type="button"
                  className={`lp-hook-marker ${activeHookInfo === "hook-1" ? "active" : ""}`}
                  onClick={() =>
                    setActiveHookInfo(
                      activeHookInfo === "hook-1" ? null : "hook-1",
                    )
                  }
                  title="L5 policy check before model input"
                >
                  Before model input
                </button>
                <svg
                  className="lp-svg-h"
                  viewBox="0 0 88 24"
                  aria-hidden="true"
                >
                  <line
                    x1="4"
                    y1="12"
                    x2="78"
                    y2="12"
                    stroke="#64748B"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M73 7 L81 12 L73 17"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* TOP RIGHT (Row 1, Col 5): L4 · Model Gateway */}
              <div className="lp-grid-cell lp-pos-l4">
                <ConceptCard
                  layer={layerById.L4}
                  status={studyState.L4}
                  openStatusLayer={openStatusLayer}
                  setOpenStatusLayer={setOpenStatusLayer}
                  onStatusChange={handleStatusChange}
                />
              </div>

              {/* LEFT VERTICAL RETURN CONNECTOR (Row 2, Col 1): L6 -> L2 ("Observation / next tick" + L5 Hook 3) */}
              <div
                className="lp-grid-conn-v lp-conn-l6-l2"
                data-testid="loop-return-connector"
              >
                <svg
                  className="lp-svg-v"
                  viewBox="0 0 28 68"
                  aria-hidden="true"
                >
                  <line
                    x1="14"
                    y1="64"
                    x2="14"
                    y2="10"
                    stroke="#4F46E5"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M9 15 L14 7 L19 15"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="lp-return-meta">
                  <span className="lp-return-label">
                    Observation / next tick
                  </span>
                  <button
                    type="button"
                    className={`lp-hook-marker ${activeHookInfo === "hook-3" ? "active" : ""}`}
                    onClick={() =>
                      setActiveHookInfo(
                        activeHookInfo === "hook-3" ? null : "hook-3",
                      )
                    }
                    title="L5 policy check after tool output"
                  >
                    After tool output
                  </button>
                </div>
              </div>

              {/* CENTER LOOP SPACE (Row 2, Col 2..4): Optional interactive disclosure panel for L5 Hook or Gate */}
              <div className="lp-grid-center">
                {selectedHookObj ? (
                  <div
                    className="lp-inline-disclosure"
                    role="region"
                    aria-label="L5 enforcement hook detail"
                  >
                    <div className="lp-disclosure-head">
                      <strong>
                        L5 · {selectedHookObj.shortLabel} (
                        {selectedHookObj.hook.boundary})
                      </strong>
                      <button
                        type="button"
                        onClick={() => setActiveHookInfo(null)}
                        aria-label="Close hook detail"
                      >
                        Close
                      </button>
                    </div>
                    <p>{selectedHookObj.hook.detail}</p>
                  </div>
                ) : gateDetailsOpen ? (
                  <div
                    className="lp-inline-disclosure"
                    role="region"
                    aria-label="Loop control termination conditions"
                  >
                    <div className="lp-disclosure-head">
                      <strong>Loop control exit conditions</strong>
                      <button
                        type="button"
                        onClick={() => setGateDetailsOpen(false)}
                        aria-label="Close loop control details"
                      >
                        Close
                      </button>
                    </div>
                    <ul className="lp-disclosure-list">
                      {loopTerminationConditions.map((c) => (
                        <li key={c.id}>
                          <strong>{c.title}:</strong> {c.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="lp-cycle-hint" aria-hidden="true">
                    <span>↻ Cyclic execution loop</span>
                  </div>
                )}
              </div>

              {/* RIGHT VERTICAL CONNECTOR (Row 2, Col 5): L4 -> Loop-Control Gate */}
              <div
                className="lp-grid-conn-v lp-conn-l4-gate"
                aria-hidden="true"
              >
                <svg className="lp-svg-v" viewBox="0 0 28 68">
                  <line
                    x1="14"
                    y1="4"
                    x2="14"
                    y2="58"
                    stroke="#64748B"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M9 53 L14 61 L19 53"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="lp-connector-label">Response / action</span>
              </div>

              {/* BOTTOM LEFT (Row 3, Col 1): L6 · Tools & Actions */}
              <div className="lp-grid-cell lp-pos-l6">
                <ConceptCard
                  layer={layerById.L6}
                  status={studyState.L6}
                  openStatusLayer={openStatusLayer}
                  setOpenStatusLayer={setOpenStatusLayer}
                  onStatusChange={handleStatusChange}
                />
              </div>

              {/* CONNECTOR (Row 3, Col 2): L5 -> L6 (pointing left from L5 to L6, with L5 Hook 2 marker) */}
              <div className="lp-grid-conn lp-conn-l5-l6">
                <button
                  type="button"
                  className={`lp-hook-marker ${activeHookInfo === "hook-2" ? "active" : ""}`}
                  onClick={() =>
                    setActiveHookInfo(
                      activeHookInfo === "hook-2" ? null : "hook-2",
                    )
                  }
                  title="L5 policy check before tool execution"
                >
                  Before tool execution
                </button>
                <svg
                  className="lp-svg-h"
                  viewBox="0 0 88 24"
                  aria-hidden="true"
                >
                  <line
                    x1="84"
                    y1="12"
                    x2="10"
                    y2="12"
                    stroke="#64748B"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M15 7 L7 12 L15 17"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* BOTTOM CENTRE (Row 3, Col 3): L5 · Guardrails & Policy */}
              <div className="lp-grid-cell lp-pos-l5">
                <ConceptCard
                  layer={layerById.L5}
                  status={studyState.L5}
                  openStatusLayer={openStatusLayer}
                  setOpenStatusLayer={setOpenStatusLayer}
                  onStatusChange={handleStatusChange}
                />
              </div>

              {/* CONNECTOR (Row 3, Col 4): Gate -> L5 (pointing left on tool call) */}
              <div className="lp-grid-conn lp-conn-gate-l5">
                <span className="lp-connector-label">Tool call</span>
                <svg
                  className="lp-svg-h"
                  viewBox="0 0 88 24"
                  aria-hidden="true"
                >
                  <line
                    x1="84"
                    y1="12"
                    x2="10"
                    y2="12"
                    stroke="#64748B"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M15 7 L7 12 L15 17"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* BOTTOM RIGHT (Row 3, Col 5): Smaller, unnumbered Loop-Control Gate */}
              <div className="lp-grid-cell lp-pos-gate">
                <aside
                  className="lp-gate-card"
                  aria-label="Loop control gate"
                  data-testid="loop-control-gate"
                >
                  <div className="lp-gate-top">
                    <span className="lp-gate-label">Loop control</span>
                    <button
                      type="button"
                      className="lp-gate-info-btn"
                      aria-expanded={gateDetailsOpen}
                      onClick={() => setGateDetailsOpen((v) => !v)}
                    >
                      {gateDetailsOpen ? "Hide rules" : "Exit rules"}
                    </button>
                  </div>
                  <p className="lp-gate-desc">
                    Continues to tool check when a tool is requested, or exits
                    the loop:
                  </p>
                  <ul className="lp-gate-outcomes">
                    <li>Complete (final answer)</li>
                    <li>Stop at budget limit</li>
                    <li>Pause for approval</li>
                  </ul>
                </aside>
              </div>
            </div>

            {/* Mobile-only explicit return connector (shown when grid stacks vertically) */}
            <div className="lp-mobile-return">
              <span>
                ↺ Observation / next tick (L5 · After tool output) → returns to
                L2 · Runtime &amp; State
              </span>
            </div>
          </section>

          {/* Sparse Dashed Telemetry Collector Connector: L1–L6 -> L7 */}
          <div
            className="lp-connector-telemetry"
            aria-label="Telemetry from L1 through L6 flows into L7"
          >
            <svg
              className="lp-svg-telemetry"
              viewBox="0 0 600 38"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1="100"
                y1="2"
                x2="100"
                y2="18"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1="300"
                y1="2"
                x2="300"
                y2="32"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1="500"
                y1="2"
                x2="500"
                y2="18"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <line
                x1="100"
                y1="18"
                x2="500"
                y2="18"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <path
                d="M296 28 L300 35 L304 28"
                fill="none"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="lp-telemetry-label">Telemetry from L1–L6</span>
          </div>

          {/* REGION C — SHARED OBSERVABILITY AND EVALUATION (L7) */}
          <section
            className="lp-region lp-region-rail"
            aria-label="Shared observability and evaluation"
          >
            <ConceptCard
              layer={layerById.L7}
              status={studyState.L7}
              scopeNote="Across every layer"
              openStatusLayer={openStatusLayer}
              setOpenStatusLayer={setOpenStatusLayer}
              onStatusChange={handleStatusChange}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
