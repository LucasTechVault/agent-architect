import { describe, expect, it } from "vitest";
import { archetypes } from "./data/archetypes";
import { roadmapIssues } from "./data/roadmap";
import {
  completion,
  decisionKey,
  emptyProgress,
  issueStatusOf,
  milestoneKey,
  parseProgress,
  statusOf,
  STORAGE_KEY,
} from "./progress";

const agent = archetypes[0];
const milestone = milestoneKey(agent, agent.milestones[0].id);
const decision = decisionKey(agent, 0);
const issueId = roadmapIssues[0].id;

describe("progress backups", () => {
  it("round-trips v2 evidence, decisions, reflections, issues, and takeaways", () => {
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
    progress.issues[issueId] = {
      complete: true,
      evidence: "Commit def456: deterministic termination fixture passes.",
      note: "The stop reason is persisted before returning.",
    };
    progress.takeaways[agent.id] = {
      text: "One logical writer makes task-state transitions easier to replay.",
      reviewed: true,
    };

    expect(parseProgress(JSON.parse(JSON.stringify(progress)))).toEqual(
      progress,
    );
  });

  it("migrates v1 without losing existing records and keeps the storage slot", () => {
    const legacy = {
      version: 1,
      milestones: {
        [milestone]: { complete: true, evidence: "Original test output." },
      },
      decisions: {
        [decision]: { choice: "", rationale: "An unresolved trade-off." },
      },
      notes: { [agent.id]: "Original architecture reflection." },
    };

    expect(parseProgress(JSON.parse(JSON.stringify(legacy)))).toEqual({
      ...legacy,
      version: 2,
      issues: {},
      takeaways: {},
    });
    expect(STORAGE_KEY).toBe("agent-architect.progress.v1");
  });

  it("keeps imported issue and takeaway edits separate from the original backup", () => {
    const backup = emptyProgress();
    backup.issues[issueId] = {
      complete: false,
      evidence: "Draft test output.",
      note: "Initial attempt.",
    };
    backup.takeaways[agent.id] = { text: "Initial lesson.", reviewed: true };
    const edited = parseProgress(backup);

    edited.issues[issueId].note = "Revised after testing recovery.";
    edited.takeaways[agent.id] = {
      text: "A more precise lesson.",
      reviewed: false,
    };

    expect(backup.issues[issueId].note).toBe("Initial attempt.");
    expect(backup.takeaways[agent.id]).toEqual({
      text: "Initial lesson.",
      reviewed: true,
    });
    expect(parseProgress(JSON.parse(JSON.stringify(edited)))).toEqual(edited);
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
      issues: { "future-issue": null },
      takeaways: { "future-agent": { arbitrary: true } },
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
    { ...emptyProgress(), version: 3 },
    { version: 1, milestones: {}, decisions: {} },
    { ...emptyProgress(), milestones: [] },
    { ...emptyProgress(), decisions: [] },
    { ...emptyProgress(), notes: [] },
    { ...emptyProgress(), issues: [] },
    { ...emptyProgress(), takeaways: [] },
    { ...emptyProgress(), issues: undefined },
    { ...emptyProgress(), takeaways: undefined },
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

  it.each([
    null,
    { complete: "yes", evidence: "a test", note: "" },
    { complete: true, evidence: false, note: "" },
    { complete: false, evidence: "", note: null },
    { complete: true, evidence: "x".repeat(20001), note: "" },
    { complete: false, evidence: "", note: "x".repeat(20001) },
  ])("rejects malformed known issue data", (value) => {
    expect(() =>
      parseProgress({ ...emptyProgress(), issues: { [issueId]: value } }),
    ).toThrow();
  });

  it.each([
    null,
    { text: false, reviewed: false },
    { text: "A lesson", reviewed: "yes" },
    { text: "x".repeat(20001), reviewed: true },
  ])("rejects malformed known takeaways", (value) => {
    expect(() =>
      parseProgress({ ...emptyProgress(), takeaways: { [agent.id]: value } }),
    ).toThrow();
  });

  it("removes issue completion and takeaway review claims without supporting text", () => {
    const progress = parseProgress({
      ...emptyProgress(),
      issues: {
        [issueId]: {
          complete: true,
          evidence: " \n\t ",
          note: "Implementation draft.",
        },
      },
      takeaways: { [agent.id]: { text: " \n\t ", reviewed: true } },
    });

    expect(progress.issues[issueId]).toEqual({
      complete: false,
      evidence: " \n\t ",
      note: "Implementation draft.",
    });
    expect(progress.takeaways[agent.id]).toEqual({
      text: " \n\t ",
      reviewed: false,
    });
    expect(issueStatusOf(issueId, progress)).toBe("In Progress");
  });
});

describe("roadmap issue status", () => {
  it("tracks independent issue work without inferring archetype implementation", () => {
    const progress = emptyProgress();
    expect(issueStatusOf(issueId, progress)).toBe("Not Started");

    progress.issues[issueId] = {
      complete: false,
      evidence: "",
      note: "A recovery edge case remains.",
    };
    expect(issueStatusOf(issueId, progress)).toBe("In Progress");

    progress.issues[issueId] = {
      complete: true,
      evidence: "Recovery regression passes.",
      note: "",
    };
    expect(issueStatusOf(issueId, progress)).toBe("Verified");
    expect(issueStatusOf(roadmapIssues[1].id, progress)).toBe("Not Started");
    expect(statusOf(agent, progress)).toBe("Not Started");
  });
});
