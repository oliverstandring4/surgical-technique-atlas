import { createFileRoute } from "@tanstack/react-router";
import { ItemForm } from "@/components/ItemForm";
import { Empty, PageHeader } from "@/components/atlas-ui";
import { useTable } from "@/lib/atlas";

export const Route = createFileRoute("/_authenticated/conditions/$id_/edit")({
  head: () => ({ meta: [{ title: "Edit condition — Operative Atlas" }] }),
  component: Edit,
});

function Edit() {
  const { id } = Route.useParams();
  const q = useTable("conditions");
  useTable("categories");
  if (q.isLoading) return null;
  const item = q.data?.find((x) => x.id === id);
  if (!item) return <Empty>Condition not found.</Empty>;
  return (
    <div>
      <PageHeader eyebrow="Edit condition" title={item.title} />
      <ItemForm kind="conditions" initial={item} />
    </div>
  );
}
