import { readdir, readFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dist = fileURLToPath(new URL("../dist", import.meta.url));
const files = await readdir(dist, { recursive: true, withFileTypes: true });
let total = 0;
for (const file of files.filter((entry) => entry.isFile())) {
  total += gzipSync(await readFile(resolve(file.parentPath, file.name))).length;
}
const line = `Gzip size: ${total.toLocaleString("en-GB")} bytes (all emitted resources, compressed independently; informational only).`;
console.log(line);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
