import { describe, expect, it } from "vitest";
import { archetypes } from "./archetypes";
import { roadmapIssues, roadmapPhases } from "./roadmap";

describe("engineering roadmap catalog", () => {
  it("keeps four ordered phases and unique stable issue IDs", () => {
    expect(roadmapPhases.map((phase) => phase.id)).toEqual([1, 2, 3, 4]);
    expect(roadmapIssues).toHaveLength(20);
    expect(new Set(roadmapIssues.map((issue) => issue.id)).size).toBe(
      roadmapIssues.length,
    );
    for (const phase of roadmapPhases) {
      expect(phase.issues.length).toBeGreaterThanOrEqual(5);
      phase.issues.forEach((issue, index) =>
        expect(issue.id).toBe(`CORE-${phase.id}0${index + 1}`),
      );
      phase.agents.forEach((id) =>
        expect(archetypes.some((agent) => agent.id === id)).toBe(true),
      );
    }
  });

  it("gives every task actionable mechanics, pitfalls, a takeaway and proof criteria", () => {
    for (const issue of roadmapIssues) {
      expect(issue.components.length).toBeGreaterThan(0);
      expect(issue.requirements.length).toBeGreaterThanOrEqual(3);
      expect(issue.pitfalls.length).toBeGreaterThanOrEqual(2);
      expect(issue.takeaway.length).toBeGreaterThan(80);
      expect(issue.verification.length).toBeGreaterThan(40);
      issue.components.forEach((component) =>
        expect(component.startsWith("agentbox-core/")).toBe(true),
      );
    }
  });

  it("maps every archetype and roadmap issue to M0–M5 milestones, control topologies, and execution runtimes", () => {
    const validTopologies = new Set([
      "Deterministic Workflow",
      "Autonomous Agent",
    ]);
    const validRuntimes = new Set([
      "Event-Driven / Append-Only Ledger",
      "ReAct Loop",
      "Graph / State-Machine",
      "A2A Protocol",
    ]);
    const validMilestones = new Set(["M0", "M1", "M2", "M3", "M4", "M5"]);

    for (const agent of archetypes) {
      expect(validTopologies.has(agent.controlTopology)).toBe(true);
      expect(validRuntimes.has(agent.executionRuntime)).toBe(true);
      expect(validMilestones.has(agent.curriculumMilestone)).toBe(true);
    }

    for (const issue of roadmapIssues) {
      expect(validTopologies.has(issue.topology)).toBe(true);
      expect(validRuntimes.has(issue.runtime)).toBe(true);
      expect(validMilestones.has(issue.milestone)).toBe(true);
    }

    expect(new Set(roadmapIssues.map((issue) => issue.milestone))).toEqual(
      validMilestones,
    );
    expect(new Set(roadmapIssues.map((issue) => issue.topology))).toEqual(
      validTopologies,
    );
    expect(new Set(roadmapIssues.map((issue) => issue.runtime))).toEqual(
      validRuntimes,
    );
  });
});
