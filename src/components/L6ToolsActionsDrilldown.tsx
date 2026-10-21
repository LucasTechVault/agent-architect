import { Fragment, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  ConceptHeroBar,
  ConceptTopHeader,
  MoreDetailDisclosure,
  StageArrowConnector,
} from "./ConceptDrilldownHeader";
import {
  l6ComposableNote,
  l6CrossLayerLinks,
  l6ExampleAdapterComposition,
  l6ExecutionFlowStages,
  l6IntegrationOptions,
  l6IntroStatement,
  l6OutcomeCategories,
  l6SharedOwnershipPrinciple,
  l6TelemetryNote,
  type L6IntegrationId,
  type L6OutcomeId,
} from "../data/l6-tools-actions";

export default function L6ToolsActionsDrilldown() {
  // Section A selection state
  const [selectedIntegrationId, setSelectedIntegrationId] =
    useState<L6IntegrationId>("enterprise-facades");
  const [integrationDetailOpen, setIntegrationDetailOpen] = useState(false);

  // Section B selection state
  const [selectedOutcomeId, setSelectedOutcomeId] =
    useState<L6OutcomeId>("safe-transient");
  const [outcomeDetailOpen, setOutcomeDetailOpen] = useState(false);

  // Section C selection state (defaults to Stage 4 so the adapter boundary & example composition are immediately discoverable)
  const [selectedFlowStageId, setSelectedFlowStageId] = useState<string>(
    "flow-execute-adapter",
  );
  const [flowDetailOpen, setFlowDetailOpen] = useState(false);

  const selectedIntegration =
    l6IntegrationOptions.find((i) => i.id === selectedIntegrationId) ??
    l6IntegrationOptions[0];

  const selectedOutcome =
    l6OutcomeCategories.find((o) => o.id === selectedOutcomeId) ??
    l6OutcomeCategories[0];

  const selectedFlowStage =
    l6ExecutionFlowStages.find((s) => s.id === selectedFlowStageId) ??
    l6ExecutionFlowStages[3];

  const flowRows = [
    l6ExecutionFlowStages.slice(0, 3),
    l6ExecutionFlowStages.slice(3, 6),
  ];

  return (
    <div
      className="lp-root l1-drilldown-root l6-drilldown-root"
      data-testid="l6-drilldown-page"
    >
      <ConceptTopHeader layerId="L6" title="Tools & Actions" />

      <div className="lp-container l1-container">
        <ConceptHeroBar
          layerId="L6"
          scopeNote="Capability integration & action execution"
          title="Tools & Actions"
          subtitle="Execute scoped actions and return trustworthy observations."
          headingId="l6-page-heading"
        />

        {/* Compact Introductory Framing */}
        <section
          className="l1-composable-banner"
          aria-label="Tools and actions overview"
          data-testid="l6-intro-banner"
        >
          <p className="l1-composable-lead">
            {l6IntroStatement} <span>{l6ComposableNote}</span>
          </p>
        </section>

        {/* SECTION A — INTEGRATION & EXECUTION */}
        <section
          className="l1-section"
          aria-labelledby="l6-section-a-heading"
          data-testid="l6-section-a"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">
                Section A · Integration &amp; execution
              </span>
              <h2 id="l6-section-a-heading">
                How are capabilities connected and executed?
              </h2>
            </div>
            <p className="l1-section-note">
              Domain interfaces, protocols, and execution environments can be
              combined behind the same internal port.
            </p>
          </div>

          <div
            className="l1-cards-grid-3"
            role="group"
            aria-label="Integration and execution options"
          >
            {l6IntegrationOptions.map((option) => {
              const isSelected = option.id === selectedIntegration.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  data-testid={`l6-integration-card-${option.id}`}
                  aria-pressed={isSelected}
                  className={`l1-choice-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    setSelectedIntegrationId(option.id);
                    setIntegrationDetailOpen(false);
                  }}
                >
                  <span className="l1-choice-title">{option.title}</span>
                  <span className="l1-choice-summary">{option.subtitle}</span>
                </button>
              );
            })}
          </div>

          {/* Single Explanation Panel beneath Section A */}
          <div
            className="l1-explanation-panel"
            role="region"
            aria-live="polite"
            data-testid="l6-section-a-explanation"
          >
            <div className="l1-explanation-head">
              <strong>{selectedIntegration.title}</strong>
              <span className="l1-explanation-tag">
                Selected integration mechanism
              </span>
            </div>
            <div className="l1-explanation-grid">
              <div>
                <span className="l1-field-label">Definition</span>
                <p>{selectedIntegration.definition}</p>
              </div>
              <div>
                <span className="l1-field-label">Suitable use case</span>
                <p>{selectedIntegration.useCase}</p>
              </div>
              <div>
                <span className="l1-field-label">Main tradeoff</span>
                <p>{selectedIntegration.tradeoff}</p>
              </div>
            </div>

            {/* MCP Primitives Distinction when Card 2 is selected */}
            {selectedIntegration.mcpPrimitives && (
              <div
                className="cd-inline-subpanel"
                data-testid="l6-mcp-primitives"
              >
                <span className="l1-field-label">
                  MCP primitives map to different architectural layers
                </span>
                <div className="cd-mcp-primitives-grid">
                  {selectedIntegration.mcpPrimitives.map((item) => (
                    <div key={item.primitive} className="cd-mcp-primitive-card">
                      <div className="cd-mcp-primitive-top">
                        <strong>{item.primitive}</strong>
                        <span className="cd-stage-badge">
                          {item.layerTarget}
                        </span>
                      </div>
                      <p>{item.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sandbox Lifecycle Illustration when Card 3 is selected */}
            {selectedIntegration.sandboxLifecycle && (
              <div
                className="cd-inline-subpanel"
                data-testid="l6-sandbox-lifecycle"
              >
                <span className="l1-field-label">
                  Isolated environment execution lifecycle
                </span>
                <div className="cd-lifecycle-chain">
                  {selectedIntegration.sandboxLifecycle.map((step, idx) => (
                    <Fragment key={step}>
                      {idx > 0 && <StageArrowConnector />}
                      <div className="cd-lifecycle-pill">
                        <span className="cd-lifecycle-num">{idx + 1}</span>
                        <strong>{step}</strong>
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            )}

            <MoreDetailDisclosure
              items={selectedIntegration.moreDetail}
              isOpen={integrationDetailOpen}
              onToggle={() => setIntegrationDetailOpen((v) => !v)}
              testId="l6-section-a-more-detail"
            />
          </div>
        </section>

        {/* SECTION B — OUTCOMES & RECOVERY */}
        <section
          className="l1-section"
          aria-labelledby="l6-section-b-heading"
          data-testid="l6-section-b"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">
                Section B · Outcomes &amp; recovery
              </span>
              <h2 id="l6-section-b-heading">
                What happens when execution cannot complete?
              </h2>
            </div>
            <p className="l1-section-note">
              Selecting an outcome highlights the affected stages in Section C’s
              execution flow below.
            </p>
          </div>

          {/* 5 Compact Selectable Outcome Rows */}
          <div
            className="cd-outcomes-list"
            role="group"
            aria-label="Execution outcome categories"
          >
            {l6OutcomeCategories.map((outcome) => {
              const isSelected = outcome.id === selectedOutcome.id;
              return (
                <button
                  key={outcome.id}
                  type="button"
                  data-testid={`l6-outcome-row-${outcome.id}`}
                  aria-pressed={isSelected}
                  className={`cd-outcome-row ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    setSelectedOutcomeId(outcome.id);
                    setOutcomeDetailOpen(false);
                  }}
                >
                  <div className="cd-outcome-left">
                    <span className="cd-outcome-num">{outcome.number}</span>
                    <div className="cd-outcome-copy">
                      <strong className="cd-outcome-title">
                        {outcome.title}
                      </strong>
                      <span className="cd-outcome-sub">
                        {outcome.shortPurpose}
                      </span>
                    </div>
                  </div>
                  <div className="cd-outcome-stages-badge">
                    <span>
                      Stages {outcome.highlightedFlowStages.join(" · ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Single Explanation Panel beneath Section B (Detected condition / Handling decision / Returned outcome) */}
          <div
            className="l1-explanation-panel"
            role="region"
            aria-live="polite"
            data-testid="l6-section-b-explanation"
          >
            <div className="l1-explanation-head">
              <strong>
                {selectedOutcome.number}. {selectedOutcome.title}
              </strong>
              <span className="l1-explanation-tag">
                {selectedOutcome.flowHighlightNote}
              </span>
            </div>
            <div className="l1-explanation-grid">
              <div>
                <span className="l1-field-label">Detected condition</span>
                <p>{selectedOutcome.detectedCondition}</p>
              </div>
              <div>
                <span className="l1-field-label">Handling decision</span>
                <p>{selectedOutcome.handlingDecision}</p>
              </div>
              <div>
                <span className="l1-field-label">Returned outcome</span>
                <p>{selectedOutcome.returnedOutcome}</p>
              </div>
            </div>
            <MoreDetailDisclosure
              items={selectedOutcome.moreDetail}
              isOpen={outcomeDetailOpen}
              onToggle={() => setOutcomeDetailOpen((v) => !v)}
              testId="l6-section-b-more-detail"
            />
          </div>

          {/* Shared Ownership Principle */}
          <div
            className="cd-principle-bar"
            data-testid="l6-shared-ownership-principle"
          >
            <span className="cd-principle-label">
              Shared ownership principle (L4 vs L6)
            </span>
            <p>{l6SharedOwnershipPrinciple}</p>
          </div>
        </section>

        {/* SECTION C — TOOL EXECUTION FLOW */}
        <section
          className="l1-section"
          aria-labelledby="l6-section-c-heading"
          data-testid="l6-section-c"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">
                Section C · Tool execution flow
              </span>
              <h2 id="l6-section-c-heading">
                How does a tool request become an observation?
              </h2>
            </div>
            <p className="l1-section-note">
              Raw tool responses are not automatically injected verbatim into
              the prompt; L3 selects a bounded observation.
            </p>
          </div>

          {/* Active Outcome Highlight Legend */}
          <div className="cd-flow-legend">
            <span className="cd-legend-item">
              <span className="cd-legend-swatch is-selected" />
              <span>Selected flow stage ({selectedFlowStage.title})</span>
            </span>
            <span className="cd-legend-item">
              <span className="cd-legend-swatch is-outcome" />
              <span>
                Highlighted by Section B outcome ({selectedOutcome.title}:
                Stages {selectedOutcome.highlightedFlowStages.join(", ")})
              </span>
            </span>
          </div>

          {/* 6-Stage Connected Tool Execution Diagram (2 rows x 3 stages) */}
          <div
            className="cd-pipeline-diagram"
            role="group"
            aria-label="Tool execution flow stages"
            data-testid="l6-execution-flow-diagram"
          >
            {flowRows.map((rowStages, rowIndex) => (
              <Fragment key={rowIndex}>
                {rowIndex > 0 && (
                  <div className="cd-row-continuation" aria-hidden="true">
                    <span>
                      ↵ Continues to stage 4 · Execute through the adapter
                    </span>
                  </div>
                )}
                <div className="cd-stage-row cd-stage-row-3">
                  {rowStages.map((stage, idx) => {
                    const isSelected = stage.id === selectedFlowStage.id;
                    const isOutcomeHighlighted =
                      selectedOutcome.highlightedFlowStages.includes(
                        stage.number,
                      );
                    return (
                      <Fragment key={stage.id}>
                        {idx > 0 && (
                          <StageArrowConnector
                            highlighted={isSelected || isOutcomeHighlighted}
                          />
                        )}
                        <button
                          type="button"
                          data-testid={`l6-flow-stage-${stage.number}`}
                          aria-pressed={isSelected}
                          className={`cd-stage-card ${isSelected ? "is-selected" : ""} ${isOutcomeHighlighted ? "is-outcome-highlighted" : ""}`}
                          onClick={() => {
                            setSelectedFlowStageId(stage.id);
                            setFlowDetailOpen(false);
                          }}
                        >
                          <div className="cd-stage-top">
                            <span className="cd-stage-num">
                              Stage {stage.number}
                            </span>
                            <span className="cd-stage-badge">
                              {stage.layerTag}
                            </span>
                          </div>
                          <strong className="cd-stage-title">
                            {stage.title}
                          </strong>
                          <span className="cd-stage-sub">{stage.subtitle}</span>
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
              </Fragment>
            ))}

            {/* Quiet L7 Telemetry Relationship Bar */}
            <div className="cd-telemetry-bar" data-testid="l6-telemetry-note">
              <span className="cd-telemetry-badge">L7 · Telemetry</span>
              <span>{l6TelemetryNote}</span>
            </div>
          </div>

          {/* Single Explanation Panel beneath Section C */}
          <div
            className="l1-explanation-panel"
            role="region"
            aria-live="polite"
            data-testid="l6-section-c-explanation"
          >
            <div className="l1-explanation-head">
              <strong>
                Stage {selectedFlowStage.number} · {selectedFlowStage.title}
              </strong>
              <span className="l1-explanation-tag">
                {selectedFlowStage.layerTag}
              </span>
            </div>
            <div className="l1-explanation-grid">
              <div>
                <span className="l1-field-label">Input</span>
                <p>{selectedFlowStage.input}</p>
              </div>
              <div>
                <span className="l1-field-label">Transformation</span>
                <p>{selectedFlowStage.transformation}</p>
              </div>
              <div>
                <span className="l1-field-label">Output</span>
                <p>{selectedFlowStage.output}</p>
              </div>
            </div>

            {/* Example Adapter Composition when Stage 4 is selected */}
            {selectedFlowStage.hasExampleComposition && (
              <div
                className="cd-inline-subpanel"
                data-testid="l6-example-adapter-composition"
              >
                <span className="l1-field-label">
                  {l6ExampleAdapterComposition.label}
                </span>
                <div className="cd-lifecycle-chain">
                  {l6ExampleAdapterComposition.chain.map((node, idx) => (
                    <Fragment key={node}>
                      {idx > 0 && <StageArrowConnector />}
                      <div className="cd-lifecycle-pill">
                        <strong>{node}</strong>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <p className="cd-subpanel-note">
                  {l6ExampleAdapterComposition.note}
                </p>
              </div>
            )}

            <MoreDetailDisclosure
              items={selectedFlowStage.moreDetail}
              isOpen={flowDetailOpen}
              onToggle={() => setFlowDetailOpen((v) => !v)}
              testId="l6-section-c-more-detail"
            />
          </div>

          {/* Quiet Cross-Layer Links: L2, L3, L4, L5, L7 */}
          <div className="cd-cross-links-block">
            <span className="l1-field-label">Connected layer boundaries</span>
            <div
              className="cd-cross-links-grid"
              data-testid="l6-cross-layer-links"
            >
              {l6CrossLayerLinks.map((link) => (
                <a
                  key={link.layerId}
                  href={`#blueprint?layer=${link.layerId}`}
                  className="cd-cross-link-card"
                  data-testid={`l6-link-to-${link.layerId}`}
                >
                  <div className="l1-dest-top">
                    <span className="lp-layer-id">{link.layerId}</span>
                    <span className="l1-dest-action">
                      <span>Open {link.layerId}</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </div>
                  <h3>{link.title}</h3>
                  <p>{link.relationship}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
