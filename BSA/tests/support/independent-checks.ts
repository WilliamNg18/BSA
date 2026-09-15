export async function settleIndependentChecks(checks: readonly (() => Promise<void>)[]): Promise<void> {
  const settled = await Promise.allSettled(checks.map(async (check) => { await check(); }));
  const errors: unknown[] = settled.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    throw new AggregateError(errors, errors.map((error) => error instanceof Error ? error.message : String(error)).join("\n"));
  }
}
