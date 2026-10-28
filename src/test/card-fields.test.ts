import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { cardValue, DEFAULT_CARD_FIELDS, normalizeCardFields } from "@/lib/card-fields";

describe("card fields", () => {
  it("falls back to defaults when nothing is saved", () => {
    expect(normalizeCardFields([])).toEqual(DEFAULT_CARD_FIELDS);
    expect(normalizeCardFields(null)).toEqual(DEFAULT_CARD_FIELDS);
  });
  it("keeps saved order, labels, hidden flags and custom fields; re-adds missing built-ins", () => {
    const f = normalizeCardFields([
      { key: "c_abc", label: "Antibiotics" },
      { key: "positioning", label: "Position", hidden: true },
      { key: "positioning", label: "dupe" },
      { nonsense: 1 },
    ]);
    expect(f[0]).toEqual({ key: "c_abc", label: "Antibiotics", builtin: false });
    expect(f[1]).toEqual({ key: "positioning", label: "Position", builtin: true, hidden: true });
    expect(f.map((x) => x.key)).toContain("notes");
    expect(f.filter((x) => x.key === "positioning")).toHaveLength(1);
  });
  it("reads built-in columns and custom values", () => {
    const card = { positioning: "supine", custom: { c_abc: "cefazolin" } };
    expect(cardValue(card, { key: "positioning", label: "", builtin: true })).toBe("supine");
    expect(cardValue(card, { key: "c_abc", label: "", builtin: false })).toBe("cefazolin");
    expect(cardValue({ custom: null } as never, { key: "c_x", label: "", builtin: false })).toBe(
      "",
    );
  });
});
