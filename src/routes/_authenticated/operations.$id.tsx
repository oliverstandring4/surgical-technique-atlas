import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { OPERATION_SECTIONS, copyText, htmlToText, useRemove, useTable } from "@/lib/atlas";
import { RichView } from "@/components/RichEditor";
import { Popouts } from "@/components/Popouts";
import { supabase } from "@/integrations/supabase/client";
import { PreferenceCards } from "@/components/PreferenceCards";
import { Chip, CopyButton, Empty } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";
import { Breadcrumb, JumpNav } from "@/components/item-nav";

export const Route = createFileRoute("/_authenticated/operations/$id")({
  head: () => ({ meta: [{ title: "Operation — Operative Atlas" }] }),
  component: OperationView,
});

const JUMP = [
  ...OPERATION_SECTIONS.map((s) => ({ key: s.key, label: s.label })),
  { key: "cards", label: "Preference cards" },
];

function OperationView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useTable("operations");
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const conditions = useTable("conditions").data ?? [];
  const templates = useTable("op_note_templates").data ?? [];
  const remove = useRemove("operations");
  if (q.isLoading) return null;
  const op = q.data?.find((x) => x.id === id);
  if (!op) return <Empty>Operation not found.</Empty>;

  const cat = categories.find((c) => c.id === op.category_id);
  const sub = subsections.find((s) => s.id === op.subsection_id);
  const treats = conditions.filter((c) => op.condition_ids.includes(c.id));
  const opTemplates = templates.filter((t) => t.operation_id === op.id);
  const asText = () =>
    [
      op.title,
      ...OPERATION_SECTIONS.map((s) => `\n${s.label.toUpperCase()}\n${htmlToText(op[s.key])}`),
    ].join("\n");

  return (
    <article>
      <Breadcrumb cat={cat} sub={sub} tab="operations" />
      <h1 className="mt-1 text-3xl leading-tight md:text-4xl">{op.title}</h1>
      {(op.approach || op.tags.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1">
          {op.approach && <Chip>{op.approach}</Chip>}
          {op.tags.map((t) => (
            <Chip key={t}>#{t}</Chip>
          ))}
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/operations/$id/edit" params={{ id: op.id }}>
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
            if (!confirm("Delete this operation and its preference cards?")) return;
            await supabase.from("popouts").delete().eq("parent_id", op.id);
            await remove.mutateAsync(op.id);
            if (sub)
              navigate({
                to: "/sub/$id",
                params: { id: sub.id },
                search: { tab: "operations" },
                replace: true,
              });
            else navigate({ to: "/", replace: true });
          }}
        >
          <Trash2 /> Delete
        </Button>
      </div>

      <JumpNav items={JUMP} />

      <div className="mt-6 space-y-8">
        {OPERATION_SECTIONS.map((s) => (
          <section key={s.key} id={`sec-${s.key}`} className="scroll-mt-32">
            <h2 className="mb-2 border-b border-border pb-1.5 text-xl">{s.label}</h2>
            <RichView html={op[s.key]} />
            <Popouts parentType="operation" parentId={op.id} section={s.key} />
          </section>
        ))}
        <section id="sec-cards" className="scroll-mt-32">
          <h2 className="mb-2 border-b border-border pb-1.5 text-xl">Preference cards</h2>
          <PreferenceCards operationId={op.id} operationTitle={op.title} />
        </section>
        {treats.length > 0 && (
          <section>
            <h2 className="mb-2 border-b border-border pb-1.5 text-xl">Treats</h2>
            <ul className="space-y-1 text-sm">
              {treats.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/conditions/$id"
                    params={{ id: c.id }}
                    className="text-primary hover:underline"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section>
          <h2 className="mb-2 border-b border-border pb-1.5 text-xl">Op note templates</h2>
          {opTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              None linked.{" "}
              <Link to="/templates" className="text-primary hover:underline">
                Add one in Templates
              </Link>{" "}
              and pick this operation.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {opTemplates.map((t) => (
                <li key={t.id} className="flex items-center gap-2 px-4 py-2.5">
                  <Link
                    to="/templates"
                    search={{ open: t.id }}
                    className="min-w-0 flex-1 truncate text-sm hover:underline"
                  >
                    {t.title}
                  </Link>
                  <CopyButton text={t.body} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}
