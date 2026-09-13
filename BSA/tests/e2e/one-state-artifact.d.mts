import type { spawnSync } from "node:child_process";
export const instrumentedDirectory: string;
export function artifactDigest(directory: string): string;
export function buildOneStateArtifact(run?: typeof spawnSync, directory?: string): void;
export function runOneStateServer(run?: typeof spawnSync, directory?: string): number;
