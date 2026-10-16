import { describe, expect, it } from "vitest";
import { archetypes } from "./data/archetypes";
import {
  completion,
  decisionKey,
  emptyProgress,
  milestoneKey,
  parseProgress,
  statusOf,
} from "./progress";

const agent = archetypes[0];
const milestone = milestoneKey(agent, agent.milestones[0].id);
const decision = decisionKey(agent, 0);

describe("progress backups", () => {
  it("round-trips evidence, an explicit decision, and a learning reflection", () => {
    const progress = emptyProgress();
    progress.milestones[milestone] = {
      complete: true,
      evidence: "Commit abc123: budget regression passes.",
    };
    progress.decisions[decision] = {
      choice: agent.decisions[0].options[0],
      rationale: "Transitions must be replayable.",
    };
    progress.notes[agent.id] =
      "A supervisor coordinates; it does not patch source files.";

    expect(parseProgress(JSON.parse(JSON.stringify(progress)))).toEqual(
      progress,
    );
  });

  it("keeps a rationale without silently choosing an architecture option", () => {
    const progress = emptyProgress();
    progress.decisions[decision] = {
      choice: "",
      rationale: "I still need to compare recovery behavior.",
    };

    expect(parseProgress(progress).decisions[decision]).toEqual(
      progress.decisions[decision],
    );
  });

  it("drops unknown keys and extra fields when importing a backup", () => {
    const parsed = parseProgress({
      ...emptyProgress(),
      milestones: {
        [milestone]: {
          complete: false,
          evidence: "Work in progress",
          hidden: true,
        },
        "future-agent:future-task": { arbitrary: "untrusted data" },
      },
      decisions: { "future-agent:0": null },
      notes: { "future-agent": { arbitrary: true } },
      unrelated: "not persisted",
    });

    expect(parsed).toEqual({
      ...emptyProgress(),
      milestones: {
        [milestone]: { complete: false, evidence: "Work in progress" },
      },
    });
  });

  it.each([
    null,
    "not an object",
    {},
    { ...emptyProgress(), version: 2 },
    { version: 1, milestones: {}, decisions: {} },
    { ...emptyProgress(), milestones: [] },
    { ...emptyProgress(), decisions: [] },
    { ...emptyProgress(), notes: [] },
  ])("rejects an incompatible or malformed backup: %j", (value) => {
    expect(() => parseProgress(value)).toThrow();
  });

  it.each([
    null,
    { complete: "yes", evidence: "a test" },
    { complete: true, evidence: 42 },
    { complete: true, evidence: "x".repeat(20001) },
  ])("rejects malformed known milestone data", (value) => {
    expect(() =>
      parseProgress({ ...emptyProgress(), milestones: { [milestone]: value } }),
    ).toThrow();
  });

  it.each([
    { choice: "An option outside the catalog", rationale: "" },
    { choice: agent.decisions[0].options[0], rationale: false },
    { choice: "", rationale: "x".repeat(20001) },
  ])("rejects a malformed decision record", (value) => {
    expect(() =>
      parseProgress({ ...emptyProgress(), decisions: { [decision]: value } }),
    ).toThrow();
  });

  it.each([false, "x".repeat(50001)])(
    "rejects malformed or oversized notes",
    (value) => {
      expect(() =>
        parseProgress({ ...emptyProgress(), notes: { [agent.id]: value } }),
      ).toThrow();
    },
  );

  it.each(["", " \n\t "])(
    "removes an imported completion claim without evidence",
    (evidence) => {
      const parsed = parseProgress({
        ...emptyProgress(),
        milestones: { [milestone]: { complete: true, evidence } },
      });

      expect(parsed.milestones[milestone]).toEqual({
        complete: false,
        evidence,
      });
      expect(completion(agent, parsed)).toBe(0);
      expect(statusOf(agent, parsed)).toBe("Not Started");
    },
  );
});

describe("archetype status", () => {
  it("starts every archetype without inferred implementation progress", () => {
    for (const archetype of archetypes) {
      expect(completion(archetype, emptyProgress())).toBe(0);
      expect(statusOf(archetype, emptyProgress())).toBe("Not Started");
    }
  });

  it("does not treat notes or architecture choices as completed engineering work", () => {
    const progress = emptyProgress();
    progress.notes[agent.id] = "I understand the topology.";
    progress.decisions[decision] = {
      choice: agent.decisions[0].options[0],
      rationale: "Replay matters.",
    };

    expect(statusOf(agent, progress)).toBe("Not Started");
  });

  it("shows evidence as work in progress before the learner verifies it", () => {
    const progress = emptyProgress();
    progress.milestones[milestone] = {
      complete: false,
      evidence: "Draft implementation in abc123.",
    };

    expect(statusOf(agent, progress)).toBe("In Progress");
    expect(completion(agent, progress)).toBe(0);
  });

  it("requires every milestone for Verified and keeps other archetypes independent", () => {
    const progress = emptyProgress();
    for (const item of agent.milestones) {
      progress.milestones[milestoneKey(agent, item.id)] = {
        complete: true,
        evidence: `Regression check: ${item.proof}`,
      };
    }

    expect(completion(agent, progress)).toBe(agent.milestones.length);
    expect(statusOf(agent, progress)).toBe("Verified");
    expect(statusOf(archetypes[1], progress)).toBe("Not Started");

    progress.milestones[milestone].complete = false;
    expect(statusOf(agent, progress)).toBe("In Progress");
  });
});
