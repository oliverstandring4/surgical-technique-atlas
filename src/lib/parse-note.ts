export type SectionKey = "indications" | "setup" | "key_steps" | "pearls" | "pitfalls";

const HEADINGS: { key: SectionKey; re: RegExp }[] = [
  { key: "indications", re: /^indications?$/i },
  { key: "setup", re: /^(set[\s-]?up|positioning|room set[\s-]?up)$/i },
  { key: "key_steps", re: /^(key\s+steps?|steps|operative\s+steps|procedure)$/i },
  { key: "pearls", re: /^pearls?$/i },
  { key: "pitfalls", re: /^(pitfalls?|pitfalls?\s*\/\s*complications)$/i },
];

function matchHeading(line: string): { key: SectionKey; rest: string } | null {
  const cleaned = line
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^\*\*(.+?)\*\*/, "$1")
    .trim();
  // "Heading:" with optional inline content after colon
  const m = cleaned.match(/^([A-Za-z][A-Za-z\s/-]{1,40}?)\s*[:\-–—]?\s*(.*)$/);
  if (!m) return null;
  const [, head, rest] = m;
  // Only accept "heading: rest" when separated by colon, or bare heading
  const hasColon = /^[A-Za-z][A-Za-z\s/-]{1,40}?\s*:/.test(cleaned);
  for (const h of HEADINGS) {
    if (h.re.test(head.trim())) {
      if (rest && !hasColon) return null;
      return { key: h.key, rest: hasColon ? rest : "" };
    }
  }
  return null;
}

/** Split pasted text into sections by headings. Returns plain text per section. */
export function parseFormattedNote(text: string): Partial<Record<SectionKey, string>> {
  const out: Partial<Record<SectionKey, string[]>> = {};
  let current: SectionKey | null = null;
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const h = matchHeading(line);
    if (h) {
      current = h.key;
      out[current] = out[current] ?? [];
      if (h.rest) out[current]!.push(h.rest);
      continue;
    }
    if (current) out[current]!.push(line);
  }
  const result: Partial<Record<SectionKey, string>> = {};
  for (const [k, lines] of Object.entries(out)) {
    const v = (lines as string[]).join("\n").trim();
    if (v) result[k as SectionKey] = v;
  }
  return result;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Convert plain text to simple HTML (paragraphs, bullet and numbered lists). */
export function plainToHtml(text: string): string {
  const lines = text.split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;
  const close = () => {
    if (list) html.push(`</${list}>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      close();
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const num = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || num) {
      const type = bullet ? "ul" : "ol";
      if (list !== type) {
        close();
        html.push(`<${type}>`);
        list = type;
      }
      html.push(`<li><p>${esc((bullet ?? num)![1])}</p></li>`);
    } else {
      close();
      html.push(`<p>${esc(line)}</p>`);
    }
  }
  close();
  return html.join("");
}
