export interface Shard { index: number; total: number }
export interface Stage { name: string; args: string[]; informational: boolean; script?: string }
export function parseShard(args: string[]): Shard | null;
export function verificationStages(shard: Shard | null): Stage[];
export function executeStage(stage: Stage): number;
export function runVerification(
  args: string[],
  execute?: (stage: Stage) => number | Promise<number>,
  log?: (message: string) => void,
): Promise<number>;
