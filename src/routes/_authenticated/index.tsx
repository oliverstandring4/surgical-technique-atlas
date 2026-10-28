import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ClipboardList, Scissors } from "lucide-react";
import { useTable } from "@/lib/atlas";
import { Empty } from "@/components/atlas-ui";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Home — Operative Atlas" },
      { name: "description", content: "Your surgical technique atlas." },
    ],
  }),
  component: Home,
});

function Home() {
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const operations = useTable("operations").data ?? [];
  const conditions = useTable("conditions").data ?? [];

  const recent = useMemo(
    () =>
      [
        ...operations.map((o) => ({
          id: o.id,
          title: o.title,
          kind: "operation" as const,
          sub: o.subsection_id,
          at: o.updated_at,
        })),
        ...conditions.map((c) => ({
          id: c.id,
          title: c.title,
          kind: "condition" as const,
          sub: c.subsection_id,
          at: c.updated_at,
        })),
      ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 8),
    [operations, conditions],
  );
  const subName = (id: string | null) => subsections.find((s) => s.id === id)?.name ?? "";

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">Operative Atlas</p>
        <h1 className="mt-1 text-4xl">Your atlas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {operations.length} operation{operations.length === 1 ? "" : "s"} · {conditions.length}{" "}
          condition{conditions.length === 1 ? "" : "s"}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {categories.map((c) => {
          const subs = subsections.filter((s) => s.category_id === c.id);
          return (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4 shadow-soft">
              <Link
                to="/category/$id"
                params={{ id: c.id }}
                className="font-serif text-xl hover:text-primary"
              >
                {c.name}
              </Link>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subs.map((s) => (
                  <Link
                    key={s.id}
                    to="/sub/$id"
                    params={{ id: s.id }}
                    search={{ tab: "operations" }}
                    className="rounded-full border border-border bg-paper px-2.5 py-1 text-xs hover:border-primary/40 hover:bg-accent"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="mb-3 text-xl">Recently edited</h2>
        {recent.length === 0 ? (
          <Empty>
            Nothing yet.{" "}
            <Link to="/new" className="text-primary underline-offset-4 hover:underline">
              Add your first operation or condition
            </Link>
          </Empty>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  to={r.kind === "operation" ? "/operations/$id" : "/conditions/$id"}
                  params={{ id: r.id }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50"
                >
                  {r.kind === "operation" ? (
                    <Scissors size={15} className="text-muted-foreground" />
                  ) : (
                    <ClipboardList size={15} className="text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-serif text-base">{r.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{subName(r.sub)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
