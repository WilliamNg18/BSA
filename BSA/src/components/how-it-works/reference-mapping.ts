import type { DesignTable } from "./content";

export const REFERENCE_MAPPING: DesignTable = {
  caption: "Reference mapping, one example",
  headers: ["Capability category", "One concrete service example"],
  rows: [
    ["Hosted model endpoint with structured output", "Azure OpenAI"],
    ["Agent orchestration runtime with tool governance and tracing", "Microsoft Foundry Agent Service"],
    ["Vector and keyword search index with effective-date filtering", "Azure AI Search"],
    ["Serverless functions for deterministic checks", "Azure Functions"],
    ["Append-only record store with application-enforced write policy", "Azure Cosmos DB"],
    ["Queue-based ingress", "Azure Service Bus"],
    ["Identity", "Microsoft Entra ID"],
    ["Secrets", "Azure Key Vault"],
    ["Private networking", "Azure Private Link"],
    ["Observability", "Azure Monitor"],
  ],
};
