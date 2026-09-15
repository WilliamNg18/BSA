import { RecommendationCard } from "@/components/demo/recommendation-card";
import { useItemRecommendation } from "@/hooks/use-item-recommendation";
import type { RecommendationContext } from "@/lib/domain/recommendations";

export function ItemRecommendationPanel({ caseId, context, compact = false }: {
  caseId: string;
  context?: RecommendationContext;
  compact?: boolean;
}) {
  const { recommendation, error } = useItemRecommendation(caseId, context);
  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  return recommendation ? <RecommendationCard recommendation={recommendation} compact={compact} /> : null;
}
