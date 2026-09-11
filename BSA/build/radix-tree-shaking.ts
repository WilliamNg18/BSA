import ts from "typescript";
import type { Plugin } from "vite";

const namingHelper = 'var __name = (target, value) => __defProp(target, "name", { value, configurable: true });';

/** Keep Radix's observable names while making local naming mutations tree-shakeable. */
export function optimiseRadixNames(code: string, id: string): string | undefined {
  if (!/\/node_modules\/@radix-ui\/[^/]+\/dist\/index\.mjs$/.test(id.replaceAll("\\", "/"))) return;
  if (!code.includes("var __defProp = Object.defineProperty;") || !code.includes(namingHelper)) return;
  const source = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits: { start: number; end: number; text: string }[] = [];
  for (const statement of source.statements) {
    // The unused experimental OrderedDict class has only a local name mutation
    // at class evaluation. Keep it intact when used; discard the whole allocation
    // when unused, including methods and their otherwise-retained dependencies.
    if (id.replaceAll("\\", "/").endsWith("/@radix-ui/react-collection/dist/index.mjs") && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const value = declaration.initializer;
        if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "OrderedDict"
          || !value || !ts.isClassExpression(value) || value.name?.text !== "_OrderedDict") continue;
        const blocks = value.members.filter(ts.isClassStaticBlockDeclaration);
        if (blocks.length !== 1 || blocks[0].body.getText(source).replace(/\s+/g, "") !== '{__name(this,"OrderedDict");}') continue;
        edits.push({ start: value.getStart(source), end: value.end,
          text: `/* @__PURE__ */ (() => (${value.getText(source)}))()` });
      }
    }
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
    const call = statement.expression;
    const [target, name] = call.arguments;
    if (!ts.isIdentifier(call.expression) || call.expression.text !== "__name" || call.arguments.length !== 2
      || !ts.isIdentifier(target) || !ts.isStringLiteral(name)) continue;
    // Only local function declarations: Object.defineProperty returns this same function.
    // Assignment preserves hoisting, identity, descriptor and the timing of the name change.
    if (!source.statements.some((node) => ts.isFunctionDeclaration(node) && node.name?.text === target.text)) continue;
    edits.push({ start: statement.getStart(source), end: statement.end,
      text: `${target.text} = /* @__PURE__ */ ${call.getText(source)};` });
  }
  if (!edits.length) return;
  let result = code;
  for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  return result;
}

export function radixTreeShaking(): Plugin {
  return {
    name: "radix-local-name-tree-shaking",
    apply: "build",
    enforce: "pre",
    transform(code, id) {
      const result = optimiseRadixNames(code, id);
      return result === undefined ? undefined : { code: result, map: null };
    },
  };
}