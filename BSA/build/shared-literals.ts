import ts from "typescript";
import type { Plugin } from "vite";

/** Share repeated string values, never property keys, directives or module specifiers. */
export function shareLiterals(code: string): string | undefined {
  const source = ts.createSourceFile("chunk.js", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const literals = new Map<string, ts.StringLiteral[]>();
  const names = new Set<string>();
  function visit(node: ts.Node) {
    if (ts.isIdentifier(node)) names.add(node.text);
    if (ts.isStringLiteral(node) && node.text.length >= 12) {
      const parent = node.parent;
      const isValue = (ts.isPropertyAssignment(parent) && parent.initializer === node)
        || (ts.isCallExpression(parent) && parent.arguments.some((argument) => argument === node))
        || (ts.isArrayLiteralExpression(parent) && parent.elements.some((element) => element === node))
        || ts.isConditionalExpression(parent)
        || (ts.isVariableDeclaration(parent) && parent.initializer === node)
        || ts.isReturnStatement(parent);
      if (isValue) {
        const group = literals.get(node.text) ?? [];
        group.push(node);
        literals.set(node.text, group);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  const edits: { start: number; end: number; name: string }[] = [];
  const constants: string[] = [];
  for (const [value, nodes] of literals) {
    if (nodes.length < 3) continue;
    let name = `__sharedString${constants.length}`;
    while (names.has(name)) name += "_";
    names.add(name);
    constants.push(`${name}=${JSON.stringify(value)}`);
    for (const node of nodes) edits.push({ start: node.getStart(source), end: node.end, name });
  }
  if (!constants.length) return;
  let result = code;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, edit.start) + edit.name + result.slice(edit.end);
  }
  // Preserve directive prologues. Initialisers are primitive values with no effects.
  let insertion = 0;
  for (const statement of source.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    insertion = statement.end;
  }
  return result.slice(0, insertion) + `\nconst ${constants.join(",")};\n` + result.slice(insertion);
}

export function sharedLiterals(): Plugin {
  return {
    name: "shared-string-values",
    apply: "build",
    enforce: "pre",
    renderChunk(code) {
      const result = shareLiterals(code);
      return result === undefined ? undefined : { code: result, map: null };
    },
  };
}