import { useEffect } from "react";
import { ArrowUpRight, ChevronRight, Code2 } from "lucide-react";
import type { Archetype } from "../data/archetypes";
import { engineeringSpecs } from "../data/engineering-specs";

/** One source for full agent routes and the System map inspection pane. */
export default function EngineeringSheet({
  agent,
  compact = false,
  activeBlock,
}: {
  agent: Archetype;
  compact?: boolean;
  activeBlock?: string;
}) {
  const spec = engineeringSpecs[agent.id];
  useEffect(() => {
    if (activeBlock && !compact)
      document
        .getElementById(`spec-${agent.id}-${activeBlock}`)
        ?.scrollIntoView({ block: "start" });
  }, [agent.id, activeBlock, compact]);
  return (
    <div className={`engineering-sheet ${compact ? "compact-sheet" : ""}`}>
      <section className="spec-section mental-section">
        <div className="section-caption">
          <span>01 / MENTAL MODEL</span>
          <code>{agent.id}</code>
        </div>
        <h2>{agent.mentalModel}</h2>
        <p>{agent.purpose}</p>
        <div className="failure-line">
          <strong>Failure without this boundary</strong>
          <p>{agent.failureMode}</p>
        </div>
        <div className="authority-grid">
          <div>
            <h3>State ownership</h3>
            <ul>
              {agent.stateOwnership.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Capability lease</h3>
            <div className="tool-chips">
              {agent.allowedTools.map((t) => (
                <code key={t}>{t}</code>
              ))}
            </div>
            <h4>Denied</h4>
            <div className="tool-chips denied">
              {agent.forbiddenTools.map((t) => (
                <code key={t}>{t}</code>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="spec-section runtime-section">
        <div className="section-caption">
          <span>02 / RUNTIME & TOPOLOGY</span>
          <code>{agent.runtime}</code>
        </div>
        <p className="topology-code">
          <code>{agent.topology}</code>
        </p>
        <ol className="runtime-flow">
          {agent.flow.map((step, i) => (
            <li key={step.label}>
              <span className="flow-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <code>{step.label.toUpperCase()}</code>
                <p>{step.detail}</p>
              </div>
              {i < agent.flow.length - 1 && (
                <ChevronRight className="flow-arrow" size={13} />
              )}
            </li>
          ))}
        </ol>
        <div className="constraint-line">
          <strong>Termination invariant</strong>
          <code>{agent.loopBound}</code>
        </div>
      </section>
      <section
        className="spec-section building-blocks"
        aria-label="Nine building blocks specification"
      >
        <div className="section-caption">
          <span>03 / THE 9 BUILDING BLOCKS SPECIFICATION</span>
          <code>SPEC v{spec.version}</code>
        </div>
        <p className="spec-scope">
          Target architecture. Numeric limits and future modules are proposed
          defaults; the current kernel's guarantees are identified in each
          block.
        </p>
        <div className="block-matrix">
          {spec.blocks.map((block, i) => (
            <details
              id={`spec-${agent.id}-${block.id}`}
              className={`engineering-block ${activeBlock === block.id ? "linked-block" : ""}`}
              key={block.id}
              open={i === 0 || activeBlock === block.id}
            >
              <summary>
                <span className="block-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{block.title.replace(/^\d{2} \/ /, "")}</strong>
                  <small>{block.subtitle}</small>
                </span>
                <ChevronRight size={14} />
              </summary>
              <div className="block-body">
                <div className="block-decision">
                  <span className="field-label">DESIGN DECISION</span>
                  <p>{block.decision}</p>
                </div>
                <div className="block-columns">
                  <div>
                    <h4>Mechanics & invariants</h4>
                    <ul
                      className={
                        block.id === "budgets" || block.id === "control"
                          ? "constraint-list"
                          : ""
                      }
                    >
                      {block.mechanics.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Implementation surfaces</h4>
                    <div className="component-paths">
                      {block.implementation.map((path) => (
                        <code key={path}>{path}</code>
                      ))}
                    </div>
                    <h4>Verification</h4>
                    <p>{block.verification}</p>
                  </div>
                </div>
                {block.id === "contracts" && (
                  <div className="schema-previews">
                    <SchemaPreview
                      label="Input contract"
                      schema={spec.inputSchema}
                    />
                    <SchemaPreview
                      label="Output / handoff contract"
                      schema={spec.outputSchema}
                    />
                  </div>
                )}
                <div className="tradeoff">
                  <span className="field-label">TRADE-OFF</span>
                  <p>{block.tradeoff}</p>
                </div>
                <a
                  className="inline-link"
                  href={`#agent/${agent.id}?tab=decisions&block=${block.id}`}
                >
                  Record decision / architectural note{" "}
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
function SchemaPreview({ label, schema }: { label: string; schema: string }) {
  return (
    <details className="schema-preview">
      <summary>
        <Code2 size={13} />
        <span>{label}</span>
        <code>TypeScript</code>
        <ChevronRight size={12} />
      </summary>
      <pre>
        <code>{schema}</code>
      </pre>
    </details>
  );
}
