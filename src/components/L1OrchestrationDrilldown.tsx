import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Circle, Disc } from "lucide-react";
import {
  CONCEPT_STUDY_STORAGE_KEY,
  loadConceptStudyState,
  STUDY_STATUS_OPTIONS,
  type ConceptStudyState,
  type StudyStatus,
} from "../data/agent-os-layers";
import {
  baselineStateContextImplications,
  compositionAspects,
  controlDirectionOptions,
  l1ComposableRolesSummary,
  l1CorePrinciple,
  type CompositionAspectId,
  type ControlDirectionId,
} from "../data/l1-orchestration";

type ActiveSelection =
  | { section: "control"; id: ControlDirectionId }
  | { section: "aspect"; id: CompositionAspectId };

function StatusIcon({ status }: { status: StudyStatus }) {
  if (status === "Reviewed") {
    return <Check size={12} aria-hidden="true" className="lp-status-icon" />;
  }
  if (status === "Learning") {
    return <Disc size={12} aria-hidden="true" className="lp-status-icon" />;
  }
  return <Circle size={11} aria-hidden="true" className="lp-status-icon" />;
}

export default function L1OrchestrationDrilldown() {
  const [studyState, setStudyState] = useState<ConceptStudyState>(
    loadConceptStudyState,
  );
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Single active selection across the page so only one inline explanation panel is shown at a time
  const [selection, setSelection] = useState<ActiveSelection>({
    section: "control",
    id: "mixed-control",
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        CONCEPT_STUDY_STORAGE_KEY,
        JSON.stringify(studyState),
      );
    } catch {
      // Ignore storage quota errors in restricted environments
    }
  }, [studyState]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setStatusMenuOpen(false);
      }
    }
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".lp-status-wrapper")) {
        setStatusMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const l1Status = studyState.L1;
  const statusSlug = l1Status.toLowerCase().replace(/\s+/g, "-");

  function handleStatusChange(next: StudyStatus) {
    setStudyState((prev) => ({
      ...prev,
      L1: next,
    }));
  }

  const selectedControl =
    selection.section === "control"
      ? controlDirectionOptions.find((c) => c.id === selection.id)
      : undefined;

  const selectedAspect =
    selection.section === "aspect"
      ? compositionAspects.find((a) => a.id === selection.id)
      : undefined;

  // Highlight flags for the Section B Example Architecture Diagram
  const highlightStructure =
    selection.section === "aspect" && selection.id === "execution-structure";
  const highlightCoordination =
    selection.section === "aspect" && selection.id === "agent-coordination";
  const highlightInvocation =
    selection.section === "aspect" && selection.id === "invocation-delivery";

  const currentL2Implication =
    selectedControl?.l2Implication ??
    selectedAspect?.l2Implication ??
    controlDirectionOptions[2].l2Implication;

  const currentL3Implication =
    selectedControl?.l3Implication ??
    selectedAspect?.l3Implication ??
    controlDirectionOptions[2].l3Implication;

  const currentSelectionLabel =
    selectedControl?.title ?? selectedAspect?.title ?? "Mixed control";

  return (
    <div className="lp-root l1-drilldown-root" data-testid="l1-drilldown-page">
      {/* Slim Header */}
      <header className="lp-header" role="banner">
        <div className="lp-header-inner">
          <div className="l1-header-left">
            <a href="#overview" className="l1-back-link" data-testid="l1-back-overview">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Agent architecture</span>
            </a>
            <span className="l1-header-divider" aria-hidden="true">
              /
            </span>
            <span className="l1-header-current">L1 · Orchestration</span>
          </div>

          <nav className="lp-nav" aria-label="Primary navigation">
            <a
              href="#blueprint?layer=L1&view=reference"
              className="lp-nav-primary"
              data-testid="l1-deep-reference-link"
            >
              <span>Contracts &amp; recall reference</span>
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

      <div className="lp-container l1-container">
        {/* Page Intro & Study Status */}
        <div className="l1-hero-bar">
          <div className="l1-hero-copy">
            <div className="l1-eyebrow-row">
              <span className="lp-layer-id">L1</span>
              <span className="lp-scope-note">Entry control &amp; coordination</span>
            </div>
            <h1 id="l1-page-heading">Orchestration</h1>
            <p className="lp-subtitle">
              Start the run and coordinate its work.
            </p>
          </div>

          <div className="lp-status-wrapper">
            <button
              type="button"
              className={`lp-status-pill status-${statusSlug}`}
              aria-label={`Study status for L1 Orchestration: ${l1Status}. Activate to change status.`}
              aria-haspopup="listbox"
              aria-expanded={statusMenuOpen}
              data-testid="status-trigger-L1"
              onClick={() => setStatusMenuOpen((v) => !v)}
            >
              <StatusIcon status={l1Status} />
              <span>{l1Status}</span>
            </button>

            <select
              className="sr-only"
              tabIndex={-1}
              aria-label="Set study status for L1 Orchestration"
              data-testid="status-select-L1"
              value={l1Status}
              onChange={(e) => handleStatusChange(e.target.value as StudyStatus)}
            >
              {STUDY_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {statusMenuOpen && (
              <div
                className="lp-status-popover"
                role="listbox"
                aria-label="Select study status for Orchestration"
              >
                {STUDY_STATUS_OPTIONS.map((option) => {
                  const selected = option === l1Status;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`lp-status-option ${selected ? "selected" : ""}`}
                      onClick={() => {
                        handleStatusChange(option);
                        setStatusMenuOpen(false);
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

        {/* Composable Conceptual Model Framing */}
        <section
          className="l1-composable-banner"
          aria-label="Composable orchestration model"
        >
          <p className="l1-composable-lead">
            Orchestration is a set of <strong>composable design choices</strong>{" "}
            that can coexist in one system—not mutually exclusive runtimes.{" "}
            <span>{l1CorePrinciple}</span>
          </p>
          <div className="l1-roles-grid">
            {l1ComposableRolesSummary.map((item) => (
              <div key={item.id} className="l1-role-item">
                <strong>{item.term}</strong>
                <span>{item.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION A — WHO DIRECTS THE WORK? */}
        <section
          className="l1-section"
          aria-labelledby="section-a-heading"
          data-testid="l1-section-a"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">Section A · Control authority</span>
              <h2 id="section-a-heading">Who directs the work?</h2>
            </div>
            <p className="l1-section-note">
              All three approaches can enforce budgets, permissions, approval
              requirements, and stopping conditions.
            </p>
          </div>

          <div
            className="l1-cards-grid-3"
            role="group"
            aria-label="Control authority options"
          >
            {controlDirectionOptions.map((option) => {
              const isSelected =
                selection.section === "control" && selection.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-testid={`control-card-${option.id}`}
                  aria-pressed={isSelected}
                  className={`l1-choice-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() =>
                    setSelection({ section: "control", id: option.id })
                  }
                >
                  <span className="l1-choice-title">{option.title}</span>
                  <span className="l1-choice-summary">{option.summary}</span>
                </button>
              );
            })}
          </div>

          {/* Single inline explanation panel when a Section A card is selected */}
          {selectedControl && (
            <div
              className="l1-explanation-panel"
              role="region"
              aria-live="polite"
              data-testid="l1-inline-explanation"
            >
              <div className="l1-explanation-head">
                <strong>{selectedControl.title}</strong>
                <span className="l1-explanation-tag">Selected control model</span>
              </div>
              <div className="l1-explanation-grid">
                <div>
                  <span className="l1-field-label">Definition</span>
                  <p>{selectedControl.definition}</p>
                </div>
                <div>
                  <span className="l1-field-label">Suitable use case</span>
                  <p>{selectedControl.useCase}</p>
                </div>
                <div>
                  <span className="l1-field-label">Main tradeoff</span>
                  <p>{selectedControl.tradeoff}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION B — HOW IS ORCHESTRATION COMPOSED? */}
        <section
          className="l1-section"
          aria-labelledby="section-b-heading"
          data-testid="l1-section-b"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">Section B · Architectural composition</span>
              <h2 id="section-b-heading">How is orchestration composed?</h2>
            </div>
            <p className="l1-section-note">
              Select an aspect below to highlight how it combines inside an
              example run.
            </p>
          </div>

          {/* 3 Selectable Aspect Cards */}
          <div
            className="l1-cards-grid-3"
            role="group"
            aria-label="Orchestration composition aspects"
          >
            {compositionAspects.map((aspect) => {
              const isSelected =
                selection.section === "aspect" && selection.id === aspect.id;
              return (
                <button
                  key={aspect.id}
                  type="button"
                  data-testid={`aspect-card-${aspect.id}`}
                  aria-pressed={isSelected}
                  className={`l1-choice-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() =>
                    setSelection({ section: "aspect", id: aspect.id })
                  }
                >
                  <span className="l1-aspect-num">Aspect {aspect.number}</span>
                  <span className="l1-choice-title">{aspect.title}</span>
                  <span className="l1-choice-summary">
                    {aspect.shortDescription}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Compact Example Architecture Diagram */}
          <div
            className="l1-example-diagram"
            role="region"
            aria-label="Example incident investigation orchestration diagram"
            data-testid="l1-example-diagram"
          >
            <div className="l1-example-header">
              <span className="l1-example-title">
                Example architecture · Incident investigation run
              </span>
              <span className="l1-example-disclaimer">
                Illustrative combination — not a required template or universal
                default
              </span>
            </div>

            <div className="l1-diagram-stage">
              {/* Node 1: Alert event (Invocation & delivery) */}
              <div
                className={`l1-diag-node l1-node-trigger ${highlightInvocation ? "is-highlighted" : ""}`}
                data-testid="example-node-trigger"
              >
                <span className="l1-node-kind">Event trigger</span>
                <strong>Alert event</strong>
                <span className="l1-node-sub">Starts or resumes run</span>
              </div>

              {/* Arrow: Alert -> Triage */}
              <div
                className={`l1-diag-conn ${highlightInvocation ? "is-highlighted" : ""}`}
                aria-hidden="true"
              >
                <svg viewBox="0 0 56 24" className="l1-svg-h">
                  <line
                    x1="2"
                    y1="12"
                    x2="48"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M43 7 L51 12 L43 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Node 2: Triage stage (Workflow) */}
              <div
                className={`l1-diag-node ${highlightStructure ? "is-highlighted" : ""}`}
                data-testid="example-node-triage"
              >
                <span className="l1-node-kind">Workflow stage</span>
                <strong>Triage</strong>
                <span className="l1-node-sub">Classify &amp; scope alert</span>
              </div>

              {/* Arrow: Triage -> Investigation */}
              <div
                className={`l1-diag-conn ${highlightStructure ? "is-highlighted" : ""}`}
                aria-hidden="true"
              >
                <svg viewBox="0 0 56 24" className="l1-svg-h">
                  <line
                    x1="2"
                    y1="12"
                    x2="48"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M43 7 L51 12 L43 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Node 3: Investigation stage (Contains Action ⇄ Observation loop + Specialist delegation) */}
              <div className="l1-investigation-column">
                <div
                  className={`l1-diag-node l1-node-loop ${highlightStructure || highlightCoordination ? "is-highlighted" : ""}`}
                  data-testid="example-node-investigation"
                >
                  <span className="l1-node-kind">Model-directed stage</span>
                  <strong>Investigation loop</strong>
                  <div className="l1-inner-react-loop">
                    <span>Action → Check</span>
                    <span className="l1-return-pill">↺ Observation</span>
                  </div>
                </div>

                {/* Delegation connectors to Specialist check */}
                <div
                  className={`l1-delegation-branch ${highlightCoordination ? "is-highlighted" : ""}`}
                  data-testid="example-node-specialist"
                >
                  <div className="l1-delegation-arrows" aria-hidden="true">
                    <svg viewBox="0 0 80 38" className="l1-svg-delegation">
                      <line
                        x1="28"
                        y1="2"
                        x2="28"
                        y2="32"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M24 28 L28 35 L32 28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="52"
                        y1="34"
                        x2="52"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeDasharray="3 2"
                      />
                      <path
                        d="M48 10 L52 3 L56 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="l1-delegation-label">
                      Delegate scoped check / return findings
                    </span>
                  </div>

                  <div
                    className={`l1-diag-node l1-node-specialist ${highlightCoordination ? "is-highlighted" : ""}`}
                  >
                    <span className="l1-node-kind">Delegated specialist</span>
                    <strong>Specialist check</strong>
                    <span className="l1-node-sub">
                      Scoped query or log analysis
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow: Investigation -> Verification */}
              <div
                className={`l1-diag-conn ${highlightStructure ? "is-highlighted" : ""}`}
                aria-hidden="true"
              >
                <svg viewBox="0 0 56 24" className="l1-svg-h">
                  <line
                    x1="2"
                    y1="12"
                    x2="48"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M43 7 L51 12 L43 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Node 4: Verification stage */}
              <div
                className={`l1-diag-node ${highlightStructure ? "is-highlighted" : ""}`}
                data-testid="example-node-verification"
              >
                <span className="l1-node-kind">Workflow gate</span>
                <strong>Verification</strong>
                <span className="l1-node-sub">Validate findings</span>
              </div>

              {/* Arrow: Verification -> Report */}
              <div
                className={`l1-diag-conn ${highlightInvocation ? "is-highlighted" : ""}`}
                aria-hidden="true"
              >
                <svg viewBox="0 0 56 24" className="l1-svg-h">
                  <line
                    x1="2"
                    y1="12"
                    x2="48"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M43 7 L51 12 L43 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Node 5: Report output */}
              <div
                className={`l1-diag-node l1-node-delivery ${highlightInvocation ? "is-highlighted" : ""}`}
                data-testid="example-node-report"
              >
                <span className="l1-node-kind">Delivery</span>
                <strong>Report</strong>
                <span className="l1-node-sub">Publish incident brief</span>
              </div>
            </div>
          </div>

          {/* Single inline explanation panel when a Section B aspect is selected */}
          {selectedAspect && (
            <div
              className="l1-explanation-panel"
              role="region"
              aria-live="polite"
              data-testid="l1-inline-explanation"
            >
              <div className="l1-explanation-head">
                <strong>{selectedAspect.explanationTitle}</strong>
                <span className="l1-explanation-tag">
                  {selectedAspect.exampleFocusNote}
                </span>
              </div>
              <p className="l1-explanation-single">
                {selectedAspect.explanationBody}
              </p>
            </div>
          )}
        </section>

        {/* SECTION C — STATE AND CONTEXT IMPLICATIONS */}
        <section
          className="l1-section"
          aria-labelledby="section-c-heading"
          data-testid="l1-section-c"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">
                Section C · Downstream layer boundaries
              </span>
              <h2 id="section-c-heading">State and context implications</h2>
            </div>
            <p className="l1-section-note">{l1CorePrinciple}</p>
          </div>

          {/* Active selection's direct impact on L2 and L3 */}
          <div className="l1-active-implications">
            <div className="l1-active-imp-head">
              <span>
                How <strong>{currentSelectionLabel}</strong> shapes L2 &amp; L3
              </span>
            </div>
            <div className="l1-active-imp-grid">
              <div className="l1-imp-cell">
                <span className="l1-field-label">
                  Shapes L2 · Runtime &amp; State
                </span>
                <p>{currentL2Implication}</p>
              </div>
              <div className="l1-imp-cell">
                <span className="l1-field-label">
                  Shapes L3 · Context &amp; Memory
                </span>
                <p>{currentL3Implication}</p>
              </div>
            </div>
          </div>

          {/* Core Architectural Implications List */}
          <div className="l1-implications-grid">
            {baselineStateContextImplications.map((item) => (
              <div key={item.id} className="l1-implication-card">
                <div className="l1-imp-top">
                  <strong>{item.title}</strong>
                  <span className="l1-imp-target">{item.targetLayer}</span>
                </div>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>

          {/* Subordinate Conceptual Connectors to L2 and L3 Destination Cards */}
          <div
            className="l1-conceptual-connectors"
            aria-hidden="true"
          >
            <div className="l1-concept-branch">
              <svg viewBox="0 0 24 32" className="l1-svg-concept">
                <line
                  x1="12"
                  y1="0"
                  x2="12"
                  y2="25"
                  stroke="#98A2B3"
                  strokeWidth="1.25"
                  strokeDasharray="3 3"
                />
                <path
                  d="M8 21 L12 28 L16 21"
                  fill="none"
                  stroke="#98A2B3"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Shapes state requirements</span>
            </div>
            <div className="l1-concept-branch">
              <svg viewBox="0 0 24 32" className="l1-svg-concept">
                <line
                  x1="12"
                  y1="0"
                  x2="12"
                  y2="25"
                  stroke="#98A2B3"
                  strokeWidth="1.25"
                  strokeDasharray="3 3"
                />
                <path
                  d="M8 21 L12 28 L16 21"
                  fill="none"
                  stroke="#98A2B3"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Shapes context boundaries</span>
            </div>
          </div>

          {/* Two Compact Linked Destinations: L2 and L3 */}
          <div className="l1-destinations-grid">
            <a
              href="#blueprint?layer=L2"
              className="l1-destination-card"
              data-testid="l1-link-to-L2"
            >
              <div className="l1-dest-top">
                <span className="lp-layer-id">L2</span>
                <span className="l1-dest-action">
                  <span>Open L2</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
              <h3>L2 · Runtime &amp; State</h3>
              <p>
                Track execution progress, pending work, checkpoints, and
                recovery.
              </p>
            </a>

            <a
              href="#blueprint?layer=L3"
              className="l1-destination-card"
              data-testid="l1-link-to-L3"
            >
              <div className="l1-dest-top">
                <span className="lp-layer-id">L3</span>
                <span className="l1-dest-action">
                  <span>Open L3</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
              <h3>L3 · Context &amp; Memory</h3>
              <p>
                Prepare the information each model invocation or agent needs.
              </p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
