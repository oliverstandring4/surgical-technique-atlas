import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { parseBackup, planImport, toCsv } from "@/lib/backup";

describe("toCsv", () => {
  it("escapes quotes, commas, newlines and joins arrays", () => {
    const csv = toCsv([{ a: 'say "hi"', b: "x,y", c: "l1\nl2", d: ["t1", "t2"], e: null }]);
    expect(csv).toBe('a,b,c,d,e\r\n"say ""hi""","x,y","l1\nl2",t1; t2,');
  });
});

describe("parseBackup", () => {
  it("reads the export format", () => {
    const t = parseBackup(
      JSON.stringify({
        app: "operative-atlas",
        tables: { dot_phrases: [{ id: "p1", name: "x" }] },
      }),
    );
    expect(t.dot_phrases).toHaveLength(1);
  });
  it("rejects unrelated JSON", () => {
    expect(() => parseBackup('{"foo":1}')).toThrow();
  });
});

describe("planImport", () => {
  it("merges categories/subsections by name and remaps references", () => {
    const plan = planImport(
      {
        categories: [
          { id: "oldHPB", name: "HPB" },
          { id: "newCat", name: "Thoracic" },
        ],
        subsections: [
          { id: "oldLiver", category_id: "oldHPB", name: "Liver" },
          { id: "newSub", category_id: "oldHPB", name: "Portal" },
        ],
        entries: [
          {
            id: "e1",
            title: "Right hepatectomy",
            category_id: "oldHPB",
            subsection_id: "oldLiver",
            user_id: "someoneElse",
          },
        ],
        op_note_templates: [{ id: "t1", category_id: "newCat" }],
      },
      {
        categories: [{ id: "HPB", name: "hpb" }],
        subsections: [{ id: "Liver", category_id: "HPB", name: "Liver" }],
      },
      "me",
    );
    expect(plan.categories?.map((c) => c["id"])).toEqual(["newCat"]);
    expect(plan.subsections).toEqual([
      { id: "newSub", category_id: "HPB", name: "Portal", user_id: "me" },
    ]);
    expect(plan.entries?.[0]).toMatchObject({
      category_id: "HPB",
      subsection_id: "Liver",
      user_id: "me",
    });
    expect(plan.op_note_templates?.[0]).toMatchObject({ category_id: "newCat" });
  });
});

describe("planImport v2 tables", () => {
  it("remaps operations and conditions to merged subdivisions", () => {
    const plan = planImport(
      {
        categories: [{ id: "oldEndo", name: "Endocrine" }],
        subsections: [{ id: "oldThy", category_id: "oldEndo", name: "Thyroid" }],
        conditions: [
          { id: "c1", title: "Thyroid nodule", category_id: "oldEndo", subsection_id: "oldThy" },
        ],
        operations: [
          {
            id: "o1",
            title: "Lobectomy",
            category_id: "oldEndo",
            subsection_id: "oldThy",
            condition_ids: ["c1"],
          },
        ],
        preference_cards: [{ id: "p1", operation_id: "o1", attending: "Smith" }],
      },
      {
        categories: [{ id: "Endo", name: "Endocrine" }],
        subsections: [{ id: "Thy", category_id: "Endo", name: "Thyroid" }],
      },
      "me",
    );
    expect(plan.conditions?.[0]).toMatchObject({
      category_id: "Endo",
      subsection_id: "Thy",
      user_id: "me",
    });
    expect(plan.operations?.[0]).toMatchObject({
      category_id: "Endo",
      subsection_id: "Thy",
      condition_ids: ["c1"],
    });
    expect(plan.preference_cards?.[0]).toMatchObject({ operation_id: "o1", user_id: "me" });
  });
});
