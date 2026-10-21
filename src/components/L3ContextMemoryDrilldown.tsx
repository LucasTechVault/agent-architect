import { Fragment, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  ConceptHeroBar,
  ConceptTopHeader,
  MoreDetailDisclosure,
  StageArrowConnector,
} from "./ConceptDrilldownHeader";
import {
  l3ContextAssemblyStages,
  l3ContextSources,
  l3CrossLayerLinks,
  l3IntroStatement,
  l3OfflinePreparationStages,
  l3OnlineRetrievalStages,
  l3PipelineAccessProvenanceNote,
  l3PipelineReferenceNote,
  l3PrefixCachingNote,
  l3SharedContextPrinciple,
  type ContextSourceId,
  type PipelineStageItem,
  type RagPipelineTabId,
} from "../data/l3-context-memory";

export default function L3ContextMemoryDrilldown() {
  // Section A selection state
  const [selectedSourceId, setSelectedSourceId] =
    useState<ContextSourceId>("working-context");
  const [sourceDetailOpen, setSourceDetailOpen] = useState(false);

  // Section B pipeline tab + stage selection state
  const [activePipelineTab, setActivePipelineTab] =
    useState<RagPipelineTabId>("offline");
  const [selectedOfflineStageId, setSelectedOfflineStageId] =
    useState<string>("offline-landing");
  const [selectedOnlineStageId, setSelectedOnlineStageId] =
    useState<string>("online-request");
  const [pipelineDetailOpen, setPipelineDetailOpen] = useState(false);

  // Section C assembly stage selection state
  const [selectedAssemblyStageId, setSelectedAssemblyStageId] =
    useState<string>("assembly-select");
  const [assemblyDetailOpen, setAssemblyDetailOpen] = useState(false);

  const selectedSource =
    l3ContextSources.find((s) => s.id === selectedSourceId) ??
    l3ContextSources[0];

  const activePipelineStages: PipelineStageItem[] =
    activePipelineTab === "offline"
      ? l3OfflinePreparationStages
      : l3OnlineRetrievalStages;

  const activePipelineSelectedId =
    activePipelineTab === "offline"
      ? selectedOfflineStageId
      : selectedOnlineStageId;

  const selectedPipelineStage =
    activePipelineStages.find((s) => s.id === activePipelineSelectedId) ??
    activePipelineStages[0];

  const selectedAssemblyStage =
    l3ContextAssemblyStages.find((s) => s.id === selectedAssemblyStageId) ??
    l3ContextAssemblyStages[0];

  // Split pipeline stages into rows (Offline: 3 + 3; Online: 4 + 3)
  const pipelineRows: PipelineStageItem[][] =
    activePipelineTab === "offline"
      ? [
          l3OfflinePreparationStages.slice(0, 3),
          l3OfflinePreparationStages.slice(3, 6),
        ]
      : [
          l3OnlineRetrievalStages.slice(0, 4),
          l3OnlineRetrievalStages.slice(4, 7),
        ];

  function handleSelectPipelineStage(stageId: string) {
    if (activePipelineTab === "offline") {
      setSelectedOfflineStageId(stageId);
    } else {
      setSelectedOnlineStageId(stageId);
    }
    setPipelineDetailOpen(false);
  }

  return (
    <div
      className="lp-root l1-drilldown-root l3-drilldown-root"
      data-testid="l3-drilldown-page"
    >
      <ConceptTopHeader layerId="L3" title="Context & Memory" />

      <div className="lp-container l1-container">
        <ConceptHeroBar
          layerId="L3"
          scopeNote="Context & memory preparation"
          title="Context & Memory"
          subtitle="Prepare the right information for the next model call."
          headingId="l3-page-heading"
        />

        {/* Compact Introductory Framing */}
        <section
          className="l1-composable-banner"
          aria-label="Context and memory overview"
          data-testid="l3-intro-banner"
        >
          <p className="l1-composable-lead">{l3IntroStatement}</p>
        </section>

        {/* SECTION A — CONTEXT SOURCES */}
        <section
          className="l1-section"
          aria-labelledby="l3-section-a-heading"
          data-testid="l3-section-a"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">Section A · Context sources</span>
              <h2 id="l3-section-a-heading">
                Where does the model’s context come from?
              </h2>
            </div>
            <p className="l1-section-note">
              Select a context source to inspect its role, use case, and primary
              tradeoff.
            </p>
          </div>

          {/* 2 x 2 Selectable Card Grid */}
          <div
            className="cd-cards-grid-2x2"
            role="group"
            aria-label="Context source options"
          >
            {l3ContextSources.map((source) => {
              const isSelected = source.id === selectedSource.id;
              return (
                <button
                  key={source.id}
                  type="button"
                  data-testid={`l3-source-card-${source.id}`}
                  aria-pressed={isSelected}
                  className={`l1-choice-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    setSelectedSourceId(source.id);
                    setSourceDetailOpen(false);
                  }}
                >
                  <span className="l1-choice-title">{source.title}</span>
                  <span className="l1-choice-summary">{source.subtitle}</span>
                </button>
              );
            })}
          </div>

          {/* Single Explanation Panel beneath Section A */}
          <div
            className="l1-explanation-panel"
            role="region"
            aria-live="polite"
            data-testid="l3-section-a-explanation"
          >
            <div className="l1-explanation-head">
              <strong>{selectedSource.title}</strong>
              <span className="l1-explanation-tag">Selected context source</span>
            </div>
            <div className="l1-explanation-grid">
              <div>
                <span className="l1-field-label">Definition</span>
                <p>{selectedSource.definition}</p>
              </div>
              <div>
                <span className="l1-field-label">Suitable use case</span>
                <p>{selectedSource.useCase}</p>
              </div>
              <div>
                <span className="l1-field-label">Main tradeoff</span>
                <p>{selectedSource.tradeoff}</p>
              </div>
            </div>
            <MoreDetailDisclosure
              items={selectedSource.moreDetail}
              isOpen={sourceDetailOpen}
              onToggle={() => setSourceDetailOpen((v) => !v)}
              testId="l3-section-a-more-detail"
            />
          </div>

          {/* Shared Context Principle Supporting Note */}
          <div
            className="cd-principle-bar"
            data-testid="l3-shared-context-principle"
          >
            <span className="cd-principle-label">Shared context principle</span>
            <p>{l3SharedContextPrinciple}</p>
          </div>
        </section>

        {/* SECTION B — KNOWLEDGE PREPARATION & RETRIEVAL */}
        <section
          className="l1-section"
          aria-labelledby="l3-section-b-heading"
          data-testid="l3-section-b"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">
                Section B · Knowledge preparation &amp; retrieval
              </span>
              <h2 id="l3-section-b-heading">
                How does source information become useful evidence?
              </h2>
            </div>
            <p className="l1-section-note">{l3PipelineReferenceNote}</p>
          </div>

          {/* Two Switchable Pipeline Tabs */}
          <div className="cd-pipeline-toolbar">
            <div
              className="cd-tabs"
              role="tablist"
              aria-label="RAG pipeline views"
            >
              <button
                type="button"
                role="tab"
                id="l3-tab-offline"
                aria-selected={activePipelineTab === "offline"}
                aria-controls="l3-pipeline-panel"
                data-testid="l3-tab-offline"
                className={`cd-tab-btn ${activePipelineTab === "offline" ? "is-active" : ""}`}
                onClick={() => {
                  setActivePipelineTab("offline");
                  setPipelineDetailOpen(false);
                }}
              >
                <span>Offline preparation</span>
                <span className="cd-tab-count">6 stages</span>
              </button>
              <button
                type="button"
                role="tab"
                id="l3-tab-online"
                aria-selected={activePipelineTab === "online"}
                aria-controls="l3-pipeline-panel"
                data-testid="l3-tab-online"
                className={`cd-tab-btn ${activePipelineTab === "online" ? "is-active" : ""}`}
                onClick={() => {
                  setActivePipelineTab("online");
                  setPipelineDetailOpen(false);
                }}
              >
                <span>Online retrieval &amp; answering</span>
                <span className="cd-tab-count">7 stages</span>
              </button>
            </div>

            {/* Restrained Cross-Pipeline Access & Provenance Annotation */}
            <div
              className="cd-cross-pipeline-annotation"
              data-testid="l3-access-provenance-note"
            >
              <span className="cd-annotation-dot" aria-hidden="true" />
              <span>{l3PipelineAccessProvenanceNote}</span>
            </div>
          </div>

          {/* Active Pipeline Connected Stage Diagram */}
          <div
            id="l3-pipeline-panel"
            role="tabpanel"
            aria-labelledby={
              activePipelineTab === "offline"
                ? "l3-tab-offline"
                : "l3-tab-online"
            }
            className="cd-pipeline-diagram"
            data-testid={`l3-pipeline-${activePipelineTab}`}
          >
            {pipelineRows.map((rowStages, rowIndex) => {
              const colsClass =
                rowStages.length === 4
                  ? "cd-stage-row-4"
                  : "cd-stage-row-3";
              return (
                <Fragment key={rowIndex}>
                  {rowIndex > 0 && (
                    <div
                      className="cd-row-continuation"
                      aria-hidden="true"
                    >
                      <span>
                        ↵ Continues to stage {rowStages[0].number} ·{" "}
                        {rowStages[0].title}
                      </span>
                    </div>
                  )}
                  <div className={`cd-stage-row ${colsClass}`}>
                    {rowStages.map((stage, idx) => {
                      const isSelected = stage.id === selectedPipelineStage.id;
                      return (
                        <Fragment key={stage.id}>
                          {idx > 0 && (
                            <StageArrowConnector highlighted={isSelected} />
                          )}
                          <button
                            type="button"
                            data-testid={`l3-stage-${stage.id}`}
                            aria-pressed={isSelected}
                            className={`cd-stage-card ${isSelected ? "is-selected" : ""}`}
                            onClick={() => handleSelectPipelineStage(stage.id)}
                          >
                            <div className="cd-stage-top">
                              <span className="cd-stage-num">
                                Stage {stage.number}
                              </span>
                              {stage.handoffLabel && (
                                <span className="cd-stage-badge">
                                  {stage.handoffLabel}
                                </span>
                              )}
                            </div>
                            <strong className="cd-stage-title">
                              {stage.title}
                            </strong>
                            <span className="cd-stage-sub">
                              {stage.subtitle}
                            </span>
                          </button>
                        </Fragment>
                      );
                    })}
                  </div>
                </Fragment>
              );
            })}
          </div>

          {/* Single Explanation Panel beneath Section B (Input / Transformation / Output) */}
          <div
            className="l1-explanation-panel"
            role="region"
            aria-live="polite"
            data-testid="l3-section-b-explanation"
          >
            <div className="l1-explanation-head">
              <strong>
                Stage {selectedPipelineStage.number} ·{" "}
                {selectedPipelineStage.title}
              </strong>
              <span className="l1-explanation-tag">
                {activePipelineTab === "offline"
                  ? "Offline preparation stage"
                  : "Online retrieval & answering stage"}
              </span>
            </div>
            <div className="l1-explanation-grid">
              <div>
                <span className="l1-field-label">Input</span>
                <p>{selectedPipelineStage.input}</p>
              </div>
              <div>
                <span className="l1-field-label">Transformation</span>
                <p>{selectedPipelineStage.transformation}</p>
              </div>
              <div>
                <span className="l1-field-label">Output</span>
                <p>{selectedPipelineStage.output}</p>
              </div>
            </div>
            <MoreDetailDisclosure
              items={selectedPipelineStage.moreDetail}
              isOpen={pipelineDetailOpen}
              onToggle={() => setPipelineDetailOpen((v) => !v)}
              testId="l3-section-b-more-detail"
            />
          </div>
        </section>

        {/* SECTION C — CONTEXT ASSEMBLY */}
        <section
          className="l1-section"
          aria-labelledby="l3-section-c-heading"
          data-testid="l3-section-c"
        >
          <div className="l1-section-header">
            <div>
              <span className="l1-section-step">Section C · Context assembly</span>
              <h2 id="l3-section-c-heading">
                How is the next model context assembled?
              </h2>
            </div>
            <p className="l1-section-note">
              L3 combines selected inputs into a budgeted, role-separated
              request before handing off to L4.
            </p>
          </div>

          {/* 5-Stage Illustrative Context Assembly Flow (Row 1: 1-3, Row 2: 4-5) */}
          <div
            className="cd-pipeline-diagram"
            role="group"
            aria-label="Context assembly stages"
            data-testid="l3-assembly-diagram"
          >
            <div className="cd-stage-row cd-stage-row-3">
              {l3ContextAssemblyStages.slice(0, 3).map((stage, idx) => {
                const isSelected = stage.id === selectedAssemblyStage.id;
                return (
                  <Fragment key={stage.id}>
                    {idx > 0 && <StageArrowConnector highlighted={isSelected} />}
                    <button
                      type="button"
                      data-testid={`l3-assembly-stage-${stage.number}`}
                      aria-pressed={isSelected}
                      className={`cd-stage-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedAssemblyStageId(stage.id);
                        setAssemblyDetailOpen(false);
                      }}
                    >
                      <div className="cd-stage-top">
                        <span className="cd-stage-num">
                          Step {stage.number}
                        </span>
                        {stage.layerBadge && (
                          <span className="cd-stage-badge">
                            {stage.layerBadge}
                          </span>
                        )}
                      </div>
                      <strong className="cd-stage-title">{stage.title}</strong>
                      <span className="cd-stage-sub">{stage.subtitle}</span>
                    </button>
                  </Fragment>
                );
              })}
            </div>

            <div className="cd-row-continuation" aria-hidden="true">
              <span>↵ Continues to step 4 · Render the canonical context</span>
            </div>

            <div className="cd-stage-row cd-stage-row-2">
              {l3ContextAssemblyStages.slice(3, 5).map((stage, idx) => {
                const isSelected = stage.id === selectedAssemblyStage.id;
                return (
                  <Fragment key={stage.id}>
                    {idx > 0 && <StageArrowConnector highlighted={isSelected} />}
                    <button
                      type="button"
                      data-testid={`l3-assembly-stage-${stage.number}`}
                      aria-pressed={isSelected}
                      className={`cd-stage-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedAssemblyStageId(stage.id);
                        setAssemblyDetailOpen(false);
                      }}
                    >
                      <div className="cd-stage-top">
                        <span className="cd-stage-num">
                          Step {stage.number}
                        </span>
                        {stage.layerBadge && (
                          <span className="cd-stage-badge">
                            {stage.layerBadge}
                          </span>
                        )}
                      </div>
                      <strong className="cd-stage-title">{stage.title}</strong>
                      <span className="cd-stage-sub">{stage.subtitle}</span>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* Single Explanation Panel beneath Section C */}
          <div
            className="l1-explanation-panel"
            role="region"
            aria-live="polite"
            data-testid="l3-section-c-explanation"
          >
            <div className="l1-explanation-head">
              <strong>
                Step {selectedAssemblyStage.number} ·{" "}
                {selectedAssemblyStage.title}
              </strong>
              <span className="l1-explanation-tag">
                Context assembly step
              </span>
            </div>
            <div className="l1-explanation-grid">
              <div>
                <span className="l1-field-label">Input</span>
                <p>{selectedAssemblyStage.input}</p>
              </div>
              <div>
                <span className="l1-field-label">Transformation</span>
                <p>{selectedAssemblyStage.transformation}</p>
              </div>
              <div>
                <span className="l1-field-label">Output</span>
                <p>{selectedAssemblyStage.output}</p>
              </div>
            </div>
            <MoreDetailDisclosure
              items={selectedAssemblyStage.moreDetail}
              isOpen={assemblyDetailOpen}
              onToggle={() => setAssemblyDetailOpen((v) => !v)}
              testId="l3-section-c-more-detail"
            />
          </div>

          {/* Prefix Caching Note */}
          <div
            className="cd-principle-bar"
            data-testid="l3-prefix-caching-note"
          >
            <span className="cd-principle-label">Prefix caching boundary</span>
            <p>{l3PrefixCachingNote}</p>
          </div>

          {/* Quiet Cross-Layer Links: L2, L4, L5, L6, L7 */}
          <div className="cd-cross-links-block">
            <span className="l1-field-label">Connected layer boundaries</span>
            <div
              className="cd-cross-links-grid"
              data-testid="l3-cross-layer-links"
            >
              {l3CrossLayerLinks.map((link) => (
                <a
                  key={link.layerId}
                  href={`#blueprint?layer=${link.layerId}`}
                  className="cd-cross-link-card"
                  data-testid={`l3-link-to-${link.layerId}`}
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
