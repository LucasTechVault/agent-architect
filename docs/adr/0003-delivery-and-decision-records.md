# ADR 0003: Track delivery through public repositories, ADRs, and tested commits

- Date: 2026-10-16
- Status: Accepted
- Basis: User requirement for separate public repositories, concise decisions, and consistent progress history.

## Decision

Maintain independent public GitHub repositories for `agent-architect` and `agentbox-core`. Record material design decisions in numbered `docs/adr/` files with context, decision, consequences, implementation links, and verification. Identify user requirements separately from implementation defaults; supersede old decisions rather than silently rewriting their history.

Commit focused, tested milestones with conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), referencing relevant ADR IDs in commit bodies. Keep future agent instructions in `AGENTS.md`. Validate tests and production builds locally and in GitHub Actions on pushes and pull requests.

## Consequences

Git history records implementation progress; ADRs explain consequential trade-offs. This is a checkpoint practice, without scheduled or empty commits. Keep credentials, generated output, browser backups, and private evidence outside the public repositories.

## Implementation and verification

- [`AGENTS.md`](../../AGENTS.md): ongoing documentation, validation, and commit practice.
- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): Node.js 22, `npm ci`, tests, and build.
- Initial local validation: `npm test` passes 26 tests; `npm run build` succeeds. CI results are recorded by GitHub per commit.
