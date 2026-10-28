import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRemove, useSave, useTable, type DotPhrase } from "@/lib/atlas";
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

export const Route = createFileRoute("/_authenticated/phrases")({
  head: () => ({ meta: [{ title: "Dot Phrases — Operative Atlas" }] }),
  component: Phrases,
});

type Draft = { id?: string; name: string; expansion: string };

function Phrases() {
  const phrases = useTable("dot_phrases").data ?? [];
  const remove = useRemove("dot_phrases");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);

  const f = filter.toLowerCase().replace(/^\./, "");
  const list = [...phrases]
    .filter((p) => !f || p.name.toLowerCase().includes(f) || p.expansion.toLowerCase().includes(f))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader
        eyebrow="Dot Phrases"
        title="Dot phrases"
        action={
          <Button size="sm" onClick={() => setEditing({ name: "", expansion: "" })}>
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
      {list.length === 0 ? (
        <Empty>{phrases.length ? "No phrases match." : "No dot phrases yet."}</Empty>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {list.map((p) => (
            <li key={p.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">.{p.name}</p>
                <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {p.expansion}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <CopyButton text={p.expansion} />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit"
                  onClick={() => setEditing(toDraft(p))}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => confirm(`Delete .${p.name}?`) && remove.mutate(p.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <PhraseDialog draft={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function toDraft(p: DotPhrase): Draft {
  return { id: p.id, name: p.name, expansion: p.expansion };
}

function PhraseDialog({ draft, onClose }: { draft: Draft | null; onClose: () => void }) {
  const save = useSave("dot_phrases");
  const [d, setD] = useState<Draft>({ name: "", expansion: "" });
  const [openFor, setOpenFor] = useState<Draft | null>(null);
  if (draft !== openFor) {
    setOpenFor(draft);
    if (draft) setD(draft);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = d.name.trim().replace(/^\./, "");
    if (!name) {
      toast.error("Add a name");
      return;
    }
    if (!phiConfirm([name, d.expansion])) return;
    await save.mutateAsync({ ...d, name });
    toast.success("Saved");
    onClose();
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            {d.id ? "Edit phrase" : "New phrase"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name">
            <input
              className="field font-mono"
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
              placeholder="whippleplan"
            />
          </Field>
          <Field label="Expansion">
            <textarea
              className="field min-h-48"
              value={d.expansion}
              onChange={(e) => setD({ ...d, expansion: e.target.value })}
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
