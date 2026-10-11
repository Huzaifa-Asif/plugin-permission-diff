import { mkdir, rm, cp, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const out = "dist/plugin-permission-diff";
await rm("dist", { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of ["plugin.json", "skills", "bin", "src", "README.md", "LICENSE", "PRIVACY.md", "SECURITY.md", "SUPPORT.md", "CHANGELOG.md"]) await cp(entry, join(out, entry), { recursive: true });
const files = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) await walk(path);
    else files.push(path);
  }
}
await walk(out);
const manifest = {};
for (const file of files.sort()) manifest[file.slice(out.length + 1)] = createHash("sha256").update(await readFile(file)).digest("hex");
await writeFile("dist/SHA256SUMS.json", `${JSON.stringify(manifest, null, 2)}\n`);
