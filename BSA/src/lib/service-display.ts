// Presentation-only aliases for proposed services. Never apply these to source
// evidence or stored audit records.
const SERVICE_LABELS: Readonly<Record<string, string>> = {
  "Azure AI Document Intelligence (layout)": "Document layout analysis",
  "Azure AI Search (versioned corpus, effective-date filter)": "Search (versioned corpus, effective-date filter)",
  "Azure Functions (pure functions)": "Deterministic code (pure functions)",
  "Azure Functions": "Deterministic code",
  "Azure Cosmos DB (append-only)": "Append-only record store",
};

const SERVICE_ROLES: readonly [string, string][] = [
  ["Azure AI Document Intelligence", "Document layout analysis"],
  ["Azure AI Foundry Agent Service", "Governed agent orchestration"],
  ["Azure Functions / Durable Functions", "Deterministic workflow functions"],
  ["Azure Functions", "Deterministic code"],
  ["Azure Service Bus", "Event messaging"],
  ["Azure OpenAI", "model"],
  ["Azure AI Search", "Versioned search"],
  ["Azure Cosmos DB", "Record store"],
  ["Microsoft Entra ID", "Workload identity"],
  ["Azure Key Vault", "Managed secret storage"],
  ["Private Link", "Private network access"],
  ["Microsoft Purview", "Data lineage"],
  ["Application Insights", "Application telemetry"],
  ["Azure Monitor", "Service monitoring"],
  ["Foundry tracing", "agent tracing"],
  ["Bicep or Terraform", "Declarative infrastructure"],
  ["GitHub Actions", "Automated release workflows"],
  ["TypeScript", "Typed"],
];

export function productionServiceLabel(service: string): string {
  if (Object.hasOwn(SERVICE_LABELS, service)) return SERVICE_LABELS[service];
  return SERVICE_ROLES.reduce((label, [name, role]) => label.replaceAll(name, role), service);
}

export function agentVersionLabel(version: string): string {
  return version.replace("production: constrained Azure OpenAI call", "production: constrained model call");
}
