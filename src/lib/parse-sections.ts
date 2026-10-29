/** Heading-based splitting of a pasted note into named sections. */
export type SectionRule<K extends string> = { key: K; re: RegExp; keepHeading?: boolean };

export const OPERATION_RULES: SectionRule<"setup" | "intra_op" | "post_op">[] = [
  {
    key: "setup",
    re: /^(pre[\s-]?op(erative)?(\s*(\/|&|and)\s*set[\s-]?up|\s+(workup|plan|considerations))?|indications?|workup|set[\s-]?up|positioning|room set[\s-]?up|ports?(\s*(\/|&|and)\s*incisions?)?|incisions?|port placement)$/i,
  },
  {
    key: "intra_op",
    re: /^(intra[\s-]?op(erative)?|key\s+steps?|steps|operative\s+steps|procedure|technique)$/i,
  },
  {
    key: "post_op",
    re: /^(post[\s-]?op(erative)?(\s*(\/\s*)?(eras|orders|care|management))?|eras(\s+protocol)?)$/i,
  },
];

export const CONDITION_RULES: SectionRule<
  "history_physical" | "labs" | "imaging" | "data" | "recommendations"
>[] = [
  {
    key: "history_physical",
    re: /^(h\s*&\s*p|h\/p|history(\s*(&|and|\/)\s*physical)?|physical(\s+exam)?|exam|presentation)$/i,
  },
  { key: "labs", re: /^(labs?|laboratory|labs?\s*(\/|&)\s*studies)$/i },
  { key: "imaging", re: /^(imaging|radiology)$/i },
  { key: "data", re: /^(data|evidence|trials|literature|guidelines|staging)$/i },
  { key: "recommendations", re: /^(recommendations?|recs|plan|management|algorithm|treatment)$/i },
];

function matchHeading<K extends string>(line: string, rules: SectionRule<K>[]) {
  const cleaned = line
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .trim();
  if (!cleaned || cleaned.length > 60) return null;
  const idx = cleaned.indexOf(":");
  const head = (idx >= 0 ? cleaned.slice(0, idx) : cleaned).trim();
  const rest = idx >= 0 ? cleaned.slice(idx + 1).trim() : "";
  for (const r of rules) if (r.re.test(head)) return { rule: r, head, rest };
  return null;
}

/** Returns plain text per section. Sections whose rule has keepHeading keep their sub-headings (e.g. Pearls / Pitfalls). */
export function parseSections<K extends string>(
  text: string,
  rules: SectionRule<K>[],
): Partial<Record<K, string>> {
  const out = new Map<K, string[]>();
  let current: K | null = null;
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const h = matchHeading(line, rules);
    if (h) {
      current = h.rule.key;
      const lines = out.get(current) ?? [];
      out.set(current, lines);
      if (h.rule.keepHeading) {
        if (lines.length) lines.push("");
        lines.push(`${h.head}:`);
      }
      if (h.rest) lines.push(h.rest);
      continue;
    }
    if (current) out.get(current)!.push(line);
  }
  const result: Partial<Record<K, string>> = {};
  for (const [k, lines] of out) {
    const v = lines.join("\n").trim();
    if (v) result[k] = v;
  }
  return result;
}
