import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";

const app = fileURLToPath(new URL("..", import.meta.url));

export function parseShard(args) {
  if (args.length === 0) return null;
  const value = args.length === 2 && args[0] === "--shard" ? args[1]
    : args.length === 1 && args[0].startsWith("--shard=") ? args[0].slice(8) : "";
  const match = /^([1-9]\d*)\/([1-9]\d*)$/.exec(value);
  if (!match) throw new Error("Usage: npm run verify [-- --shard=INDEX/TOTAL]");
  const index = Number(match[1]), total = Number(match[2]);
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(total) || index > total) {
    throw new Error("Shard INDEX and TOTAL must be safe positive integers with INDEX <= TOTAL.");
  }
  return { index, total };
}

export function verificationStages(shard) {
  const partition = shard ? [`--shard=${shard.index}/${shard.total}`] : [];
  const browser = ["run", "test:e2e", "--", "--config", "tests/e2e/production-artifact.config.ts",
    "--project=chromium", "--reporter=dot", ...partition];
  return [
    { name: "Check (typecheck, lint, build)", args: ["run", "check"], informational: false },
    { name: "Unit tests", args: ["test", "--", "--maxWorkers=2"], informational: false },
    ...(!shard || shard.index === 1 ? [
      { name: "Content report", args: ["run", "check:content"], informational: true },
      { name: "Gzip report", script: fileURLToPath(new URL("report-gzip.mjs", import.meta.url)), args: [], informational: true },
    ] : []),
    { name: "Blocking production browsers", args: [...browser, "--grep-invert", "@quarantine|@informational", "--output", join("test-results", "blocking")], informational: false },
    { name: "Informational browser reports", args: [...browser, "--grep", "@quarantine|@informational", "--pass-with-no-tests",
      "--output", join("test-results", "informational")], informational: true },
    { name: "Blocking instrumented one-state equivalence", args: ["run", "test:e2e", "--", "--config", "tests/e2e/one-state.config.ts",
      "--project=chromium", "--reporter=dot", ...partition, "--output", join("test-results", "one-state")], informational: false },
  ];
}

export function executeStage(stage) {
  const npmCli = process.env.npm_execpath;
  if (!stage.script && !npmCli) throw new Error("Run verification with npm run verify so the npm CLI is available.");
  // Running npm through Node avoids .cmd shell interpolation on Windows.
  const result = spawnSync(process.execPath, [stage.script ?? npmCli, ...stage.args], {
    cwd: app,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`${stage.name} terminated by ${result.signal}.`);
  if (result.status === null) throw new Error(`${stage.name} did not return an exit status.`);
  return result.status;
}

export async function runVerification(args, execute = executeStage, log = console.log) {
  let shard;
  try { shard = parseShard(args); }
  catch (error) { log(error instanceof Error ? error.message : String(error)); return 2; }
  for (const stage of verificationStages(shard)) {
    log(`\n[verify] ${stage.name}${stage.informational ? " (non-blocking)" : ""}`);
    if (stage.name === "Blocking production browsers") {
      log("[verify] Chromium is required. If missing, run: npm exec -- playwright install chromium (Linux CI: add --with-deps).");
    }
    let code;
    try { code = await execute(stage); }
    catch (error) {
      log(`[verify] ${stage.name}: ${error instanceof Error ? error.message : String(error)}`);
      code = 1;
    }
    if (!Number.isInteger(code) || code < 0 || code > 255) {
      log(`[verify] ${stage.name} returned an invalid exit code.`);
      code = 1;
    }
    if (code !== 0) {
      log(`[verify] ${stage.name} exited ${code}${stage.informational ? "; informational failure retained." : "."}`);
      if (!stage.informational) return code;
    }
  }
  log("[verify] All blocking checks passed.");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runVerification(process.argv.slice(2));
}
