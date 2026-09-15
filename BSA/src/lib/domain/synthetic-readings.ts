import type { EndorsementFacts } from "./types";

export const readNcso = (
  initialled: boolean,
  dated: boolean,
  quoted: string,
  note: string,
): EndorsementFacts => ({
  type: "NCSO",
  present: true,
  initialled,
  dated,
  quotedText: quoted,
  note,
});
