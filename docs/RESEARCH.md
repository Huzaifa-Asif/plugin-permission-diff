# Research and selection record

## Selected gap

Plugin Permission Diff addresses review of trust-boundary expansion between two plugin packages. Official OpenAI documentation makes skills, MCP configuration, optional UI, authentication, CSP/network access, lifecycle hooks, and directory metadata parts of one plugin package and requires safe, useful, complete behavior. Ordinary source diffs do not prioritize those fields or provide a stable CI policy artifact.

## Alternatives reviewed

- Manual Git diffs: free and universal, but syntax-oriented and without plugin-specific severity, secret-field redaction, or stable CI output.
- OpenAI automated submission checks: authoritative for an uploaded draft, but occur after packaging and require portal access; they are not a local before/after trust-boundary review.
- Codex Security: broader source security review; it is not a deterministic plugin-capability comparison artifact.
- OPA/Conftest and generic JSON diff tools: powerful policy engines, but require teams to author the plugin-specific extraction and policy model.

No claim is made that structural JSON diffing or policy gates are novel. The useful scope is their local, redacted application to current portable and compatibility plugin packages.

## Rejected candidates

- Generic webhook replay/failure lab: rejected after finding HookChaos, FetchSandbox, Hookdeck, and Svix overlap.
- SQLite migration rehearsal: rejected because `sqlite-rehearsal` already directly overlaps.
- Consumer contract impact and counterexample-minimization studios: retained as research leads, not started; existing oasdiff/Schemathesis and webhook tooling require deeper gap validation.

## Official sources

- https://developers.openai.com/plugins/concepts/plugins
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/plugins/guides/security-privacy
- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/deploy/app-review
- https://developers.openai.com/plugins/plugin-guidelines
