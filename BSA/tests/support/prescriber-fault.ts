import ts from "typescript";

/** Target an exact case/input, independent of minified bindings or property order. */
export function injectPrescriberFault(source: string, caseId: string, expectedPrescriber: string) {
  const file = ts.createSourceFile("bundle.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const matches: ts.StringLiteralLike[] = [];
  function property(object: ts.ObjectLiteralExpression, name: string) {
    return object.properties.find((item): item is ts.PropertyAssignment => ts.isPropertyAssignment(item) && (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) && item.name.text === name)?.initializer;
  }
  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const id = property(node, "id");
      const extracted = property(node, "extracted");
      if (id && ts.isStringLiteralLike(id) && id.text === caseId && extracted && ts.isObjectLiteralExpression(extracted)) {
        const prescriber = property(extracted, "prescriber");
        if (!prescriber || !ts.isStringLiteralLike(prescriber) || prescriber.text !== expectedPrescriber) throw new Error(`Exact prescriber marker missing for ${caseId}`);
        matches.push(prescriber);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!matches.length) return { source, injections: 0 };
  if (matches.length !== 1) throw new Error(`Expected one exact prescriber marker for ${caseId}; found ${matches.length}`);
  const marker = matches[0];
  return { source: source.slice(0, marker.getStart(file)) + '"Illegible"' + source.slice(marker.end), injections: 1 };
}