import { findPhi } from "@/lib/phi-check";

/** Warn (but don't block) when text looks like it contains patient identifiers. Returns true to proceed. */
export function phiConfirm(texts: string[]): boolean {
  const w = findPhi(texts);
  if (!w.length) return true;
  const list = w.map((x) => `• ${x.kind}: ${x.match}`).join("\n");
  return confirm(`This text may contain patient details:\n\n${list}\n\nSave anyway?`);
}
