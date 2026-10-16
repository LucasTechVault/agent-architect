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
});
