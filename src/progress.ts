import { archetypes, type Archetype } from "./data/archetypes";
import { roadmapIssues } from "./data/roadmap";

export type Status = "Not Started" | "In Progress" | "Verified";
export interface MilestoneProgress {
  complete: boolean;
  evidence: string;
}
export interface DecisionProgress {
  choice: string;
  rationale: string;
}
export interface IssueProgress {
  complete: boolean;
  evidence: string;
  note: string;
}
export interface TakeawayProgress {
  text: string;
  reviewed: boolean;
}
export interface Progress {
  version: 2;
  milestones: Record<string, MilestoneProgress>;
  decisions: Record<string, DecisionProgress>;
  notes: Record<string, string>;
  issues: Record<string, IssueProgress>;
  takeaways: Record<string, TakeawayProgress>;
}
// Keep the existing storage slot: parseProgress migrates its versioned payload.
export const STORAGE_KEY = "agent-architect.progress.v1";
export const emptyProgress = (): Progress => ({
  version: 2,
  milestones: {},
  decisions: {},
  notes: {},
  issues: {},
  takeaways: {},
});
export const milestoneKey = (agent: Archetype, id: string) =>
  `${agent.id}:${id}`;
export const decisionKey = (agent: Archetype, index: number) =>
  `${agent.id}:${index}`;
export function completion(agent: Archetype, progress: Progress) {
  return agent.milestones.filter(
    (m) => progress.milestones[milestoneKey(agent, m.id)]?.complete,
  ).length;
}
export function statusOf(agent: Archetype, progress: Progress): Status {
  const count = completion(agent, progress);
  if (count === agent.milestones.length && count > 0) return "Verified";
  return count > 0 ||
    agent.milestones.some((m) =>
      progress.milestones[milestoneKey(agent, m.id)]?.evidence.trim(),
    )
    ? "In Progress"
    : "Not Started";
}

export function issueStatusOf(id: string, progress: Progress): Status {
  const issue = progress.issues[id];
  if (issue?.complete) return "Verified";
  return issue?.evidence.trim() || issue?.note.trim()
    ? "In Progress"
    : "Not Started";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown, limit = 20000): value is string {
  return typeof value === "string" && value.length <= limit;
}

/** Imported progress is untrusted: only accept known keys and well-formed values. */
export function parseProgress(value: unknown): Progress {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2))
    throw new Error("Choose an Agent Architect v1 or v2 progress backup.");
  const { milestones, decisions, notes } = value;
  if (!isRecord(milestones) || !isRecord(decisions) || !isRecord(notes))
    throw new Error("This backup is missing progress fields.");
  const result = emptyProgress();
  for (const agent of archetypes) {
    for (const m of agent.milestones) {
      const key = milestoneKey(agent, m.id),
        item = milestones[key];
      if (item === undefined) continue;
      if (
        !isRecord(item) ||
        typeof item.complete !== "boolean" ||
        !isText(item.evidence)
      )
        throw new Error("A milestone entry is invalid.");
      // Evidence is required for a verified milestone, including imported entries.
      result.milestones[key] = {
        complete: item.complete && !!item.evidence.trim(),
        evidence: item.evidence,
      };
    }
    agent.decisions.forEach((decision, i) => {
      const key = decisionKey(agent, i),
        item = decisions[key];
      if (item === undefined) return;
      if (
        !isRecord(item) ||
        typeof item.choice !== "string" ||
        (item.choice !== "" && !decision.options.includes(item.choice)) ||
        !isText(item.rationale)
      )
        throw new Error("An architecture decision is invalid.");
      result.decisions[key] = {
        choice: item.choice,
        rationale: item.rationale,
      };
    });
    const note = notes[agent.id];
    if (note !== undefined) {
      if (!isText(note, 50000)) throw new Error("A learning note is invalid.");
      result.notes[agent.id] = note;
    }
  }
  if (value.version === 2) {
    const { issues, takeaways } = value;
    if (!isRecord(issues) || !isRecord(takeaways))
      throw new Error("This v2 backup is missing issue or takeaway fields.");
    for (const issue of roadmapIssues) {
      const item = issues[issue.id];
      if (item === undefined) continue;
      if (
        !isRecord(item) ||
        typeof item.complete !== "boolean" ||
        !isText(item.evidence) ||
        !isText(item.note)
      )
        throw new Error("A roadmap issue is invalid.");
      result.issues[issue.id] = {
        complete: item.complete && !!item.evidence.trim(),
        evidence: item.evidence,
        note: item.note,
      };
    }
    for (const agent of archetypes) {
      const item = takeaways[agent.id];
      if (item === undefined) continue;
      if (
        !isRecord(item) ||
        !isText(item.text) ||
        typeof item.reviewed !== "boolean"
      )
        throw new Error("An architecture takeaway is invalid.");
      result.takeaways[agent.id] = {
        text: item.text,
        reviewed: item.reviewed && !!item.text.trim(),
      };
    }
  }
  return result;
}
