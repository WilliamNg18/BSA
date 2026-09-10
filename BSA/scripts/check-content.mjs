import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// All src bytes and paths, not just rendered UI; documentary attribution is offline.
export const forbiddenContent = /source\s*:|[^\s"'<>]+\.(?:pdf|docx?)\b|William\s+Ng|Embrace\s+the\s+Change|nhsbsa[-\s]+FINAL[-\s]+complete[-\s]+pack|How we process prescriptions|Pharmacy payment timetable|Referred back and disallowed items|Community Pharmacy England Pressures Survey|source-audit|source-claims|data[\\/]reference/i;
export function contentLeaks(text) { return forbiddenContent.test(text); }

export async function scanClient(root = new URL("../src/", import.meta.url)) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());
  const failures = [];
  for (const entry of files) {
    const path = `${entry.parentPath}/${entry.name}`;
    if (contentLeaks(path) || contentLeaks(await readFile(path, "utf8"))) failures.push(path);
  }
  return { files: files.length, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const control of ["SOURCE: hidden", "notes.PDF", "private.DocX", "How we process prescriptions", "../data/reference/audit"]) {
    if (!contentLeaks(control)) throw new Error("Content scan positive control failed");
  }
  const result = await scanClient();
  console.log(JSON.stringify(result));
  if (result.failures.length) process.exitCode = 1;
}