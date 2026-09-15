export function pharmacyCaseLink(id: string) {
  return `/pharmacy/claims?case=${encodeURIComponent(id)}`;
}

export function nhsbsaCaseLink(id: string) {
  return `/case/${encodeURIComponent(id)}`;
}