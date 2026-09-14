// Current metadata is capability-neutral at its source. Historical records are
// retained verbatim, never rewritten by presentation aliases.
export function productionServiceLabel(service: string): string {
  return service;
}

export function agentVersionLabel(version: string): string {
  return version;
}
