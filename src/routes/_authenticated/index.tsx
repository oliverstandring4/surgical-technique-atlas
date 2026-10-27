import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { FileText, Hash, ClipboardList } from "lucide-react";
import { useTable } from "@/lib/atlas";
import { EntryCard } from "@/components/EntryCard";
import { Empty } from "@/components/atlas-ui";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Home — Operative Atlas" },
      { name: "description", content: "Recently edited surgical technique entries." },
      { property: "og:title", content: "Home — Operative Atlas" },
      { property: "og:description", content: "Recently edited surgical technique entries." },
    ],
  }),
  component: Home,
});

function Home() {
  const entries = useTable("entries").data ?? [];
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const templates = useTable("op_note_templates").data ?? [];
  const phrases = useTable("dot_phrases").data ?? [];
  const orders = useTable("order_sets").data ?? [];

  const others = useMemo(
    () =>
      [
        ...templates.map((t) => ({ id: t.id, title: t.title, kind: "Template", to: "/templates" as const, at: t.updated_at, icon: FileText })),
        ...phrases.map((t) => ({ id: t.id, title: `.${t.name}`, kind: "Dot phrase", to: "/phrases" as const, at: t.updated_at, icon: Hash })),
        ...orders.map((t) => ({ id: t.id, title: t.procedure, kind: "Order set", to: "/orders" as const, at: t.updated_at, icon: ClipboardList })),
      ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 5),
    [templates, phrases, orders],
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach((e) => e.category_id && m.set(e.category_id, (m.get(e.category_id) ?? 0) + 1));
    return m;
  }, [entries]);

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">Operative Atlas</p>
        <h1 className="mt-1 text-4xl">Your library</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} across {categories.length} categories
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-xl">Recently edited</h2>
        {entries.length === 0 ? (
          <Empty>
            No entries yet.{" "}
            <Link to="/entries/new" className="text-primary underline-offset-4 hover:underline">
              Add your first case
            </Link>
          </Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {entries.slice(0, 8).map((e) => (
              <EntryCard key={e.id} entry={e} categories={categories} subsections={subsections} />
            ))}
          </div>
        )}
        {others.length > 0 && (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {others.map((o) => (
              <li key={o.id}>
                <Link to={o.to} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/50">
                  <o.icon size={15} className="text-muted-foreground" />
                  <span className="flex-1 truncate">{o.title}</span>
                  <span className="text-xs text-muted-foreground">{o.kind}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl">Categories</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/library"
              search={{ category: c.id }}
              className="rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:border-primary/40"
            >
              <p className="font-serif text-[15px] leading-tight">{c.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{counts.get(c.id) ?? 0}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
