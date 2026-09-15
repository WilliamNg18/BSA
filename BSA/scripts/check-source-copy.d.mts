export interface SourceCopyFinding { path: string; line: number; column: number; text: string }
export function scanSourceCopy(path: string, text: string): SourceCopyFinding[];
export function checkSourceCopy(root: string): Promise<SourceCopyFinding[]>;
