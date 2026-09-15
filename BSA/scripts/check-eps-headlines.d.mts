export interface EpsHeadlineFinding {
  readonly path: string;
  readonly line: number;
  readonly column: number;
  readonly text: string;
}
export function scanEpsHeadlines(path: string, text: string): EpsHeadlineFinding[];
export function checkEpsHeadlines(root: string): Promise<EpsHeadlineFinding[]>;
