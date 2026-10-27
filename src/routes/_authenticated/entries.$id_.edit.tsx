import { createFileRoute } from "@tanstack/react-router";
import { EntryForm } from "@/components/EntryForm";
import { Empty, PageHeader } from "@/components/atlas-ui";
import { useTable } from "@/lib/atlas";

export const Route = createFileRoute("/_authenticated/entries/$id_/edit")({
  head: () => ({
    meta: [
      { title: "Edit entry — Operative Atlas" },
      { name: "description", content: "Edit a case entry." },
      { property: "og:title", content: "Edit entry — Operative Atlas" },
      { property: "og:description", content: "Edit a case entry." },
    ],
  }),
  component: EditEntry,
});

function EditEntry() {
  const { id } = Route.useParams();
  const q = useTable("entries");
  useTable("categories");
  if (q.isLoading) return null;
  const entry = q.data?.find((e) => e.id === id);
  if (!entry) return <Empty>Entry not found.</Empty>;
  return (
    <div>
      <PageHeader eyebrow="Edit entry" title={entry.title} />
      <EntryForm initial={entry} />
    </div>
  );
}
