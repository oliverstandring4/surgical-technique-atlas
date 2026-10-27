import { createFileRoute } from "@tanstack/react-router";
import { EntryForm } from "@/components/EntryForm";
import { PageHeader } from "@/components/atlas-ui";
import { useTable } from "@/lib/atlas";

type S = { title?: string; category?: string; subsection?: string };

export const Route = createFileRoute("/_authenticated/entries/new")({
  validateSearch: (s: Record<string, unknown>): S => ({
    title: typeof s.title === "string" ? s.title : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    subsection: typeof s.subsection === "string" ? s.subsection : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New entry — Operative Atlas" },
      { name: "description", content: "Record how a case was set up and done." },
      { property: "og:title", content: "New entry — Operative Atlas" },
      { property: "og:description", content: "Record how a case was set up and done." },
    ],
  }),
  component: NewEntry,
});

function NewEntry() {
  const s = Route.useSearch();
  const cats = useTable("categories");
  if (cats.isLoading) return null;
  return (
    <div>
      <PageHeader eyebrow="New entry" title={s.title ? s.title : "New case"} />
      <EntryForm prefill={{ title: s.title ?? "", category_id: s.category ?? null, subsection_id: s.subsection ?? null }} />
    </div>
  );
}
