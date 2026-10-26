import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type TableName =
  | "categories"
  | "subsections"
  | "entries"
  | "op_note_templates"
  | "dot_phrases"
  | "order_sets"
  | "saved_links";
export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];

export type Category = Row<"categories">;
export type Subsection = Row<"subsections">;
export type Entry = Row<"entries">;
export type OpTemplate = Row<"op_note_templates">;
export type DotPhrase = Row<"dot_phrases">;
export type OrderSet = Row<"order_sets">;
export type SavedLink = Row<"saved_links">;

export const ALL_TABLES: TableName[] = [
  "categories",
  "subsections",
  "entries",
  "op_note_templates",
  "dot_phrases",
  "order_sets",
  "saved_links",
];

export const APPROACHES = ["open", "laparoscopic", "robotic", "hybrid"] as const;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const ENTRY_SECTIONS = [
  { key: "indications", label: "Indications", hint: "" },
  {
    key: "setup",
    label: "Setup",
    hint: "Positioning, room setup, port placement, instruments/energy, special equipment",
  },
  { key: "key_steps", label: "Key steps", hint: "" },
  { key: "pearls", label: "Pearls", hint: "" },
  { key: "pitfalls", label: "Pitfalls", hint: "" },
] as const;

export const ORDER_FIELDS = [
  { key: "diet", label: "Diet" },
  { key: "drains", label: "Drains" },
  { key: "labs", label: "Labs" },
  { key: "vte", label: "VTE prophylaxis" },
  { key: "pain", label: "Pain" },
  { key: "eras", label: "ERAS pathway" },
  { key: "activity", label: "Activity" },
  { key: "discharge", label: "Discharge criteria" },
] as const;

export function procedureKey(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function performedLabel(e: Pick<Entry, "performed_month" | "performed_year">) {
  if (!e.performed_year) return "";
  return e.performed_month ? `${MONTHS[e.performed_month - 1]} ${e.performed_year}` : `${e.performed_year}`;
}

const ORDER: Partial<Record<TableName, { col: string; asc: boolean }>> = {
  categories: { col: "position", asc: true },
  subsections: { col: "position", asc: true },
  saved_links: { col: "position", asc: true },
};

export function useTable<T extends TableName>(table: T) {
  return useQuery({
    queryKey: ["atlas", table],
    queryFn: async () => {
      const o = ORDER[table] ?? { col: "updated_at", asc: false };
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(o.col, { ascending: o.asc })
        .limit(5000);
      if (error) throw error;
      return data as unknown as Row<T>[];
    },
    staleTime: 30_000,
  });
}

export function useSave<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Insert<T> & { id?: string }) => {
      const { data, error } = await supabase
        .from(table)
        .upsert(row as never)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Row<T>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atlas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemove(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atlas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function copyText(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Couldn't copy");
  }
}

export function htmlToText(html: string) {
  if (typeof document === "undefined") return html;
  const d = document.createElement("div");
  d.innerHTML = html.replace(/<\/(p|li|h\d)>/g, "</$1>\n");
  return (d.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}
