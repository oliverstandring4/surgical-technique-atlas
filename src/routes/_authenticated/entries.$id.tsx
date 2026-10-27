import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Columns2, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { ENTRY_SECTIONS, copyText, htmlToText, performedLabel, procedureKey, useRemove, useTable } from "@/lib/atlas";
import { RichView } from "@/components/RichEditor";
import { Chip, Empty } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/entries/$id")({
  head: () => ({
    meta: [
      { title: "Entry — Operative Atlas" },
      { name: "description", content: "Case technique entry." },
      { property: "og:title", content: "Entry — Operative Atlas" },
      { property: "og:description", content: "Case technique entry." },
    ],
  }),
  component: EntryView,
});

function EntryView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useTable("entries");
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const orders = useTable("order_sets").data ?? [];
  const remove = useRemove("entries");
  if (q.isLoading) return null;
  const e = q.data?.find((x) => x.id === id);
  if (!e) return <Empty>Entry not found.</Empty>;

  const key = procedureKey(e.title);
  const siblings = (q.data ?? []).filter((x) => x.id !== e.id && procedureKey(x.title) === key);
  const linkedOrders = orders.filter((o) => o.linked_entry_ids.includes(e.id));
  const cat = categories.find((c) => c.id === e.category_id)?.name;
  const sub = subsections.find((s) => s.id === e.subsection_id)?.name;
  const meta = [
    ["Attending", e.attending],
    ["Hospital", e.hospital],
    ["Performed", performedLabel(e)],
    ["Approach", e.approach ?? ""],
  ].filter(([, v]) => v);

  const asText = () =>
    [e.title, ...ENTRY_SECTIONS.map((s) => `\n${s.label.toUpperCase()}\n${htmlToText(e[s.key])}`)].join("\n");

  return (
    <article>
      <p className="eyebrow">{[cat, sub].filter(Boolean).join(" / ") || "Uncategorized"}</p>
      <h1 className="mt-1 text-3xl leading-tight md:text-4xl">{e.title}</h1>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        {meta.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="capitalize-first">{v}</dd>
          </div>
        ))}
      </dl>
      {e.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {e.tags.map((t) => (
            <Link key={t} to="/library" search={{ tag: t }}><Chip>#{t}</Chip></Link>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm"><Link to="/entries/$id/edit" params={{ id: e.id }}><Pencil /> Edit</Link></Button>
        <Button variant="outline" size="sm" onClick={() => copyText(asText())}><Copy /> Copy text</Button>
        <Button variant="ghost" size="sm" onClick={async () => {
          if (!confirm("Delete this entry?")) return;
          await remove.mutateAsync(e.id);
          navigate({ to: "/library", replace: true });
        }}><Trash2 /> Delete</Button>
      </div>

      {(siblings.length > 0 || true) && (
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              {siblings.length > 0
                ? `${siblings.length + 1} versions of this procedure`
                : "Only one version of this procedure"}
            </p>
            <div className="flex gap-2">
              {siblings.length > 0 && (
                <Button asChild variant="outline" size="sm"><Link to="/procedures/$key" params={{ key }}><Columns2 /> Compare</Link></Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/entries/new" search={{ title: e.title, category: e.category_id ?? undefined, subsection: e.subsection_id ?? undefined }}><Plus /> Add version</Link>
              </Button>
            </div>
          </div>
          {siblings.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link to="/entries/$id" params={{ id: s.id }} className="text-primary hover:underline">
                    {s.attending || "Unknown attending"}{performedLabel(s) ? ` · ${performedLabel(s)}` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-8 space-y-8">
        {ENTRY_SECTIONS.map((s) => (
          <section key={s.key}>
            <h2 className="mb-2 border-b border-border pb-1.5 text-xl">{s.label}</h2>
            <RichView html={e[s.key]} />
          </section>
        ))}
      </div>

      {linkedOrders.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-xl">Post-op order sets</h2>
          <ul className="space-y-1 text-sm">
            {linkedOrders.map((o) => (
              <li key={o.id}><Link to="/orders" search={{ open: o.id }} className="text-primary hover:underline">{o.procedure}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
