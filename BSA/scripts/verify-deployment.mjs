import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";

const [url, commit] = process.argv.slice(2);
if (!url || !/^[a-f0-9]{40}$/.test(commit ?? "")) throw new Error("Usage: verify-deployment.mjs https://site commit");
const base = new URL(url);
if (base.protocol !== "https:") throw new Error("Deployment verification requires HTTPS");
const policy = JSON.parse(await readFile(new URL("../../hosting.config.json", import.meta.url), "utf8"));

async function verify() {
  const pages = [];
  for (const path of ["/", "/pharmacy/claims", "/case/EX-24112/trace", "/build-info.json"]) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20_000), cache: "no-store", redirect: "error" });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    for (const [name, value] of Object.entries(policy.globalHeaders)) {
      if (response.headers.get(name) !== value) throw new Error(`${path}: unexpected ${name}`);
    }
    if (path === "/build-info.json") {
      const info = await response.json();
      if (info.commit !== commit || info.dirty !== false) throw new Error("Deployed build does not match the clean source commit");
    } else {
      if (!response.headers.get("content-type")?.startsWith("text/html")) throw new Error(`${path}: expected HTML`);
      const html = await response.text();
      if (!html.includes('id="root"')) throw new Error(`${path}: application root absent`);
      pages.push(html);
    }
  }
  if (!pages.every((page) => page === pages[0])) throw new Error("Deep links do not return the built SPA entry");
}

for (let attempt = 1; ; attempt++) {
  try { await verify(); console.log(`Verified ${base.origin} at ${commit}`); break; }
  catch (error) {
    console.error(`Deployment probe ${attempt}/12: ${error.message}`);
    if (attempt === 12) throw error;
    await setTimeout(10_000);
  }
}
