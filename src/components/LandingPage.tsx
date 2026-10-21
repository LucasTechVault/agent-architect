import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Circle, Disc } from "lucide-react";
import {
  agentOsLayers,
  CONCEPT_STUDY_STORAGE_KEY,
  conceptGroups,
  countReviewedConcepts,
  loadConceptStudyState,
  STUDY_STATUS_OPTIONS,
  type AgentOsLayer,
  type ConceptStudyState,
  type LayerId,
  type StudyStatus,
} from "../data/agent-os-layers";

function StatusIcon({ status }: { status: StudyStatus }) {
  if (status === "Reviewed") {
    return <Check size={13} aria-hidden="true" className="lp-status-icon" />;
  }
  if (status === "Learning") {
    return <Disc size={13} aria-hidden="true" className="lp-status-icon" />;
  }
  return <Circle size={12} aria-hidden="true" className="lp-status-icon" />;
}

interface ConceptRowProps {
  layer: AgentOsLayer;
  status: StudyStatus;
  onStatusChange: (id: LayerId, next: StudyStatus) => void;
}

function ConceptRow({ layer, status, onStatusChange }: ConceptRowProps) {
  const statusSlug = status.toLowerCase().replace(/\s+/g, "-");
  const detailHref = `#blueprint?layer=${layer.id}`;

  return (
    <li className="lp-concept-row" data-testid={`concept-row-${layer.id}`}>
      <a
        href={detailHref}
        className="lp-concept-main"
        aria-label={`${layer.id} ${layer.landingTitle}: ${layer.landingDescription} Open detailed material.`}
      >
        <span className="lp-layer-id">{layer.id}</span>
        <div className="lp-concept-copy">
          <span className="lp-concept-title">{layer.landingTitle}</span>
          <span className="lp-concept-desc">{layer.landingDescription}</span>
        </div>
      </a>

      <div className="lp-concept-actions">
        <div className={`lp-status-control status-${statusSlug}`}>
          <StatusIcon status={status} />
          <select
            aria-label={`Study status for ${layer.id} ${layer.landingTitle}`}
            data-testid={`status-select-${layer.id}`}
            value={status}
            onChange={(e) =>
              onStatusChange(layer.id, e.target.value as StudyStatus)
            }
          >
            {STUDY_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <a
          href={detailHref}
          className="lp-concept-open"
          aria-label={`Open ${layer.landingTitle} details`}
          title={`Open ${layer.landingTitle} in detailed blueprint`}
        >
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}

export default function LandingPage() {
  const [studyState, setStudyState] = useState<ConceptStudyState>(
    loadConceptStudyState,
  );

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

  return (
    <div className="lp-root">
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
        <section className="lp-intro" aria-labelledby="lp-heading">
          <h1 id="lp-heading">Agent architecture</h1>
          <p className="lp-subtitle">
            Track the seven concepts behind a reliable agent system.
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

        <div className="lp-groups">
          {conceptGroups.map((group) => {
            const groupLayers = group.layerIds
              .map((id) => agentOsLayers.find((l) => l.id === id))
              .filter((l): l is AgentOsLayer => Boolean(l));

            return (
              <section
                key={group.id}
                className="lp-group"
                aria-labelledby={`group-${group.id}`}
              >
                <div className="lp-group-header">
                  <h2 id={`group-${group.id}`} className="lp-group-title">
                    {group.label}
                  </h2>
                  <span className="lp-group-range">{group.rangeLabel}</span>
                </div>

                <ul className="lp-concept-list">
                  {groupLayers.map((layer) => (
                    <ConceptRow
                      key={layer.id}
                      layer={layer}
                      status={studyState[layer.id]}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
