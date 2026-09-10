// Presentation-only aliases for proposed services. Never apply these to source
// evidence, stored audit records or the Architecture production mapping.
const SERVICE_LABELS: Readonly<Record<string, string>> = {
  "Azure AI Document Intelligence (layout)": "Document layout analysis",
  "Azure AI Search (versioned corpus, effective-date filter)": "Search (versioned corpus, effective-date filter)",
  "Azure Functions (pure functions)": "Deterministic code (pure functions)",
  "Azure Functions": "Deterministic code",
  "Azure Cosmos DB (append-only)": "Append-only record store",
};

export function productionServiceLabel(service: string): string {
  return Object.hasOwn(SERVICE_LABELS, service) ? SERVICE_LABELS[service] : service;
}

export function agentVersionLabel(version: string): string {
  return version.replace("production: constrained Azure OpenAI call", "production: constrained model call");
}
