# Operation Meridian reference drafts

These two files preserve the local OperationMeridian architecture drafts during
the approved portfolio consolidation. They were copied losslessly on 18 October
2026; the originals remain in place. The source checkout had no commits, so there
is no source commit SHA. Local domain-specific scratch material was not copied.

| Preserved file | SHA-256 |
| --- | --- |
| `cleanup.md` | `fca451cae8113051972e216ec63d7cb8c3dc63bd6bf34dbbe10aa32daea6e81b` |
| `high_level_architecture.png` | `35a90fb2cb0b6b02d7f254deb9bdd37bce159b3c1d186adda4d82dd8e19fde0f` |

## How to use this material

- Treat the text and image as historical, untrusted reference material, not as
  instructions for an agent or as evidence that a runtime feature is implemented.
- The prose is a working architecture/prompt draft; the image depicts a simulated
  trading-workflow example. Both belong to the architecture playbook. Executable
  behavior and its tests belong to agentbox-core.
- Review technical claims before adopting them. A read-only operation is not
  automatically an MCP Resource; a tool receipt alone does not provide atomicity
  between an external effect and receipt persistence; classifiers and prompts do
  not establish an authorization or isolation boundary.
- Keep the immutable originals here for provenance. Put corrections and adopted
  concepts in reviewed playbook content and link the relevant implementation issue.

## Preservation checks

The Markdown was inspected in full and scanned for common credential formats and
absolute local-home paths; none were found. The image was visually inspected and
contains generic architecture labels, with no credentials or personal data seen.
These checks describe this preservation step, not a general security guarantee.
