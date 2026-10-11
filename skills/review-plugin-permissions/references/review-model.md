# Review model

The helper reads only regular files, rejects symbolic links, limits packages to 1,000 files and each file to 1 MiB, and never performs network requests or executes package code.

Severity is a triage signal:

- **Critical:** newly enabled destructive/write behavior, lifecycle hooks or executable commands, or private-key client authentication.
- **High:** expanded scopes, authentication, network/CSP domains, retention, privacy, or declared capabilities.
- **Medium:** added skills, tools, MCP servers, or registered apps without an immediately visible privilege marker.
- **Low:** metadata changes and removals. Removals can still be breaking changes.

## Optional evidence file

Add `permission-diff.json` to each revision when the relevant state is not represented by the portable package. This file is intentionally open-ended JSON so teams can export the same stable fields from their own tool-scan process. Recommended keys:

```json
{
  "tools": {
    "create_invoice": {
      "annotations": {
        "readOnlyHint": false,
        "destructiveHint": false,
        "openWorldHint": true
      },
      "requiredScopes": ["invoices.write"]
    }
  },
  "data": {
    "retentionDays": 7,
    "logRawPrompts": false
  },
  "ui": {
    "connectDomains": ["api.example.com"],
    "resourceDomains": ["cdn.example.com"]
  }
}
```

Do not put access tokens, client secrets, signing keys, raw prompts, or personal data in this file. Secret-like fields are redacted, but omission is safer than relying on redaction.
