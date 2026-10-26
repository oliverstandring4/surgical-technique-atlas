export type PhiWarning = { kind: "MRN-like number" | "Full date" | "Phone number"; match: string };

export function stripHtml(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

const MONTHS = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";

const PATTERNS: { kind: PhiWarning["kind"]; re: RegExp }[] = [
  { kind: "Phone number", re: /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g },
  { kind: "Full date", re: /\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g },
  { kind: "Full date", re: /\b\d{4}-\d{1,2}-\d{1,2}\b/g },
  { kind: "Full date", re: new RegExp(`\\b${MONTHS}\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}\\b`, "gi") },
  { kind: "Full date", re: new RegExp(`\\b\\d{1,2}\\s+${MONTHS}\\s+\\d{4}\\b`, "gi") },
  { kind: "MRN-like number", re: /\b\d{7,}\b/g },
];

/** Returns possible identifier patterns in the given texts (HTML allowed). */
export function findPhi(texts: string[]): PhiWarning[] {
  const found: PhiWarning[] = [];
  const seen = new Set<string>();
  for (const t of texts) {
    let text = stripHtml(t ?? "");
    for (const { kind, re } of PATTERNS) {
      for (const m of text.matchAll(re)) {
        const key = `${kind}:${m[0]}`;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({ kind, match: m[0].trim() });
        }
      }
      // avoid double-reporting digits already flagged (e.g. phone as MRN)
      text = text.replace(re, " ");
    }
  }
  return found;
}
