import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Disc,
} from "lucide-react";
import {
  CONCEPT_STUDY_STORAGE_KEY,
  loadConceptStudyState,
  STUDY_STATUS_OPTIONS,
  type ConceptStudyState,
  type LayerId,
  type StudyStatus,
} from "../data/agent-os-layers";

export function StatusIcon({ status }: { status: StudyStatus }) {
  if (status === "Reviewed") {
    return <Check size={12} aria-hidden="true" className="lp-status-icon" />;
  }
  if (status === "Learning") {
    return <Disc size={12} aria-hidden="true" className="lp-status-icon" />;
  }
  return <Circle size={11} aria-hidden="true" className="lp-status-icon" />;
}

export function useConceptLayerStatus(layerId: LayerId) {
  const [studyState, setStudyState] = useState<ConceptStudyState>(
    loadConceptStudyState,
  );
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

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

  const currentStatus = studyState[layerId];
  function handleStatusChange(next: StudyStatus) {
    setStudyState((prev) => ({
      ...prev,
      [layerId]: next,
    }));
  }

  return {
    currentStatus,
    statusMenuOpen,
    setStatusMenuOpen,
    handleStatusChange,
  };
}

export function ConceptTopHeader({
  layerId,
  title,
}: {
  layerId: LayerId;
  title: string;
}) {
  const lowerId = layerId.toLowerCase();
  return (
    <header className="lp-header" role="banner">
      <div className="lp-header-inner">
        <div className="l1-header-left">
          <a
            href="#overview"
            className="l1-back-link"
            data-testid={`${lowerId}-back-overview`}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Agent architecture</span>
          </a>
          <span className="l1-header-divider" aria-hidden="true">
            /
          </span>
          <span className="l1-header-current">
            {layerId} · {title}
          </span>
        </div>

        <nav className="lp-nav" aria-label="Primary navigation">
          <a
            href={`#blueprint?layer=${layerId}&view=reference`}
            className="lp-nav-primary"
            data-testid={`${lowerId}-deep-reference-link`}
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
  );
}

export function ConceptHeroBar({
  layerId,
  scopeNote,
  title,
  subtitle,
  headingId,
}: {
  layerId: LayerId;
  scopeNote: string;
  title: string;
  subtitle: string;
  headingId: string;
}) {
  const {
    currentStatus,
    statusMenuOpen,
    setStatusMenuOpen,
    handleStatusChange,
  } = useConceptLayerStatus(layerId);
  const statusSlug = currentStatus.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="l1-hero-bar">
      <div className="l1-hero-copy">
        <div className="l1-eyebrow-row">
          <span className="lp-layer-id">{layerId}</span>
          <span className="lp-scope-note">{scopeNote}</span>
        </div>
        <h1 id={headingId}>{title}</h1>
        <p className="lp-subtitle">{subtitle}</p>
      </div>

      <div className="lp-status-wrapper">
        <button
          type="button"
          className={`lp-status-pill status-${statusSlug}`}
          aria-label={`Study status for ${layerId} ${title}: ${currentStatus}. Activate to change status.`}
          aria-haspopup="listbox"
          aria-expanded={statusMenuOpen}
          data-testid={`status-trigger-${layerId}`}
          onClick={() => setStatusMenuOpen((v) => !v)}
        >
          <StatusIcon status={currentStatus} />
          <span>{currentStatus}</span>
        </button>

        <select
          className="sr-only"
          tabIndex={-1}
          aria-label={`Set study status for ${layerId} ${title}`}
          data-testid={`status-select-${layerId}`}
          value={currentStatus}
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
            aria-label={`Select study status for ${title}`}
          >
            {STUDY_STATUS_OPTIONS.map((option) => {
              const selected = option === currentStatus;
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
  );
}

export function MoreDetailDisclosure({
  items,
  isOpen,
  onToggle,
  testId,
}: {
  items: string[];
  isOpen: boolean;
  onToggle: () => void;
  testId?: string;
}) {
  if (!items.length) return null;
  return (
    <div className="cd-more-detail">
      <button
        type="button"
        className="cd-more-detail-trigger"
        aria-expanded={isOpen}
        data-testid={testId}
        onClick={onToggle}
      >
        {isOpen ? (
          <ChevronDown size={14} aria-hidden="true" />
        ) : (
          <ChevronRight size={14} aria-hidden="true" />
        )}
        <span>More detail</span>
      </button>
      {isOpen && (
        <ul className="cd-more-detail-list">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StageArrowConnector({
  highlighted = false,
}: {
  highlighted?: boolean;
}) {
  return (
    <div
      className={`cd-stage-conn ${highlighted ? "is-highlighted" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 20" className="cd-svg-arrow">
        <line
          x1="2"
          y1="10"
          x2="29"
          y2="10"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M24 5 L31 10 L24 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

