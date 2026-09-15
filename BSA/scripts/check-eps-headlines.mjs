import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const retiredPattern = /\b(?:missing[\s-]+(?:the\s+)?date|not\s+dated)\b/gi;

export function scanEpsHeadlines(path, text) {
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const allowed = [];
  if (path.replaceAll("\\", "/") === "src/lib/domain/tariff.ts") {
    function visit(node) {
      if (ts.isObjectLiteralExpression(node)) {
        const property = (name) => node.properties.find((entry) =>
          ts.isPropertyAssignment(entry) && entry.name.getText(file) === name);
        const id = property("id"), type = property("endorsementType"), requirements = property("requirements"), content = property("text");
        if (id && ts.isStringLiteral(id.initializer) && id.initializer.text === "P2-C9" &&
          type && ts.isStringLiteral(type.initializer) && type.initializer.text === "NCSO" &&
          requirements && content) {
          allowed.push([content.initializer.getStart(file), content.initializer.getEnd()]);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
  }
  return [...text.matchAll(retiredPattern)].flatMap((match) => {
    if (allowed.some(([start, end]) => match.index >= start && match.index < end)) return [];
    const { line, character } = file.getLineAndCharacterOfPosition(match.index);
    return [{ path, line: line + 1, column: character + 1, text: match[0] }];
  });
}

export async function checkEpsHeadlines(root) {
  const findings = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
        findings.push(...scanEpsHeadlines(relative(root, path), await readFile(path, "utf8")));
      }
    }
  }
  await walk(resolve(root, "src"));
  return findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const findings = await checkEpsHeadlines(fileURLToPath(new URL("..", import.meta.url)));
  for (const finding of findings) console.error(
    `${finding.path}:${finding.line}:${finding.column}: retired EPS scenario copy outside the NCSO requirement text: ${finding.text}`,
  );
  if (findings.length) process.exitCode = 1;
  else console.log("EPS headlines: no retired date-error scenario outside actual NCSO requirement text.");
}
