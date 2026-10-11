# Security policy

## Supported versions

Security fixes are provided for the latest release on `main`.

## Reporting

Use GitHub private vulnerability reporting when the repository enables it. Otherwise contact the repository owner through their public GitHub profile without including exploit payloads or sensitive data in a public issue.

## Threat model

Reviewed packages are hostile input. The CLI therefore performs no network requests, executes no package code, rejects symbolic links, bounds file count and size, parses only a small allowlist of structured files, and redacts secret-like fields before output. Output files cannot overwrite existing files.

Residual risks include terminal rendering of attacker-controlled metadata, denial of service within the documented bounds, incomplete redaction for unusually named secret fields, and false confidence from static analysis. Run reviews in a least-privileged workspace and inspect source before use.
