import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("CLI returns policy failure without leaking secrets", async () => {
  const root = await mkdtemp(join(tmpdir(), "permission-diff-cli-"));
  const before = join(root, "before");
  const after = join(root, "after");
  await Promise.all([mkdir(before), mkdir(after)]);
  const base = { name: "x", version: "1.0.0", description: "x" };
  await writeFile(join(before, "plugin.json"), JSON.stringify(base));
  await writeFile(join(after, "plugin.json"), JSON.stringify({ ...base, version: "1.1.0" }));
  await writeFile(join(after, "permission-diff.json"), JSON.stringify({ clientSecret: "do-not-log", scopes: ["write"] }));
  const run = spawnSync(process.execPath, ["bin/plugin-permission-diff.js", before, after, "--format", "json", "--fail-on", "high"], { encoding: "utf8" });
  assert.equal(run.status, 3);
  assert.doesNotMatch(run.stdout + run.stderr, /do-not-log/);
  assert.match(run.stdout, /\[REDACTED\]/);
});
