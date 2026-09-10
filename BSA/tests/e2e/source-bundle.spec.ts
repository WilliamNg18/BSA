import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { SOURCE_AUDIT_EXCLUSIONS, SOURCE_CLAIMS, SOURCE_DISPLAY_CLAIMS, SOURCE_DOCUMENTS } from "../../data/reference/source-audit";
import { SOURCES_FOOTER } from "../../src/lib/domain/public-facts";

// This import runs in the Node test process only, never in page.evaluate or the app.
// Scan every emitted file, not just DOM text or the initial entry chunk. This also
// catches future lazy chunks, source maps and accidentally copied source files.
const dist = fileURLToPath(new URL("../../dist/", import.meta.url));
const normalise = (text: string) => text
  .replace(/\\u\{([\da-f]+)\}|\\u([\da-f]{4})|\\x([\da-f]{2})/gi, (_, brace: string, unicode: string, hex: string) => String.fromCodePoint(parseInt(brace || unicode || hex, 16)))
  .replace(/\\[nrt]/g, " ")
  .replace(/\\(["'\\])/g, "$1")
  .replace(/\s+/g, " ").toLowerCase();

function privateMatches(text: string): string[] {
  const content = normalise(text);
  return SOURCE_AUDIT_EXCLUSIONS.flatMap(claim => [
    ...(content.includes(claim.id.toLowerCase()) ? [`${claim.id}:id`] : []),
    ...(content.includes(normalise(claim.statement)) ? [`${claim.id}:statement`] : []),
    ...claim.excerpts.flatMap((excerpt, index) => content.includes(normalise(excerpt.text)) ? [`${claim.id}:excerpt${index + 1}`] : []),
  ]);
}

test("production assets exclude private audit IDs, excerpts and author/employer context", async ({ request, baseURL }) => {
  expect(SOURCE_AUDIT_EXCLUSIONS).toHaveLength(6);
  expect(SOURCE_AUDIT_EXCLUSIONS.flatMap(claim => claim.excerpts)).toHaveLength(8);
  // Positive controls prevent a vacuous privacy test. Failure messages contain
  // identifiers only so an accidental leak is not reproduced in public reports.
  for (const claim of SOURCE_AUDIT_EXCLUSIONS) {
    expect(privateMatches(claim.id)).toContain(`${claim.id}:id`);
    claim.excerpts.forEach((excerpt, index) => {
      expect(privateMatches(excerpt.text)).toContain(`${claim.id}:excerpt${index + 1}`);
      expect(privateMatches(JSON.stringify(excerpt.text))).toContain(`${claim.id}:excerpt${index + 1}`);
    });
  }
  for (const document of SOURCE_DOCUMENTS) expect(normalise(document.filename)).toMatch(/\.pdf|\.docx/);
  const files = (await readdir(dist, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath, entry.name));
  expect(files.length).toBeGreaterThan(0);
  let servedFiles = 0;
  let servedBytes = 0;
  let publicMarkerFound = false;
  for (const file of files) {
    const assetPath = relative(dist, file).replaceAll("\\", "/");
    expect(assetPath, "Source binaries must not be published").not.toMatch(/\.(pdf|docx)$/i);
    const bytes = await readFile(file);
    for (const document of SOURCE_DOCUMENTS) expect(normalise(bytes.toString("utf8")), `No documentary filename in ${assetPath}`).not.toContain(normalise(document.filename));
    expect(privateMatches(bytes.toString("utf8")), `Emitted ${assetPath}`).toEqual([]);
    if (!/\.(?:js|css|html|json|map|txt|svg)$/i.test(assetPath)) continue;
    const response = await request.get(new URL(assetPath, baseURL).href);
    expect(response.status(), assetPath).toBe(200);
    const served = await response.body();
    expect(served.equals(bytes), `Served bytes match build: ${assetPath}`).toBe(true);
    expect(privateMatches(served.toString("utf8")), `Served ${assetPath}`).toEqual([]);
    publicMarkerFound ||= served.toString("utf8").includes(SOURCES_FOOTER);
    servedFiles++;
    servedBytes += served.length;
  }
  expect(publicMarkerFound, "The scan must include the actual client content").toBe(true);
  console.log(JSON.stringify({ emittedFilesScanned: files.length, servedFilesScanned: servedFiles, servedBytes, privateIdsChecked: 6, privateExcerptsChecked: 8, privateMatches: 0, nonPersonalClaims: SOURCE_CLAIMS.length, displayClaims: SOURCE_DISPLAY_CLAIMS.length, auditOnlyClaims: SOURCE_AUDIT_EXCLUSIONS.length }));
});
