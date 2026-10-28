import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Plus } from "lucide-react";
import { useTable } from "@/lib/atlas";
import { attendingName } from "@/components/PreferenceCards";
import { Empty } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "operations" | "conditions";
type S = { tab: Tab };

export const Route = createFileRoute("/_authenticated/sub/$id")({
  validateSearch: (s: Record<string, unknown>): S => ({
    tab: s["tab"] === "conditions" ? "conditions" : "operations",
  }),
  head: () => ({ meta: [{ title: "Subdivision — Operative Atlas" }] }),
  component: SubPage,
});

function SubPage() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/sub/$id" });
  const subs = useTable("subsections");
  const categories = useTable("categories").data ?? [];
  const operations = useTable("operations").data ?? [];
  const conditions = useTable("conditions").data ?? [];
  const cards = useTable("preference_cards").data ?? [];
  if (subs.isLoading) return null;
  const sub = subs.data?.find((s) => s.id === id);
  if (!sub) return <Empty>Subdivision not found.</Empty>;
  const cat = categories.find((c) => c.id === sub.category_id);
  const ops = operations
    .filter((o) => o.subsection_id === id)
    .sort((a, b) => a.title.localeCompare(b.title));
  const conds = conditions
    .filter((c) => c.subsection_id === id)
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div>
      <p className="eyebrow">
        {cat ? (
          <Link to="/category/$id" params={{ id: cat.id }} className="hover:text-foreground">
            {cat.name}
          </Link>
        ) : (
          "Atlas"
        )}
      </p>
      <div className="mt-1 mb-5 flex items-end justify-between gap-4">
        <h1 className="text-3xl md:text-4xl">{sub.name}</h1>
        <Button asChild size="sm">
          <Link
            to={tab === "operations" ? "/operations/new" : "/conditions/new"}
            search={{ sub: sub.id }}
          >
            <Plus /> {tab === "operations" ? "Operation" : "Condition"}
          </Link>
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-border bg-paper p-1">
        {(["operations", "conditions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => navigate({ search: { tab: t }, replace: true })}
            className={cn(
              "rounded px-3 py-2 text-sm capitalize transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {t} <span className="opacity-70">{t === "operations" ? ops.length : conds.length}</span>
          </button>
        ))}
      </div>

      {tab === "operations" ? (
        ops.length === 0 ? (
          <Empty>No operations yet in {sub.name}.</Empty>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {ops.map((o) => {
              const names = cards
                .filter((c) => c.operation_id === o.id)
                .map((c) => attendingName(c.attending));
              return (
                <li key={o.id}>
                  <Link
                    to="/operations/$id"
                    params={{ id: o.id }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-serif text-lg leading-snug">{o.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[o.approach, names.length ? names.join(", ") : "No preference cards"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      ) : conds.length === 0 ? (
        <Empty>
          No conditions yet in {sub.name}. Add topics like "Thyroid nodule" with their workup.
        </Empty>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {conds.map((c) => {
            const n = operations.filter((o) => o.condition_ids.includes(c.id)).length;
            return (
              <li key={c.id}>
                <Link
                  to="/conditions/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg leading-snug">{c.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {n ? `${n} linked operation${n > 1 ? "s" : ""}` : "Workup"}
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
