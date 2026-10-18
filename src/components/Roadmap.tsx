import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  Search,
} from "lucide-react";
import { archetypes } from "../data/archetypes";
import { roadmapPhases, type RoadmapIssue } from "../data/roadmap";
import type { Progress } from "../progress";

interface RoadmapProps {
  progress: Progress;
  setProgress: Dispatch<SetStateAction<Progress>>;
}

type IssueRecord = { complete: boolean; evidence: string; note: string };
type IssueFilter = "all" | "open" | "evidence" | "complete";
const emptyIssue: IssueRecord = { complete: false, evidence: "", note: "" };
const hasReceipt = (record: IssueRecord) => Boolean(record.evidence.trim());
const isComplete = (record: IssueRecord) =>
  record.complete && hasReceipt(record);

export default function Roadmap({ progress, setProgress }: RoadmapProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [openPhases, setOpenPhases] = useState<Record<number, boolean>>({});
  const [openIssues, setOpenIssues] = useState<Record<string, boolean>>({
    "CORE-101": true,
  });

  const visiblePhases = useMemo(() => {
    const search = query.trim().toLowerCase();
    return roadmapPhases.map((phase) => ({
      ...phase,
      visibleIssues: phase.issues.filter((issue) => {
        const record = progress.issues[issue.id] ?? emptyIssue;
        const matchesFilter =
          filter === "all" ||
          (filter === "open" && !isComplete(record)) ||
          (filter === "evidence" && hasReceipt(record)) ||
          (filter === "complete" && isComplete(record));
        const text = [
          issue.id,
          issue.title,
          issue.milestone,
          issue.topology,
          issue.runtime,
          ...issue.components,
          ...issue.requirements,
          ...issue.pitfalls,
          issue.takeaway,
          issue.verification,
          record.note,
          record.evidence,
        ]
          .join(" ")
          .toLowerCase();
        return matchesFilter && (!search || text.includes(search));
      }),
    }));
  }, [query, filter, progress.issues]);

  function updateIssue(id: string, patch: Partial<IssueRecord>) {
    setProgress((current) => {
      const next = { ...(current.issues[id] ?? emptyIssue), ...patch };
      next.complete = next.complete && hasReceipt(next);
      return { ...current, issues: { ...current.issues, [id]: next } };
    });
  }

  function toggleIssue(id: string) {
    setOpenIssues((current) => ({ ...current, [id]: !current[id] }));
  }

  const matchingCount = visiblePhases.reduce(
    (sum, phase) => sum + phase.visibleIssues.length,
    0,
  );
  const isFiltering = Boolean(query.trim()) || filter !== "all";

  return (
    <div className="vault-roadmap">
      <div className="roadmap-tools">
        <label className="roadmap-search">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Search engineering issues</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpenPhases({});
            }}
            placeholder="Search issue, component, requirement or evidence…"
            type="search"
          />
        </label>
        <label className="roadmap-filter">
          <span>Show</span>
          <select
            aria-label="Filter engineering issues"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as IssueFilter);
              setOpenPhases({});
            }}
          >
            <option value="all">All issues</option>
            <option value="open">Open issues</option>
            <option value="evidence">With evidence</option>
            <option value="complete">Completed</option>
          </select>
        </label>
        <span className="roadmap-result-count" aria-live="polite">
          {matchingCount} issues
        </span>
      </div>

      <p className="roadmap-scope-note">
        <code>(planned)</code> marks future engine modules. Existing scaffolding
        stays open until you record implementation evidence.
      </p>

      {visiblePhases.map((phase) => {
        const phaseOpen =
          openPhases[phase.id] ?? (isFiltering || phase.id === 1);
        const completed = phase.issues.filter((issue) =>
          isComplete(progress.issues[issue.id] ?? emptyIssue),
        ).length;
        const agentNames = phase.agents.map(
          (id) => archetypes.find((agent) => agent.id === id)?.shortName ?? id,
        );
        return (
          <section
            className="phase-ledger"
            key={phase.id}
            aria-labelledby={`phase-${phase.id}-title`}
          >
            <button
              className="phase-ledger-header"
              type="button"
              aria-expanded={phaseOpen}
              aria-controls={`phase-${phase.id}-body`}
              onClick={() =>
                setOpenPhases((current) => ({
                  ...current,
                  [phase.id]: !phaseOpen,
                }))
              }
            >
              {phaseOpen ? (
                <ChevronDown size={16} aria-hidden="true" />
              ) : (
                <ChevronRight size={16} aria-hidden="true" />
              )}
              <span className="phase-number">
                PHASE {String(phase.id).padStart(2, "0")}
              </span>
              <span className="phase-ledger-heading">
                <strong id={`phase-${phase.id}-title`}>{phase.title}</strong>
                <span>{phase.subtitle}</span>
              </span>
              <span className="phase-agent-list">{agentNames.join(" / ")}</span>
              <span className="phase-completion">
                {completed}/{phase.issues.length} complete
              </span>
            </button>
            {phaseOpen && (
              <div className="phase-ledger-body" id={`phase-${phase.id}-body`}>
                {phase.visibleIssues.length === 0 ? (
                  <p className="issue-empty">
                    No issues in this phase match the current filter.
                  </p>
                ) : (
                  phase.visibleIssues.map((issue) => {
                    const record = progress.issues[issue.id] ?? emptyIssue;
                    return (
                      <Issue
                        key={issue.id}
                        issue={issue}
                        record={record}
                        expanded={Boolean(openIssues[issue.id])}
                        onToggle={() => toggleIssue(issue.id)}
                        onUpdate={(patch) => updateIssue(issue.id, patch)}
                        onEvidence={() =>
                          setOpenIssues((current) => ({
                            ...current,
                            [issue.id]: true,
                          }))
                        }
                      />
                    );
                  })
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Issue({
  issue,
  record,
  expanded,
  onToggle,
  onUpdate,
  onEvidence,
}: {
  issue: RoadmapIssue;
  record: IssueRecord;
  expanded: boolean;
  onToggle(): void;
  onUpdate(patch: Partial<IssueRecord>): void;
  onEvidence(): void;
}) {
  const receipt = hasReceipt(record);
  const complete = isComplete(record);
  const status = complete
    ? "Complete"
    : receipt || record.note.trim()
      ? "In progress"
      : "Open";

  return (
    <article
      className={`issue-row${complete ? " issue-complete" : ""}${expanded ? " issue-expanded" : ""}`}
    >
      <div className="issue-summary">
        <label
          className="issue-checkbox"
          title={
            receipt
              ? "Record issue completion"
              : "Add verification evidence before marking complete"
          }
        >
          <input
            type="checkbox"
            checked={complete}
            disabled={!receipt}
            onChange={(event) => onUpdate({ complete: event.target.checked })}
            aria-label={`Mark ${issue.id} complete`}
          />
          <span aria-hidden="true">{complete && <Check size={12} />}</span>
        </label>
        <button
          className="issue-toggle"
          onClick={onToggle}
          type="button"
          aria-expanded={expanded}
          aria-controls={`${issue.id}-details`}
        >
          {expanded ? (
            <ChevronDown size={14} aria-hidden="true" />
          ) : (
            <ChevronRight size={14} aria-hidden="true" />
          )}
          <code className="issue-id">{issue.id}</code>
          <span className="issue-title" id={`${issue.id}-title`}>
            {issue.title}
          </span>
        </button>
        <span
          className={`issue-status ${complete ? "is-complete" : receipt || record.note.trim() ? "is-active" : "is-open"}`}
        >
          {status}
        </span>
        <button
          className={`issue-evidence-toggle${receipt ? " has-evidence" : ""}`}
          onClick={onEvidence}
          type="button"
          aria-label={`${receipt ? "View" : "Add"} verification evidence for ${issue.id}`}
        >
          <FileCheck2 size={14} aria-hidden="true" />
          <span>{receipt ? "Evidence" : "Add proof"}</span>
        </button>
      </div>
      <div className="issue-components" aria-label="Target engine components">
        <code>{issue.milestone}</code>
        <code>{issue.topology}</code>
        <code>{issue.runtime}</code>
        {issue.components.map((component) => (
          <code key={component}>{component}</code>
        ))}
      </div>

      {expanded && (
        <div
          className="issue-details"
          id={`${issue.id}-details`}
          role="region"
          aria-labelledby={`${issue.id}-title`}
        >
          <div className="issue-spec-grid">
            <section className="issue-requirements">
              <h3>Implementation requirements</h3>
              <ul>
                {issue.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </section>
            <section className="issue-pitfalls">
              <h3>Engineering pitfalls</h3>
              <ul>
                {issue.pitfalls.map((pitfall) => (
                  <li key={pitfall}>{pitfall}</li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="issue-takeaway">
            <span className="section-index">WHY WE BUILD THIS</span>
            <h3>Core architectural takeaway</h3>
            <p>{issue.takeaway}</p>
          </aside>
          <div className="issue-record-grid">
            <label className="issue-receipt" htmlFor={`${issue.id}-evidence`}>
              <span>Verification receipt</span>
              <small>{issue.verification}</small>
              <textarea
                id={`${issue.id}-evidence`}
                value={record.evidence}
                onChange={(event) => onUpdate({ evidence: event.target.value })}
                maxLength={20_000}
                rows={3}
                placeholder="Commit SHA, test path + result, or PR URL…"
              />
              <small className="issue-receipt-status">
                {receipt
                  ? "Evidence recorded. Completion is your explicit confirmation."
                  : "Add evidence to enable the completion checkbox."}
              </small>
            </label>
            <label className="issue-note" htmlFor={`${issue.id}-note`}>
              <span>Implementation notes & reflection</span>
              <small>
                Capture the decision, what failed, and what changed your
                understanding.
              </small>
              <textarea
                id={`${issue.id}-note`}
                value={record.note}
                onChange={(event) => onUpdate({ note: event.target.value })}
                maxLength={20_000}
                rows={3}
                placeholder="Trade-off, unresolved question, or lesson from implementation…"
              />
            </label>
          </div>
        </div>
      )}
    </article>
  );
}
