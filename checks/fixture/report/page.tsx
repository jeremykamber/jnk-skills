// An entry point the framework calls by convention, next to a method nothing
// calls at all. Only the second is a deletion candidate.
export default function Page() {
  const title = "page";
  return title;
}

export function orphanedHelper(value: string): string {
  const trimmed = value.trim();
  return trimmed;
}
