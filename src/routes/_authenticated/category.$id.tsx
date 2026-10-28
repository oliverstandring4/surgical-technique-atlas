import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Settings2 } from "lucide-react";
import { useTable } from "@/lib/atlas";
import { ManageSubdivisions } from "@/components/ManageSubdivisions";
import { Empty, PageHeader } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/category/$id")({
  head: () => ({ meta: [{ title: "Category — Operative Atlas" }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { id } = Route.useParams();
  const cats = useTable("categories");
  const subsections = useTable("subsections").data ?? [];
  const operations = useTable("operations").data ?? [];
  const conditions = useTable("conditions").data ?? [];
  const [manage, setManage] = useState(false);
  if (cats.isLoading) return null;
  const cat = cats.data?.find((c) => c.id === id);
  if (!cat) return <Empty>Category not found.</Empty>;
  const subs = subsections.filter((s) => s.category_id === id);
  const unfiledOps = operations.filter(
    (o) => o.category_id === id && !subs.some((s) => s.id === o.subsection_id),
  );
  const unfiledConds = conditions.filter(
    (c) => c.category_id === id && !subs.some((s) => s.id === c.subsection_id),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Atlas"
        title={cat.name}
        action={
          <Button variant="outline" size="sm" onClick={() => setManage(true)}>
            <Settings2 /> Edit
          </Button>
        }
      />
      {subs.length === 0 ? (
        <Empty>No subdivisions yet. Tap Edit to add some.</Empty>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {subs.map((s) => {
            const nOps = operations.filter((o) => o.subsection_id === s.id).length;
            const nConds = conditions.filter((c) => c.subsection_id === s.id).length;
            return (
              <li key={s.id}>
                <Link
                  to="/sub/$id"
                  params={{ id: s.id }}
                  search={{ tab: "operations" }}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-accent/50"
                >
                  <span className="flex-1">
                    <span className="block font-serif text-lg">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {nOps} operation{nOps === 1 ? "" : "s"} · {nConds} condition
                      {nConds === 1 ? "" : "s"}
                    </span>
                  </span>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {(unfiledOps.length > 0 || unfiledConds.length > 0) && (
        <section className="mt-8">
          <p className="eyebrow mb-2">Not in a subdivision</p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
            {unfiledOps.map((o) => (
              <li key={o.id}>
                <Link
                  to="/operations/$id"
                  params={{ id: o.id }}
                  className="block px-4 py-3 hover:bg-accent/50"
                >
                  {o.title} <span className="text-xs text-muted-foreground">· Operation</span>
                </Link>
              </li>
            ))}
            {unfiledConds.map((c) => (
              <li key={c.id}>
                <Link
                  to="/conditions/$id"
                  params={{ id: c.id }}
                  className="block px-4 py-3 hover:bg-accent/50"
                >
                  {c.title} <span className="text-xs text-muted-foreground">· Condition</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ManageSubdivisions categoryId={id} open={manage} onOpenChange={setManage} />
    </div>
  );
}
