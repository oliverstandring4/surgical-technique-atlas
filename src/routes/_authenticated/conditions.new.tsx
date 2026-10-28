import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/ItemForm";
import { PageHeader } from "@/components/atlas-ui";
import { useTable } from "@/lib/atlas";

type S = { title?: string; category?: string; sub?: string };

export const Route = createFileRoute("/_authenticated/conditions/new")({
  validateSearch: (s: Record<string, unknown>): S => {
    const out: S = {};
    for (const k of ["title", "category", "sub"] as const) {
      const v = s[k];
      if (typeof v === "string" && v) out[k] = v;
    }
    return out;
  },
  head: () => ({ meta: [{ title: "New condition — Operative Atlas" }] }),
  component: New,
});

function New() {
  const s = Route.useSearch();
  const cats = useTable("categories");
  const subs = useTable("subsections");
  if (cats.isLoading || subs.isLoading) return null;
  const sub = subs.data?.find((x) => x.id === s.sub);
  return (
    <div>
      <PageHeader
        eyebrow={sub ? `New condition · ${sub.name}` : "New condition"}
        title={s.title || "New condition"}
      />
      <ItemForm
        kind="conditions"
        prefill={{
          title: s.title ?? "",
          category_id: sub?.category_id ?? s.category ?? null,
          subsection_id: sub?.id ?? null,
        }}
      />
    </div>
  );
}
