import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const hash = (data) => createHash("sha256").update(data).digest("hex");
const slug = (value) => value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
const within = (root, path) => {
  const from = relative(root, path);
  return from && from !== ".." && !from.startsWith(`..${sep}`) && !isAbsolute(from);
};

export async function exportEvidence(reportPath, outputPath) {
  const source = resolve(reportPath);
  const root = dirname(source);
  const output = resolve(outputPath);
  if (output === root || within(root, output) || within(output, root)) throw new Error("Keep exported evidence separate from its original run.");
  const raw = await readFile(source);
  const report = JSON.parse(raw);
  if (report.status !== "PASS" || report.selection !== "full" || report.runnerStatus !== "passed") {
    throw new Error("Only a complete passing run can be exported as accepted evidence; preserve failed runs separately.");
  }
  const expected = report.expectedBuildCommit;
  if (!/^[a-f0-9]{40}$/.test(expected) || new URL(report.baseURL).protocol !== "https:") throw new Error("Hosted evidence requires HTTPS and an exact source revision.");
  if (!Array.isArray(report.checklist) || !report.checklist.length || !Array.isArray(report.expectedChecklist) ||
    report.checklist.length !== report.expectedChecklist.length ||
    new Set(report.checklist.map((row) => row.checklist)).size !== report.expectedChecklist.length ||
    report.expectedChecklist.some((title) => !report.checklist.some((row) => row.checklist === title))) {
    throw new Error("The recorded check inventory is incomplete.");
  }
  const planned = [];
  const captures = [];
  const audits = [];
  const checks = [];
  const identities = [];
  for (const [index, row] of report.checklist.entries()) {
    if (row.status !== "PASS" || row.attempts?.length !== 1 || row.attempts[0].retry !== 0) throw new Error("Export cannot hide failed or retried checks.");
    const folder = `check-${String(index + 1).padStart(2, "0")}`;
    const artifacts = [];
    for (const [number, artifact] of row.artifacts.entries()) {
      const original = resolve(artifact.path);
      if (!within(root, original)) throw new Error("An artifact escaped the original run directory.");
      const data = await readFile(original);
      const extension = original.endsWith(".png") ? ".png" : original.endsWith(".json") ? ".json" : ".bin";
      const file = `${folder}/${String(number + 1).padStart(2, "0")}-${slug(artifact.name)}${extension}`;
      planned.push({ original, destination: join(output, ...file.split("/")) });
      artifacts.push({ name: artifact.name, file, sha256: hash(data), bytes: data.length });
    }
    for (const phase of ["before", "after"]) {
      const identity = row.evidence.find((entry) => entry.name === `identity-${phase}`)?.value;
      if (identity?.commit !== expected || identity?.dirty !== false) throw new Error("Every check needs matching clean before/after identities.");
      identities.push({ check: row.checklist, phase, ...identity });
    }
    for (const entry of row.evidence) {
      if (entry.name.startsWith("view-")) {
        const view = entry.value;
        const image = artifacts.find((artifact) => artifact.name === view.screenshot && artifact.file.endsWith(".png"));
        if (!image || image.sha256 !== view.sha256 || view.applicationSourceRevision !== expected ||
          view.sourceDirty !== false || view.kind !== "live view") throw new Error("A captured view has invalid source or image identity.");
        captures.push({ check: row.checklist, ...view, image: image.file });
      }
      if (entry.name.startsWith("axe-")) {
        if (entry.value.violations.length) throw new Error("Axe violations cannot be exported as passing acceptance.");
        audits.push({ check: row.checklist, ...entry.value, artifact: artifacts.find((artifact) => artifact.name === entry.name)?.file });
      }
    }
    checks.push({ title: row.checklist, status: row.status, startedAt: row.startedAt, durationMs: row.durationMs, artifacts });
  }
  if (!captures.length || !audits.length) throw new Error("Capture and audit evidence are required.");
  await mkdir(output, { recursive: false });
  for (const file of planned) {
    await mkdir(dirname(file.destination), { recursive: true });
    await copyFile(file.original, file.destination);
  }
  await writeFile(join(output, "original-checklist.json"), raw);
  const manifest = {
    kind: "source-pinned hosted functional acceptance evidence",
    applicationSourceRevision: expected, captureSourceRevisions: [...new Set(captures.map((view) => view.sourceRevision))],
    baseURL: report.baseURL, startedAt: report.startedAt, finishedAt: report.finishedAt,
    originalReportSha256: hash(raw), exportedAt: new Date().toISOString(),
    status: report.status, visualReview: "pending",
    counts: {
      checks: checks.length, identities: identities.length, images: captures.length,
      offImages: captures.filter((view) => !view.agentEnabled).length, onImages: captures.filter((view) => view.agentEnabled).length,
      audits: audits.length, offAudits: audits.filter((audit) => !audit.agentEnabled).length,
      onAudits: audits.filter((audit) => audit.agentEnabled).length, violations: 0,
      incompleteAudits: audits.filter((audit) => audit.incomplete.length).length,
    },
    identities, checks, captures, audits,
  };
  await writeFile(join(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 4) throw new Error("Usage: node export-evidence.mjs <original checklist.json> <new output directory>");
  const manifest = await exportEvidence(process.argv[2], process.argv[3]);
  console.log(JSON.stringify(manifest.counts));
}
