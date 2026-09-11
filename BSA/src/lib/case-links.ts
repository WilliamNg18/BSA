export function pharmacyCaseLink(id: string) {
  return `/pharmacy/claims?case=${encodeURIComponent(id)}`;
}