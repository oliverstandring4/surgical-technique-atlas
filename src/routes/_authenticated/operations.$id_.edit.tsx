import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/ItemForm";
import { Empty, PageHeader } from "@/components/atlas-ui";
import { useTable } from "@/lib/atlas";

export const Route = createFileRoute("/_authenticated/operations/$id_/edit")({
  head: () => ({ meta: [{ title: "Edit operation — Operative Atlas" }] }),
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  const q = useTable("operations");
  useTable("categories");
  if (q.isLoading) return null;
  const item = q.data?.find((x) => x.id === id);
  if (!item) return <Empty>Operation not found.</Empty>;
  return (
    <div>
      <PageHeader eyebrow="Edit operation" title={item.title} />
      <ItemForm kind="operations" initial={item} />
    </div>
  );
}
