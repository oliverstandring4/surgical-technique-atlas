import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CARD_FIELDS, useTable, type PreferenceCard } from "@/lib/atlas";

/** A preference-card field. Built-in fields map to columns; custom ones live in preference_cards.custom. */
export type CardField = { key: string; label: string; builtin: boolean; hidden?: boolean };

const BUILTIN_KEYS = new Set<string>(CARD_FIELDS.map((f) => f.key));

export const DEFAULT_CARD_FIELDS: CardField[] = CARD_FIELDS.map((f) => ({
  key: f.key,
  label: f.label,
  builtin: true,
}));

/** Normalizes stored settings: keeps order/labels, drops junk, and appends any built-in field missing from the list. */
export function normalizeCardFields(raw: unknown): CardField[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_CARD_FIELDS;
  const out: CardField[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const key = typeof o["key"] === "string" ? o["key"] : "";
    const label = typeof o["label"] === "string" ? o["label"].trim() : "";
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const builtin = BUILTIN_KEYS.has(key);
    out.push({
      key,
      label: label || CARD_FIELDS.find((f) => f.key === key)?.label || "Untitled",
      builtin,
      ...(o["hidden"] === true ? { hidden: true } : {}),
    });
  }
  for (const f of DEFAULT_CARD_FIELDS) if (!seen.has(f.key)) out.push(f);
  return out;
}

export function newCustomKey() {
  return `c_${crypto.randomUUID().slice(0, 8)}`;
}

export function cardValue(
  card: Pick<PreferenceCard, "custom"> & Record<string, unknown>,
  f: CardField,
): string {
  if (f.builtin) return (card[f.key] as string | undefined) ?? "";
  const custom =
    card.custom && typeof card.custom === "object" && !Array.isArray(card.custom)
      ? (card.custom as Record<string, unknown>)
      : {};
  const v = custom[f.key];
  return typeof v === "string" ? v : "";
}

/** All fields (including hidden) plus the visible subset, from the user's settings. */
export function useCardFields() {
  const q = useTable("user_settings");
  const row = q.data?.[0];
  const all = normalizeCardFields(row?.card_fields);
  return { all, visible: all.filter((f) => !f.hidden), row, isLoading: q.isLoading };
}

export function useSaveCardFields() {
  const qc = useQueryClient();
  const { row } = useCardFields();
  return useMutation({
    mutationFn: async (fields: CardField[]) => {
      const payload = {
        ...(row ? { id: row.id } : {}),
        card_fields: fields.map(({ key, label, hidden }) => ({
          key,
          label,
          ...(hidden ? { hidden } : {}),
        })),
      };
      const { error } = await supabase.from("user_settings").upsert(payload as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atlas"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}
