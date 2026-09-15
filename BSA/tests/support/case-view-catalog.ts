import { PLAYABLE_CASES, playableCaseChannel } from "../../src/lib/domain/cases";

export const cases = PLAYABLE_CASES.map(({ id, title }) => ({ id, title }));

export function caseViewRoutes(id: string) {
  const channel = playableCaseChannel(id);
  if (!channel) throw new Error(`No canonical submission channel for ${id}.`);
  return [
    `/pharmacy?case=${id}&channel=${channel}`,
    `/pharmacy/claims?caseId=${id}`,
    `/case/${id}`, `/case/${id}/trace`, `/case/${id}/record`,
  ];
}
