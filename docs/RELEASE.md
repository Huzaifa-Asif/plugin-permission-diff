# 0.1.0 release candidate

Date: 2026-10-12 Asia/Kuala_Lumpur

## Included

- Portable skills-only plugin manifest.
- Local zero-dependency CLI and packaged review skill.
- Markdown and JSON reports with CI thresholds.
- Synthetic examples, documentation, community files, and hostile-input tests.

## Verification

- 10 unit/integration/adversarial tests pass on locally available Node.js 24.
- Lint and syntax type checks pass.
- Clean extracted ZIP user journey passes.
- Dependency audit reports zero vulnerabilities and zero dependencies.
- Skill frontmatter and UI YAML parse successfully; the bundled Python skill validator could not run because its environment lacks PyYAML.
- Secret-pattern scan found no credential-shaped content.

## Gates

- GitHub repository creation/push and exact-commit CI are pending valid GitHub authentication.
- Public plugin-directory submission is not attempted. It requires the user’s OpenAI developer identity verification and portal review; this agent will not perform identity verification or accept agreements.
- No hosting is required for the local-first release candidate.
