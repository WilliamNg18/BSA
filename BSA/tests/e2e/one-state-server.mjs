import { buildOneStateArtifact, runOneStateServer } from "./one-state-artifact.mjs";

buildOneStateArtifact();
process.exitCode = runOneStateServer();
