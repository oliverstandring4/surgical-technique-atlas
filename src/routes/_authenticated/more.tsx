import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText, Hash, Link2, Settings } from "lucide-react";
import { useTable } from "@/lib/atlas";
import { PageHeader } from "@/components/atlas-ui";

export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({ meta: [{ title: "Atlas — Operative Atlas" }] }),
  component: More,
});

const TOOLS = [
  { to: "/templates", label: "Op Note Templates", icon: FileText },
  { to: "/phrases", label: "Dot Phrases", icon: Hash },
  { to: "/links", label: "Links", icon: Link2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function More() {
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Operative Atlas" title="Atlas" />
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              to="/category/$id"
              params={{ id: c.id }}
              className="flex items-center gap-3 px-4 py-4 hover:bg-accent/50"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg">{c.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {subsections
                    .filter((s) => s.category_id === c.id)
                    .map((s) => s.name)
                    .join(" · ")}
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <section>
        <p className="eyebrow mb-2">Tools</p>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {TOOLS.map((i) => (
            <li key={i.to}>
              <Link
                to={i.to}
                className="flex items-center gap-3 px-4 py-4 text-base hover:bg-accent/50"
              >
                <i.icon size={18} className="text-muted-foreground" />
                <span className="flex-1">{i.label}</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
