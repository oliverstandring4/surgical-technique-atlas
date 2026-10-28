import { supabase } from "@/integrations/supabase/client";
import { ALL_TABLES, type TableName } from "@/lib/atlas";

type AnyRow = Record<string, unknown>;
export type Backup = {
  app: "operative-atlas";
  version: 1;
  exported_at: string;
  tables: Partial<Record<TableName, AnyRow[]>>;
};

export const TABLE_LABELS: Record<TableName, string> = {
  categories: "Categories",
  subsections: "Subdivisions",
  conditions: "Conditions",
  operations: "Operations",
  preference_cards: "Preference cards",
  entries: "Case entries (old format)",
  op_note_templates: "Op note templates",
  dot_phrases: "Dot phrases",
  order_sets: "Post-op order sets (old format)",
  saved_links: "Links",
};

async function fetchAll(table: TableName): Promise<AnyRow[]> {
  const out: AnyRow[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at")
      .range(from, from + page - 1);
    if (error) throw error;
    out.push(...((data ?? []) as AnyRow[]));
    if (!data || data.length < page) return out;
  }
}

export async function buildBackup(): Promise<Backup> {
  const tables: Backup["tables"] = {};
  for (const t of ALL_TABLES) tables[t] = await fetchAll(t);
  return { app: "operative-atlas", version: 1, exported_at: new Date().toISOString(), tables };
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("; ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: AnyRow[]): string {
  if (!rows.length) return "";
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  return [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join(
    "\r\n",
  );
}

/** Accepts our export format, or a bare { tableName: rows[] } object. */
export function parseBackup(text: string): Backup["tables"] {
  const raw = JSON.parse(text) as unknown;
  if (!raw || typeof raw !== "object") throw new Error("Not a JSON object");
  const obj = raw as Record<string, unknown>;
  const src = (obj["tables"] && typeof obj["tables"] === "object" ? obj["tables"] : obj) as Record<
    string,
    unknown
  >;
  const tables: Backup["tables"] = {};
  for (const t of ALL_TABLES) {
    const v = src[t];
    if (Array.isArray(v))
      tables[t] = v.filter(
        (r): r is AnyRow => !!r && typeof r === "object" && typeof (r as AnyRow)["id"] === "string",
      );
  }
  if (!Object.keys(tables).length) throw new Error("No Operative Atlas data found in this file");
  return tables;
}

type Existing = { categories: AnyRow[]; subsections: AnyRow[] };

/**
 * Prepares rows for insertion into the current account:
 * - sets user_id to the current user
 * - matches categories by name and subsections by (category, name) so a fresh account's
 *   default categories aren't duplicated; references are remapped accordingly.
 */
export function planImport(
  tables: Backup["tables"],
  existing: Existing,
  userId: string,
): Partial<Record<TableName, AnyRow[]>> {
  const norm = (s: unknown) =>
    String(s ?? "")
      .trim()
      .toLowerCase();
  const catMap = new Map<string, string>();
  const subMap = new Map<string, string>();
  const plan: Partial<Record<TableName, AnyRow[]>> = {};

  const existingCatIds = new Set(existing.categories.map((c) => c["id"] as string));
  plan.categories = [];
  for (const c of tables.categories ?? []) {
    const id = c["id"] as string;
    if (existingCatIds.has(id)) continue;
    const byName = existing.categories.find((e) => norm(e["name"]) === norm(c["name"]));
    if (byName) catMap.set(id, byName["id"] as string);
    else plan.categories.push(c);
  }
  const remapCat = (v: unknown) => (typeof v === "string" ? (catMap.get(v) ?? v) : v);

  const existingSubIds = new Set(existing.subsections.map((s) => s["id"] as string));
  plan.subsections = [];
  for (const s of tables.subsections ?? []) {
    const id = s["id"] as string;
    if (existingSubIds.has(id)) continue;
    const category_id = remapCat(s["category_id"]);
    const same = existing.subsections.find(
      (e) => e["category_id"] === category_id && norm(e["name"]) === norm(s["name"]),
    );
    if (same) subMap.set(id, same["id"] as string);
    else plan.subsections.push({ ...s, category_id });
  }
  const remapSub = (v: unknown) => (typeof v === "string" ? (subMap.get(v) ?? v) : v);

  plan.conditions = (tables.conditions ?? []).map((c) => ({
    ...c,
    category_id: remapCat(c["category_id"]),
    subsection_id: remapSub(c["subsection_id"]),
  }));
  plan.operations = (tables.operations ?? []).map((o) => ({
    ...o,
    category_id: remapCat(o["category_id"]),
    subsection_id: remapSub(o["subsection_id"]),
  }));
  plan.preference_cards = tables.preference_cards ?? [];
  plan.entries = (tables.entries ?? []).map((e) => ({
    ...e,
    category_id: remapCat(e["category_id"]),
    subsection_id: remapSub(e["subsection_id"]),
  }));
  plan.op_note_templates = (tables.op_note_templates ?? []).map((t) => ({
    ...t,
    category_id: remapCat(t["category_id"]),
  }));
  plan.order_sets = (tables.order_sets ?? []).map((o) => ({
    ...o,
    category_id: remapCat(o["category_id"]),
  }));
  plan.dot_phrases = tables.dot_phrases ?? [];
  plan.saved_links = tables.saved_links ?? [];

  for (const t of ALL_TABLES) plan[t] = (plan[t] ?? []).map((r) => ({ ...r, user_id: userId }));
  return plan;
}

/** Inserts planned rows; rows whose id already exists are skipped. Never updates or deletes. */
export async function runImport(
  plan: Partial<Record<TableName, AnyRow[]>>,
): Promise<Record<TableName, number>> {
  const added = Object.fromEntries(ALL_TABLES.map((t) => [t, 0])) as Record<TableName, number>;
  for (const t of ALL_TABLES) {
    const rows = plan[t] ?? [];
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { data, error } = await supabase
        .from(t)
        .upsert(chunk as never, { onConflict: "id", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(`${TABLE_LABELS[t]}: ${error.message}`);
      added[t] += data?.length ?? 0;
    }
  }
  return added;
}
