# Privacy

Plugin Permission Diff processes files locally and does not transmit data. It has no telemetry, analytics, accounts, cookies, hosted service, or persistent database.

The CLI retains nothing itself. Reports exist only in terminal output or in a file the user explicitly creates with `--output`. Users control deletion of those reports. Secret-like JSON keys are redacted, but users should use only synthetic or sanitized evidence and must never include credentials, signing keys, raw prompts, or personal data.

The packaged skill instructs the model not to fetch, install, execute, connect, publish, or submit reviewed plugins. The surrounding ChatGPT/Codex host may have its own data-handling policy independent of this repository.

Privacy questions can be filed as a GitHub issue that contains no sensitive data.
