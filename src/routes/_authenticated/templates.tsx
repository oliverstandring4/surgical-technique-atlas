import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRemove, useSave, useTable, type OpTemplate } from "@/lib/atlas";
import { phiConfirm } from "@/lib/phi-confirm";
import { CopyButton, Empty, Field, PageHeader } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type S = { open?: string };

export const Route = createFileRoute("/_authenticated/templates")({
  validateSearch: (s: Record<string, unknown>): S =>
    typeof s["open"] === "string" ? { open: s["open"] } : {},
  head: () => ({ meta: [{ title: "Op Note Templates — Operative Atlas" }] }),
  component: Templates,
});

type Draft = {
  id?: string;
  title: string;
  category_id: string | null;
  operation_id: string | null;
  body: string;
};

function Templates() {
  const { open } = Route.useSearch();
  const templates = useTable("op_note_templates").data ?? [];
  const categories = useTable("categories").data ?? [];
  const remove = useRemove("op_note_templates");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(open ?? null);
  const [editing, setEditing] = useState<Draft | null>(null);

  const f = filter.toLowerCase();
  const list = templates
    .filter((t) => !f || t.title.toLowerCase().includes(f) || t.body.toLowerCase().includes(f))
    .sort((a, b) => a.title.localeCompare(b.title));
  const groups = [
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: list.filter((t) => t.category_id === c.id),
    })),
    {
      id: "none",
      name: "Uncategorized",
      items: list.filter((t) => !t.category_id || !categories.some((c) => c.id === t.category_id)),
    },
  ].filter((g) => g.items.length);

  return (
    <div>
      <PageHeader
        eyebrow="Op Note Templates"
        title="Templates"
        action={
          <Button
            size="sm"
            onClick={() =>
              setEditing({ title: "", category_id: null, operation_id: null, body: "" })
            }
          >
            <Plus /> New
          </Button>
        }
      />
      <input
        className="field mb-4"
        placeholder="Filter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {groups.length === 0 ? (
        <Empty>{templates.length ? "No templates match." : "No templates yet."}</Empty>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.id}>
              <p className="eyebrow mb-2">{g.name}</p>
              <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                {g.items.map((t) => (
                  <TemplateRow
                    key={t.id}
                    t={t}
                    expanded={expanded === t.id}
                    onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
                    onEdit={() =>
                      setEditing({
                        id: t.id,
                        title: t.title,
                        category_id: t.category_id,
                        operation_id: t.operation_id,
                        body: t.body,
                      })
                    }
                    onDelete={() => confirm(`Delete "${t.title}"?`) && remove.mutate(t.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <TemplateDialog draft={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function TemplateRow({
  t,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  t: OpTemplate;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            size={15}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              !expanded && "-rotate-90",
            )}
          />
          <span className="truncate font-serif text-base">{t.title}</span>
        </button>
        <CopyButton text={t.body} />
      </div>
      {expanded && (
        <div className="mt-3">
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-paper p-3 font-sans text-sm">
            {t.body || "—"}
          </pre>
          <div className="mt-2 flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 /> Delete
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function TemplateDialog({ draft, onClose }: { draft: Draft | null; onClose: () => void }) {
  const save = useSave("op_note_templates");
  const categories = useTable("categories").data ?? [];
  const operations = useTable("operations").data ?? [];
  const [d, setD] = useState<Draft>({ title: "", category_id: null, operation_id: null, body: "" });
  const [openFor, setOpenFor] = useState<Draft | null>(null);
  if (draft !== openFor) {
    setOpenFor(draft);
    if (draft) setD(draft);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (!phiConfirm([d.title, d.body])) return;
    await save.mutateAsync({ ...d, title: d.title.trim() });
    toast.success("Saved");
    onClose();
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            {d.id ? "Edit template" : "New template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <input
              className="field"
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              placeholder="e.g. Robotic distal pancreatectomy"
            />
          </Field>
          <Field label="Category">
            <select
              className="field"
              value={d.category_id ?? ""}
              onChange={(e) => setD({ ...d, category_id: e.target.value || null })}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Operation (optional)" hint="Shows this template on the operation's page">
            <select
              className="field"
              value={d.operation_id ?? ""}
              onChange={(e) => {
                const op = operations.find((o) => o.id === e.target.value);
                setD({
                  ...d,
                  operation_id: op?.id ?? null,
                  category_id: op?.category_id ?? d.category_id,
                });
              }}
            >
              <option value="">—</option>
              {[...operations]
                .filter(
                  (o) =>
                    !d.category_id || o.category_id === d.category_id || o.id === d.operation_id,
                )
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
            </select>
          </Field>
          <Field
            label="Template text"
            hint="Plain text so it pastes cleanly into the EMR. Use *** for blanks."
          >
            <textarea
              className="field min-h-80 font-mono text-[13px]"
              value={d.body}
              onChange={(e) => setD({ ...d, body: e.target.value })}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
