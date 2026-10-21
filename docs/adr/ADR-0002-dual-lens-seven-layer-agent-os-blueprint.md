# ADR-0002: Minimalist 7-Concept Landing Overview and Detailed Blueprint Vault
Status: Accepted by owner at landing-page redesign checkpoint.
Date: 2026-10-21.
Scope: Minimalist white landing page (src/components/LandingPage.tsx) and detailed 7-Layer Agent OS Blueprint (src/components/AgentOsBlueprint.tsx) in agent-architect.
Context: Exposing the full architecture diagram, runtime simulator, code contracts, invariants, and 60s recall gate simultaneously on the home screen created high cognitive load when scanning the 7 core concepts.
Decision: Make a clean white minimalist 7-concept overview (#overview) the default home screen with persistent manual study statuses (Not started / Learning / Reviewed), linking each row to its deep-dive layer in #blueprint?layer=L1..L7.
Rejected Alternative: Reject keeping the dense split-screen blueprint as the initial landing screen or coupling manual study status to assessment-verified recall mastery.
Risk: Maintaining separate localStorage keys for manual study status and recall-verified mastery requires clear UI labels so "Reviewed" is never mistaken for verified competence.
Implementation: src/components/LandingPage.tsx, src/components/AgentOsBlueprint.tsx, src/data/agent-os-layers.ts, src/App.tsx, src/styles.css, and src/data/agent-os-layers.test.ts.
Verification: Vitest suite (63 tests across 4 files), TypeScript strict check (npm run typecheck), and production bundle build (npm run build) pass.
