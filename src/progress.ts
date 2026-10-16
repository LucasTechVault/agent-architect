import { archetypes, type Archetype } from "./data/archetypes";

export type Status = "Not Started" | "In Progress" | "Verified";
export interface MilestoneProgress {
  complete: boolean;
  evidence: string;
}
export interface DecisionProgress {
  choice: string;
  rationale: string;
}
export interface Progress {
  version: 1;
  milestones: Record<string, MilestoneProgress>;
  decisions: Record<string, DecisionProgress>;
  notes: Record<string, string>;
}
export const STORAGE_KEY = "agent-architect.progress.v1";
export const emptyProgress = (): Progress => ({
  version: 1,
  milestones: {},
  decisions: {},
  notes: {},
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

/** Imported progress is untrusted: only accept known keys and well-formed values. */
export function parseProgress(value: unknown): Progress {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as Progress).version !== 1
  )
    throw new Error("Choose an Agent Architect v1 progress backup.");
  const input = value as Partial<Progress>;
  if (
    !input.milestones ||
    typeof input.milestones !== "object" ||
    Array.isArray(input.milestones) ||
    !input.decisions ||
    typeof input.decisions !== "object" ||
    Array.isArray(input.decisions) ||
    !input.notes ||
    typeof input.notes !== "object" ||
    Array.isArray(input.notes)
  )
    throw new Error("This backup is missing progress fields.");
  const result = emptyProgress();
  for (const agent of archetypes) {
    for (const m of agent.milestones) {
      const key = milestoneKey(agent, m.id),
        item = input.milestones[key];
      if (item === undefined) continue;
      if (
        !item ||
        typeof item.complete !== "boolean" ||
        typeof item.evidence !== "string" ||
        item.evidence.length > 20000
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
        item = input.decisions![key];
      if (item === undefined) return;
      if (
        !item ||
        typeof item.choice !== "string" ||
        (item.choice !== "" && !decision.options.includes(item.choice)) ||
        typeof item.rationale !== "string" ||
        item.rationale.length > 20000
      )
        throw new Error("An architecture decision is invalid.");
      result.decisions[key] = {
        choice: item.choice,
        rationale: item.rationale,
      };
    });
    const note = input.notes[agent.id];
    if (note !== undefined) {
      if (typeof note !== "string" || note.length > 50000)
        throw new Error("A learning note is invalid.");
      result.notes[agent.id] = note;
    }
  }
  return result;
}
