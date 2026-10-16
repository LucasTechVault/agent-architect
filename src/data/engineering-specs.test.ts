import { describe, expect, it } from "vitest";
import ts from "typescript";
import { archetypes } from "./archetypes";
import { engineeringSpecs, type EngineeringBlockId } from "./engineering-specs";

const blockOrder: EngineeringBlockId[] = [
  "boundary",
  "model",
  "context",
  "tools",
  "control",
  "contracts",
  "recovery",
  "budgets",
  "evaluation",
];

/** Compile virtual files against TypeScript's real standard library; write nothing. */
function compileSchemas(
  schemas: Record<string, string>,
): readonly ts.Diagnostic[] {
  const files = new Map(
    Object.entries(schemas).map(([name, source]) => [
      `/__engineering_contracts__/${name}.ts`,
      `${source}\nexport {};\n`,
    ]),
  );
  const options: ts.CompilerOptions = {
    noEmit: true,
    strict: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    lib: ["lib.es2022.d.ts"],
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  const originalReadFile = host.readFile.bind(host);
  const originalFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) =>
    files.has(fileName) || originalFileExists(fileName);
  host.readFile = (fileName) =>
    files.get(fileName) ?? originalReadFile(fileName);
  host.getSourceFile = (
    fileName,
    languageVersion,
    onError,
    shouldCreateNewSourceFile,
  ) => {
    const source = files.get(fileName);
    return source === undefined
      ? originalGetSourceFile(
          fileName,
          languageVersion,
          onError,
          shouldCreateNewSourceFile,
        )
      : ts.createSourceFile(
          fileName,
          source,
          languageVersion,
          true,
          ts.ScriptKind.TS,
        );
  };
  host.writeFile = () => {
    throw new Error("Contract validation must not write files");
  };
  const program = ts.createProgram([...files.keys()], options, host);
  return ts.getPreEmitDiagnostics(program);
}

describe("engineering specification contracts", () => {
  it("covers each routable archetype with all nine ordered inspection blocks", () => {
    expect(Object.keys(engineeringSpecs).sort()).toEqual(
      archetypes.map((agent) => agent.id).sort(),
    );

    for (const agent of archetypes) {
      const spec = engineeringSpecs[agent.id];
      expect(
        spec.blocks.map((block) => block.id),
        agent.id,
      ).toEqual(blockOrder);
      expect(spec.version).toBe("0.2");
      for (const block of spec.blocks) {
        for (const value of [
          block.title,
          block.subtitle,
          block.decision,
          block.tradeoff,
          block.verification,
        ]) {
          expect(
            value.trim().length,
            `${agent.id}/${block.id}: empty inspection field`,
          ).toBeGreaterThan(0);
        }
        expect(
          block.mechanics.length,
          `${agent.id}/${block.id}`,
        ).toBeGreaterThan(0);
        expect(
          block.implementation.length,
          `${agent.id}/${block.id}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("keeps planned roles distinct from the shared kernel scaffold", () => {
    for (const agent of archetypes) {
      const spec = engineeringSpecs[agent.id];
      expect(spec.implementation).toBe(
        agent.id === "builder" ? "Scaffold only" : "Planned",
      );
      expect(spec.modulePath).toContain("agentbox-core/src/");
      expect(spec.modulePath).toContain("(planned)");
      for (const block of spec.blocks) {
        for (const path of block.implementation) {
          expect(path).toMatch(/^agentbox-core\/src\//);
          expect(path).toMatch(/\(planned\)|existing shared scaffold/);
        }
      }
    }
  });

  it("provides finite role limits that can be translated to kernel admission limits", () => {
    for (const agent of archetypes) {
      const block = engineeringSpecs[agent.id].blocks.find(
        (item) => item.id === "budgets",
      )!;
      const configuration = block.mechanics
        .join("\n")
        .match(/const limits = (\{[\s\S]*?\});/);
      expect(
        configuration,
        `${agent.id}: missing proposed numeric configuration`,
      ).not.toBeNull();
      const limits = JSON.parse(configuration![1]) as Record<string, unknown>;
      expect(Object.keys(limits).sort()).toEqual(
        [
          "max_steps",
          "max_tokens",
          "wall_clock_timeout_ms",
          "max_retries",
          "max_read_bytes",
        ].sort(),
      );
      for (const value of Object.values(limits)) {
        expect(Number.isSafeInteger(value)).toBe(true);
        expect(value as number).toBeGreaterThanOrEqual(0);
      }
      expect(limits.wall_clock_timeout_ms as number).toBeLessThanOrEqual(
        2_147_483_647,
      );
      expect(block.mechanics.join(" ")).toContain("not current role defaults");
      expect(block.mechanics.join(" ")).toContain("cooperative AbortSignal");
    }
  });

  it("semantically typechecks all twelve displayed input/output contracts in isolation", () => {
    const schemas = Object.fromEntries(
      archetypes.flatMap((agent) => {
        const spec = engineeringSpecs[agent.id];
        return [
          [`${agent.id}-input`, spec.inputSchema],
          [`${agent.id}-output`, spec.outputSchema],
        ];
      }),
    );
    expect(Object.keys(schemas)).toHaveLength(12);
    const diagnostics = compileSchemas(schemas);
    expect(
      diagnostics.map((diagnostic) => ({
        file: diagnostic.file?.fileName,
        code: diagnostic.code,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      })),
    ).toEqual([]);
  });

  it("retains each role's named handoff artifact in the displayed output schema", () => {
    const outputNames = {
      orchestrator: "OrchestratorOutput",
      scout: "EvidenceBundle",
      builder: "StagedPatch",
      critic: "VerificationReceipt",
      sentinel: "SentinelAlert",
      curator: "CuratedMemoryEntry",
    };
    for (const agent of archetypes) {
      const spec = engineeringSpecs[agent.id];
      expect(spec.inputSchema.trim().length).toBeGreaterThan(0);
      const output = ts.createSourceFile(
        `${agent.id}.ts`,
        spec.outputSchema,
        ts.ScriptTarget.ES2022,
        true,
      );
      const interfaces = output.statements
        .filter(ts.isInterfaceDeclaration)
        .map((statement) => statement.name.text);
      expect(interfaces, agent.id).toContain(outputNames[agent.id]);
      if (agent.id === "orchestrator")
        expect(interfaces).toContain("TaskLease");
    }
  });

  it("detects semantic errors rather than only parsing/transpiling snippets", () => {
    const diagnostics = compileSchemas({
      "unresolved-reference": "interface Input { lease: MissingTaskLease; }",
      "invalid-assignment": "const maxSteps: number = 'unbounded';",
    });
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([2304, 2322]),
    );
  });
});
