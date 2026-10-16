# Working in Agent Architect

This is the standalone learning application. Keep engine code and execution data in agentbox-core.

- Implement requested work, then run `npm test` and `npm run build` before committing.
- Record consequential design changes in concise, numbered `docs/adr/` records: context, decision, consequence, implementation, verification. Update the ADR index and relevant existing records. Cosmetic edits do not need an ADR.
- Distinguish user requirements, implementation defaults, and unresolved learner decisions. Never mark learning milestones complete automatically.
- Make focused commits at meaningful, tested checkpoints. Use `feat:`, `fix:`, `test:`, `docs:`, or `chore:` plus a concrete outcome; reference relevant ADR IDs in the body. Do not create empty or time-based commits.
- Inspect the diff and staged files. Do not commit credentials, browser progress backups, node_modules, or build output; do not include unrelated user changes.
- This is a public repository. Keep private learning evidence and personal data outside source control.
- Push completed requested work to the configured origin when authorized by the session. Never force-push or rewrite published history without explicit authorization.
