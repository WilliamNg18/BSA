import { readFile, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const mappingPath = "src/components/how-it-works/reference-mapping.ts";
const vendorPattern = /\b(?:Azure|OpenAI|Microsoft|Foundry|Copilot|Cosmos\s+DB|Purview|Entra|Key\s+Vault|Private\s+Link|Application\s+Insights|GitHub\s+Actions|Bicep|Terraform|TypeScript|AWS|Amazon\s+Web\s+Services|Google\s+Cloud|Anthropic)\b/gi;

export function scanSourceCopy(path, text) {
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const ignored = [];
  const allow = (node) => ignored.push([node.getStart(file), node.getEnd()]);
  const isMapping = path.replaceAll("\\", "/") === mappingPath;
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) allow(node.moduleSpecifier);
    }
    if (isMapping && ts.isVariableDeclaration(node) && node.name.getText(file) === "REFERENCE_MAPPING" &&
      node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      const rows = node.initializer.properties.find((property) =>
        ts.isPropertyAssignment(property) && property.name.getText(file) === "rows");
      if (rows && ts.isPropertyAssignment(rows) && ts.isArrayLiteralExpression(rows.initializer)) {
        for (const row of rows.initializer.elements) {
          if (ts.isArrayLiteralExpression(row) && row.elements.length === 2 && ts.isStringLiteral(row.elements[1])) allow(row.elements[1]);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return [...text.matchAll(vendorPattern)].flatMap((match) => {
    if (ignored.some(([start, end]) => match.index >= start && match.index < end)) return [];
    const location = file.getLineAndCharacterOfPosition(match.index);
    return [{ path, line: location.line + 1, column: location.character + 1, text: match[0] }];
  });
}

export async function checkSourceCopy(root) {
  const findings = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
        findings.push(...scanSourceCopy(relative(root, path), await readFile(path, "utf8")));
      }
    }
  }
  await walk(resolve(root, "src"));
  return findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const findings = await checkSourceCopy(root);
  for (const finding of findings) console.error(`${finding.path}:${finding.line}:${finding.column}: vendor copy outside the reference example: ${finding.text}`);
  if (findings.length) process.exitCode = 1;
  else console.log("Source copy: neutral outside service cells in the one reference-mapping module; package imports are not interface copy.");
}
