import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const policy = JSON.parse(readFileSync(new URL("../../../hosting.config.json", import.meta.url), "utf8")) as {
  globalHeaders: Record<string, string>;
};

test("portable build serves its Git provenance, deep links and immutable assets", async ({ request }) => {
  expect(readFileSync(new URL("../../dist/server.mjs", import.meta.url), "utf8"))
    .toBe(readFileSync(new URL("../../scripts/static-server.mjs", import.meta.url), "utf8"));
  expect(JSON.parse(readFileSync(new URL("../../dist/hosting.config.json", import.meta.url), "utf8"))).toEqual(policy);
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const info = await request.get("build-info.json");
  expect(info.status()).toBe(200);
  expect(info.headers()["cache-control"]).toBe("no-store");
  expect(await info.json()).toMatchObject({ commit, dirty: expect.any(Boolean) });
  const root = await request.get("./");
  const html = await root.text();
  for (const path of ["./", "pharmacy/claims?caseId=EX-24112", "case/EX-24112/trace"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).toBe(html);
    for (const [name, value] of Object.entries(policy.globalHeaders)) expect(response.headers()[name.toLowerCase()]).toBe(value);
  }
  const script = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  expect(script).toBeTruthy();
  const asset = await request.get(script!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["content-type"]).toContain("text/javascript");
  expect(asset.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  for (const path of ["server.mjs", "hosting.config.json", "staticwebapp.config.json", "assets/not-found.js"]) {
    expect((await request.get(path)).status()).toBe(404);
  }
});
