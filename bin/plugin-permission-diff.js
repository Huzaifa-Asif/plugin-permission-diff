#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { analyze, formatMarkdown } from "../src/index.js";

function usage() {
  return `Usage: plugin-permission-diff <before-dir> <after-dir> [--format markdown|json] [--output file] [--fail-on low|medium|high|critical|never]\n`;
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.length < 2) {
  process.stdout.write(usage());
  process.exit(args.includes("--help") ? 0 : 2);
}

const before = args[0];
const after = args[1];
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index === -1 ? fallback : args[index + 1];
};

try {
  const report = await analyze(before, after);
  const format = value("--format", "markdown");
  if (!new Set(["markdown", "json"]).has(format)) throw new Error("--format must be markdown or json");
  const rendered = format === "json" ? `${JSON.stringify(report, null, 2)}\n` : formatMarkdown(report);
  const output = value("--output", null);
  if (output) await writeFile(output, rendered, { flag: "wx", mode: 0o600 });
  else process.stdout.write(rendered);

  const threshold = value("--fail-on", "never");
  const ranks = { low: 1, medium: 2, high: 3, critical: 4, never: 99 };
  if (!(threshold in ranks)) throw new Error("--fail-on must be low, medium, high, critical, or never");
  if (report.findings.some((finding) => ranks[finding.severity] >= ranks[threshold])) process.exitCode = 3;
} catch (error) {
  process.stderr.write(`plugin-permission-diff: ${error.message}\n`);
  process.exitCode = 2;
}
