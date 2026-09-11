import { expect, it } from "vitest";
import { injectPrescriberFault } from "../support/prescriber-fault";

it("fault injection ignores minified symbols, quote style and field order but changes only the exact case", () => {
  for (const name of ["x", "renamedBinding"]) {
    const source = `const ${name}=[{extracted:{prescriber:'Dr A'},id:'EX-A'},{id:'EX-F',extracted:{prescriber:'Dr A'}}];`;
    expect(injectPrescriberFault(source, "EX-A", "Dr A")).toEqual({ source: source.replace("prescriber:'Dr A'", 'prescriber:"Illegible"'), injections: 1 });
  }
});
it("fault injection rejects changed or duplicate markers, and reports unrelated chunks without mutation", () => {
  const row = '{id:"EX-A",extracted:{prescriber:"Dr A"}}';
  expect(() => injectPrescriberFault(`const a=[${row},${row}];`, "EX-A", "Dr A")).toThrow(/Expected one/);
  expect(() => injectPrescriberFault(`const a=${row};`, "EX-A", "Dr B")).toThrow(/Exact prescriber/);
  expect(injectPrescriberFault("const a=1;", "EX-A", "Dr A")).toEqual({ source: "const a=1;", injections: 0 });
});