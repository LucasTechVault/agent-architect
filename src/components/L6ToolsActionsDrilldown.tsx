import { Fragment, useState } from "react";
import { ArrowRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import {
  CollapsibleConceptSection,
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
  l6SectionIntuitions,
  l6SharedOwnershipPrinciple,
  l6TelemetryNote,
  type L6IntegrationId,
  type L6OutcomeId,
} from "../data/l6-tools-actions";

export default function L6ToolsActionsDrilldown() {
  // Collapsible section states (all expanded by default; user can collapse/expand individually or all at once)
  const [expandedSections, setExpandedSections] = useState<{
    A: boolean;
    B: boolean;
    C: boolean;
  }>({
    A: true,
    B: true,
    C: true,
  });

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

  const allExpanded =
    expandedSections.A && expandedSections.B && expandedSections.C;

  function toggleSection(key: "A" | "B" | "C") {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function toggleAllSections() {
    const next = !allExpanded;
    setExpandedSections({ A: next, B: next, C: next });
  }

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

        {/* Compact Introductory Framing + Expand/Collapse All Control */}
        <section
          className="l1-composable-banner cd-intro-banner-row"
          aria-label="Tools and actions overview"
          data-testid="l6-intro-banner"
        >
          <p className="l1-composable-lead">
            {l6IntroStatement} <span>{l6ComposableNote}</span>
          </p>
          <button
            type="button"
            className="cd-expand-all-btn"
            data-testid="l6-toggle-all-sections"
            onClick={toggleAllSections}
          >
            {allExpanded ? (
              <>
                <ChevronsDownUp size={14} aria-hidden="true" />
                <span>Collapse all sections</span>
              </>
            ) : (
              <>
                <ChevronsUpDown size={14} aria-hidden="true" />
                <span>Expand all sections</span>
              </>
            )}
          </button>
        </section>

        {/* SECTION A — INTEGRATION & EXECUTION */}
        <CollapsibleConceptSection
          stepLabel={l6SectionIntuitions.A.stepLabel}
          heading={l6SectionIntuitions.A.heading}
          headingId="l6-section-a-heading"
          intuitionTitle={l6SectionIntuitions.A.intuitionTitle}
          intuitionBody={l6SectionIntuitions.A.intuitionBody}
          isExpanded={expandedSections.A}
          onToggle={() => toggleSection("A")}
          collapsedPreviewItems={l6IntegrationOptions.map((o) => ({
            id: o.id,
            number: o.number,
            label: o.title,
          }))}
          onSelectCollapsedItem={(id) => {
            setSelectedIntegrationId(id as L6IntegrationId);
            setIntegrationDetailOpen(false);
          }}
          testId="l6-section-a"
        >
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
                  <div className="cd-card-num-header">
                    <span className="cd-subbox-num">{option.number}</span>
                    <span className="l1-choice-title">{option.title}</span>
                  </div>
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
              <strong>
                {selectedIntegration.number}. {selectedIntegration.title}
              </strong>
              <span className="l1-explanation-tag">
                Selected integration mechanism ({selectedIntegration.number} of
                3)
              </span>
            </div>
            <div className="l1-explanation-grid">
              <div>
                <span className="l1-field-label">1 · Definition</span>
                <p>{selectedIntegration.definition}</p>
              </div>
              <div>
                <span className="l1-field-label">2 · Suitable use case</span>
                <p>{selectedIntegration.useCase}</p>
              </div>
              <div>
                <span className="l1-field-label">3 · Main tradeoff</span>
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
                        <div className="cd-card-num-header">
                          <span className="cd-subbox-num">{item.number}</span>
                          <strong>{item.primitive}</strong>
                        </div>
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
        </CollapsibleConceptSection>

        {/* SECTION B — OUTCOMES & RECOVERY */}
        <CollapsibleConceptSection
          stepLabel={l6SectionIntuitions.B.stepLabel}
          heading={l6SectionIntuitions.B.heading}
          headingId="l6-section-b-heading"
          intuitionTitle={l6SectionIntuitions.B.intuitionTitle}
          intuitionBody={l6SectionIntuitions.B.intuitionBody}
          isExpanded={expandedSections.B}
          onToggle={() => toggleSection("B")}
          collapsedPreviewItems={l6OutcomeCategories.map((o) => ({
            id: o.id,
            number: o.number,
            label: o.title,
          }))}
          onSelectCollapsedItem={(id) => {
            setSelectedOutcomeId(id as L6OutcomeId);
            setOutcomeDetailOpen(false);
          }}
          testId="l6-section-b"
        >
          <p className="l1-section-note">
            Selecting an outcome below also highlights the affected stages in
            Section C’s execution flow.
          </p>

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
                        {outcome.number}. {outcome.title}
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
                <span className="l1-field-label">1 · Detected condition</span>
                <p>{selectedOutcome.detectedCondition}</p>
              </div>
              <div>
                <span className="l1-field-label">2 · Handling decision</span>
                <p>{selectedOutcome.handlingDecision}</p>
              </div>
              <div>
                <span className="l1-field-label">3 · Returned outcome</span>
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
        </CollapsibleConceptSection>

        {/* SECTION C — TOOL EXECUTION FLOW */}
        <CollapsibleConceptSection
          stepLabel={l6SectionIntuitions.C.stepLabel}
          heading={l6SectionIntuitions.C.heading}
          headingId="l6-section-c-heading"
          intuitionTitle={l6SectionIntuitions.C.intuitionTitle}
          intuitionBody={l6SectionIntuitions.C.intuitionBody}
          isExpanded={expandedSections.C}
          onToggle={() => toggleSection("C")}
          collapsedPreviewItems={l6ExecutionFlowStages.map((s) => ({
            id: s.id,
            number: `Stage ${s.number}`,
            label: s.title,
          }))}
          onSelectCollapsedItem={(id) => {
            setSelectedFlowStageId(id);
            setFlowDetailOpen(false);
          }}
          testId="l6-section-c"
        >
          {/* Active Outcome Highlight Legend */}
          <div className="cd-flow-legend">
            <span className="cd-legend-item">
              <span className="cd-legend-swatch is-selected" />
              <span>
                Selected flow stage (Stage {selectedFlowStage.number} ·{" "}
                {selectedFlowStage.title})
              </span>
            </span>
            <span className="cd-legend-item">
              <span className="cd-legend-swatch is-outcome" />
              <span>
                Highlighted by Section B outcome ({selectedOutcome.number}.{" "}
                {selectedOutcome.title}: Stages{" "}
                {selectedOutcome.highlightedFlowStages.join(", ")})
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
                            {stage.number}. {stage.title}
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
                <span className="l1-field-label">1 · Input</span>
                <p>{selectedFlowStage.input}</p>
              </div>
              <div>
                <span className="l1-field-label">2 · Transformation</span>
                <p>{selectedFlowStage.transformation}</p>
              </div>
              <div>
                <span className="l1-field-label">3 · Output</span>
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
                        <span className="cd-lifecycle-num">{idx + 1}</span>
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
              {l6CrossLayerLinks.map((link, idx) => (
                <a
                  key={link.layerId}
                  href={`#blueprint?layer=${link.layerId}`}
                  className="cd-cross-link-card"
                  data-testid={`l6-link-to-${link.layerId}`}
                >
                  <div className="l1-dest-top">
                    <div className="cd-card-num-header">
                      <span className="cd-subbox-num">{idx + 1}</span>
                      <span className="lp-layer-id">{link.layerId}</span>
                    </div>
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
        </CollapsibleConceptSection>
      </div>
    </div>
  );
}
