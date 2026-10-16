import type { ReactNode } from "react";
import type { Archetype } from "../data/archetypes";
import { engineeringSpecs } from "../data/engineering-specs";
import { statusOf, type Progress } from "../progress";

export interface Property {
  label: string;
  value: ReactNode;
}
export function PropertyGrid({ properties }: { properties: Property[] }) {
  return (
    <dl className="property-grid" aria-label="Engineering metadata">
      {properties.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export default function SpecProperties({
  agent,
  progress,
}: {
  agent: Archetype;
  progress: Progress;
}) {
  const spec = engineeringSpecs[agent.id];
  return (
    <PropertyGrid
      properties={[
        { label: "Module Path", value: <code>{spec.modulePath}</code> },
        { label: "Runtime Pattern", value: <code>{spec.runtimePattern}</code> },
        { label: "State Mutability", value: spec.stateMutability },
        { label: "Token Budget Tier", value: spec.tokenBudgetTier },
        { label: "Verification Gate", value: spec.verificationGate },
        {
          label: "Implementation Status",
          value: (
            <>
              <span className="implementation-tag">{spec.implementation}</span>
              <span className="property-subvalue">
                Personal record: {statusOf(agent, progress)}
              </span>
            </>
          ),
        },
      ]}
    />
  );
}
