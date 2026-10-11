# Plugin Permission Diff

Plugin Permission Diff is a local-first, skills-based ChatGPT/Codex plugin and zero-dependency CLI for reviewing capability expansion between two extracted plugin revisions. It turns manifest changes into an evidence-linked review of authentication scopes, network/CSP domains, declared capabilities, hooks, skills, MCP configuration, privacy fields, and optional remote-tool scan evidence.

It does not install or execute the reviewed plugin, contact its MCP servers, upload files, or make a security-approval claim.

## Why this exists

Plugin updates can change more than version metadata. A new scope, lifecycle hook, CSP domain, write tool, or retention period changes the user’s trust boundary. Generic text diffs show syntax; this tool prioritizes those capability changes, redacts secret-like fields, and emits stable JSON suitable for CI policy checks.

## Quick start

Requirements: Node.js 20 or newer. There are no runtime dependencies and no install step.

```sh
node bin/plugin-permission-diff.js ./old-plugin ./new-plugin
node bin/plugin-permission-diff.js ./old-plugin ./new-plugin --format json --fail-on high
```

Archives must be extracted first. Both directories must contain `plugin.json` or `.codex-plugin/plugin.json`.

To make the packaged skill discoverable in a repository, add this repository as a local marketplace or copy the plugin folder beneath your repository’s `plugins/` directory and point `.agents/plugins/marketplace.json` at it. See the [official packaging guide](https://developers.openai.com/plugins/build/plugins) for current client setup.

## CLI API

```text
plugin-permission-diff <before-dir> <after-dir>
  [--format markdown|json]
  [--output new-file]
  [--fail-on low|medium|high|critical|never]
```

- Exit `0`: review completed and no finding met the configured threshold.
- Exit `2`: invalid input, unsafe package shape, malformed data, or usage error.
- Exit `3`: review completed and at least one finding met the configured threshold.
- `--output` uses exclusive creation and mode `0600`; it will not overwrite a file.

For remote tool inventories or review-portal exports, add a sanitized `permission-diff.json` to each revision. See [the review model](skills/review-plugin-permissions/references/review-model.md).

## What is reviewed

- Portable and compatibility manifests.
- `mcp.json`, `.mcp.json`, `.app.json`, lifecycle-hook configuration, and the optional evidence file.
- Skill inventory and frontmatter hashes.
- Added URL hostnames found in reviewed structured data.
- Secret-like fields, which are replaced with `[REDACTED]` before comparison or output.

## Security and privacy boundaries

The CLI reads only local regular files. It rejects symbolic links, caps packages at 1,000 files, caps each file at 1 MiB, performs no network requests, and never executes reviewed code. Package text is untrusted data, including skill instructions. See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md).

## Accessibility

Output is plain Markdown or structured JSON, uses text labels in addition to severity ordering, and does not rely on color, animation, pointing devices, or visual layout. Reports work with terminals and screen readers.

## User journey

1. Export or extract the trusted released plugin and proposed plugin.
2. Run a Markdown review for human inspection.
3. Add sanitized runtime evidence only when package files do not describe it.
4. Run JSON mode in CI with an agreed threshold.
5. Resolve or explicitly accept each expansion outside this tool; the tool never grants approval.

## Limitations

- Static package review cannot prove server-side authorization, runtime tool behavior, deployed endpoint identity, or privacy-policy truthfulness.
- Severity is deterministic triage, not a vulnerability rating.
- Array reordering may appear as changes because position is significant.
- Removed capabilities are marked low severity even when they may be breaking.
- ZIP ingestion, remote fetching, authentication, deployment, and directory submission are intentionally out of scope.

## Troubleshooting

- **No manifest:** confirm the extracted root contains `plugin.json` or `.codex-plugin/plugin.json`.
- **Symlink rejected:** copy the real file into an isolated review directory; links are rejected to prevent path escape.
- **Malformed JSON:** validate the named configuration file before rerunning.
- **CI exited 3:** the comparison succeeded; inspect findings at or above `--fail-on`.
- **Missing remote tools:** export a sanitized, stable summary into `permission-diff.json`.

## Development

```sh
npm test
npm run check
```

The build creates `dist/plugin-permission-diff/` plus a deterministic JSON map of SHA-256 file hashes. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Support and licensing

See [SUPPORT.md](SUPPORT.md) for help, [SECURITY.md](SECURITY.md) for vulnerability reports, and [LICENSE](LICENSE) for the MIT license.
