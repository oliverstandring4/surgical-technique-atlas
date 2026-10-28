import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { CONDITION_SECTIONS, copyText, htmlToText, useRemove, useTable } from "@/lib/atlas";
import { RichView } from "@/components/RichEditor";
import { Chip, Empty } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";
import { Breadcrumb, JumpNav } from "@/components/item-nav";

export const Route = createFileRoute("/_authenticated/conditions/$id")({
  head: () => ({ meta: [{ title: "Condition — Operative Atlas" }] }),
  component: ConditionView,
});

function ConditionView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useTable("conditions");
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const operations = useTable("operations").data ?? [];
  const remove = useRemove("conditions");
  if (q.isLoading) return null;
  const c = q.data?.find((x) => x.id === id);
  if (!c) return <Empty>Condition not found.</Empty>;

  const cat = categories.find((x) => x.id === c.category_id);
  const sub = subsections.find((s) => s.id === c.subsection_id);
  const ops = operations.filter((o) => o.condition_ids.includes(c.id));
  const asText = () =>
    [
      c.title,
      ...CONDITION_SECTIONS.map((s) => `\n${s.label.toUpperCase()}\n${htmlToText(c[s.key])}`),
    ].join("\n");

  return (
    <article>
      <Breadcrumb cat={cat} sub={sub} tab="conditions" />
      <h1 className="mt-1 text-3xl leading-tight md:text-4xl">{c.title}</h1>
      {c.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {c.tags.map((t) => (
            <Chip key={t}>#{t}</Chip>
          ))}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/conditions/$id/edit" params={{ id: c.id }}>
            <Pencil /> Edit
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => copyText(asText())}>
          <Copy /> Copy text
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            if (!confirm("Delete this condition?")) return;
            await remove.mutateAsync(c.id);
            if (sub)
              navigate({
                to: "/sub/$id",
                params: { id: sub.id },
                search: { tab: "conditions" },
                replace: true,
              });
            else navigate({ to: "/", replace: true });
          }}
        >
          <Trash2 /> Delete
        </Button>
      </div>

      <JumpNav
        items={[
          ...CONDITION_SECTIONS.map((s) => ({ key: s.key, label: s.label })),
          { key: "ops", label: "Operations" },
        ]}
      />

      <div className="mt-6 space-y-8">
        {CONDITION_SECTIONS.map((s) => (
          <section key={s.key} id={`sec-${s.key}`} className="scroll-mt-32">
            <h2 className="mb-2 border-b border-border pb-1.5 text-xl">{s.label}</h2>
            <RichView html={c[s.key]} />
          </section>
        ))}
        <section id="sec-ops" className="scroll-mt-32">
          <h2 className="mb-2 border-b border-border pb-1.5 text-xl">Operations</h2>
          {ops.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No operations linked. Link them from an operation's edit page.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {ops.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/operations/$id"
                    params={{ id: o.id }}
                    className="text-primary hover:underline"
                  >
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="ghost" size="sm" className="mt-2">
            <Link
              to="/operations/new"
              search={{
                ...(c.category_id ? { category: c.category_id } : {}),
                ...(c.subsection_id ? { sub: c.subsection_id } : {}),
              }}
            >
              <Plus /> New operation here
            </Link>
          </Button>
        </section>
      </div>
    </article>
  );
}
