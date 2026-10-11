import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import { createHash } from "node:crypto";

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES = 1000;
const REDACT_KEY = /(secret|token|password|private.?key|client.?secret|api.?key|authorization)/i;
const URL_RE = /https?:\/\/[^\s"'<>]+/g;

async function safeFiles(root) {
  const requested = resolve(root);
  const requestedStat = await lstat(requested);
  if (requestedStat.isSymbolicLink()) throw new Error(`${root} must not be a symbolic link`);
  const base = await realpath(requested);
  const stat = await lstat(base);
  if (!stat.isDirectory()) throw new Error(`${root} is not a directory; extract archives before review`);
  const output = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`symlinks are not allowed: ${relative(base, path)}`);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        const rel = relative(base, path);
        if (rel.startsWith(`..${sep}`) || output.length >= MAX_FILES) throw new Error("package exceeds safe file bounds");
        output.push({ path, rel: rel.replaceAll(sep, "/") });
      } else throw new Error(`unsupported file type: ${relative(base, path)}`);
    }
  }
  await walk(base);
  return { base, files: output.sort((a, b) => a.rel.localeCompare(b.rel)) };
}

async function boundedBytes(path) {
  const stat = await lstat(path);
  if (stat.size > MAX_FILE_BYTES) throw new Error(`${basename(path)} exceeds 1 MiB`);
  return readFile(path);
}

function redact(value, key = "") {
  if (REDACT_KEY.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redact(item, key));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  return value;
}

function flatten(value, prefix = "", output = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}[${index}]`, output));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) flatten(item, prefix ? `${prefix}.${key}` : key, output);
  } else output[prefix] = value;
  return output;
}

function domainSet(value) {
  const domains = new Set();
  const text = JSON.stringify(value);
  for (const match of text.matchAll(URL_RE)) {
    try { domains.add(new URL(match[0].replace(/[),.;]+$/, "")).hostname.toLowerCase()); } catch {}
  }
  return [...domains].sort();
}

function frontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const parsed = {};
  for (const line of match[1].split("\n")) {
    const index = line.indexOf(":");
    if (index > 0) parsed[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return parsed;
}

export async function snapshot(root) {
  const { files } = await safeFiles(root);
  const json = {};
  const skills = [];
  const hashes = {};
  for (const file of files) {
    const bytes = await boundedBytes(file.path);
    hashes[file.rel] = createHash("sha256").update(bytes).digest("hex");
    if (["plugin.json", ".codex-plugin/plugin.json", "mcp.json", ".mcp.json", ".app.json", "hooks/hooks.json", "permission-diff.json"].includes(file.rel)) {
      const text = bytes.toString("utf8");
      try { json[file.rel] = redact(JSON.parse(text)); }
      catch (error) { throw new Error(`${file.rel} contains malformed JSON: ${error.message}`); }
    }
    if (/^skills\/[^/]+\/SKILL\.md$/.test(file.rel)) {
      const text = bytes.toString("utf8");
      const meta = frontmatter(text);
      skills.push({ path: file.rel, name: meta.name ?? null, description: meta.description ?? null, sha256: hashes[file.rel] });
    }
  }
  const primary = json["plugin.json"] ?? json[".codex-plugin/plugin.json"] ?? null;
  if (!primary) throw new Error(`${root} has no plugin.json or .codex-plugin/plugin.json`);
  const all = { json, skills };
  return { root: basename(resolve(root)), manifest: primary, json, skills, domains: domainSet(all), hashes };
}

function severityFor(path, previous, next) {
  if (/destructiveHint/i.test(path) && next === true) return "critical";
  if (/readOnlyHint/i.test(path) && next === false) return "critical";
  if (/hooks|command|private_key_jwt/i.test(path)
    || (/(scope|capabilit|tool|name)/i.test(path) && typeof next === "string" && /(^|[.:_-])(write|delete)($|[.:_-])/i.test(next))) return "critical";
  if (/scope|auth|domain|url|csp|network|capabilit|retention|privacy/i.test(path)) return "high";
  if (/skill|tool|mcp|app/i.test(path)) return "medium";
  return "low";
}

function changes(before, after, section) {
  const a = flatten(before);
  const b = flatten(after);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  return keys.flatMap((path) => {
    if (JSON.stringify(a[path]) === JSON.stringify(b[path])) return [];
    const kind = !(path in a) ? "added" : !(path in b) ? "removed" : "changed";
    const expansion = kind === "added"
      || (typeof a[path] === "boolean" && a[path] !== b[path])
      || (typeof a[path] === "number" && typeof b[path] === "number" && b[path] > a[path]);
    return [{ section, path, kind, expansion, severity: expansion ? severityFor(path, a[path], b[path]) : "low", before: a[path] ?? null, after: b[path] ?? null }];
  });
}

function setChanges(before, after, section) {
  const a = new Set(before);
  const b = new Set(after);
  return [
    ...[...b].filter((value) => !a.has(value)).map((value) => ({ section, path: value, kind: "added", expansion: true, severity: "high", before: null, after: value })),
    ...[...a].filter((value) => !b.has(value)).map((value) => ({ section, path: value, kind: "removed", expansion: false, severity: "low", before: value, after: null }))
  ];
}

export async function analyze(beforeRoot, afterRoot) {
  const [before, after] = await Promise.all([snapshot(beforeRoot), snapshot(afterRoot)]);
  const findings = [
    ...changes(before.json, after.json, "configuration"),
    ...changes(before.skills, after.skills, "skills"),
    ...setChanges(before.domains, after.domains, "domains")
  ].sort((a, b) =>
    ({ critical: 0, high: 1, medium: 2, low: 3 })[a.severity]
      - ({ critical: 0, high: 1, medium: 2, low: 3 })[b.severity]
      || a.path.localeCompare(b.path));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    before: { root: before.root, version: before.manifest.version ?? null },
    after: { root: after.root, version: after.manifest.version ?? null },
    summary: Object.fromEntries(["critical", "high", "medium", "low"].map((level) => [level, findings.filter((f) => f.severity === level).length])),
    findings,
    limitations: ["Static local review only; remote MCP tool inventories must be exported into permission-diff.json.", "A low-severity result is not a security approval."]
  };
}

const safeDisplay = (value) => String(value)
  .replace(/[\u0000-\u001f\u007f-\u009f]/g, (character) => `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`)
  .replaceAll("`", "\\`");
const show = (value) => value === null ? "—" : `\`${safeDisplay(value)}\``;
export function formatMarkdown(report) {
  const lines = ["# Plugin permission diff", "", `Compared **${report.before.root}** (${report.before.version ?? "unknown"}) → **${report.after.root}** (${report.after.version ?? "unknown"}).`, "", `Findings: ${report.summary.critical} critical, ${report.summary.high} high, ${report.summary.medium} medium, ${report.summary.low} low.`, ""];
  if (!report.findings.length) lines.push("No packaged capability changes detected.", "");
  for (const finding of report.findings) lines.push(`- **${finding.severity.toUpperCase()}** ${finding.section}.${finding.path}: ${finding.kind}${finding.expansion ? " (expansion)" : ""}; ${show(finding.before)} → ${show(finding.after)}`);
  lines.push("", "## Limitations", "", ...report.limitations.map((item) => `- ${item}`), "");
  return `${lines.join("\n")}\n`;
}
