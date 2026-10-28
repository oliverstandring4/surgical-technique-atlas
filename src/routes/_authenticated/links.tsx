import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRemove, useSave, useTable, type SavedLink } from "@/lib/atlas";
import { Empty, Field, PageHeader } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/links")({
  head: () => ({ meta: [{ title: "Links — Operative Atlas" }] }),
  component: Links,
});

type Draft = { id?: string; title: string; url: string; note: string; position?: number };

function Links() {
  const links = useTable("saved_links").data ?? [];
  const save = useSave("saved_links");
  const remove = useRemove("saved_links");
  const [editing, setEditing] = useState<Draft | null>(null);

  const move = async (l: SavedLink, dir: -1 | 1) => {
    const arr = [...links];
    const i = arr.findIndex((x) => x.id === l.id);
    const j = i + dir;
    const a = arr[i];
    const b = arr[j];
    if (!a || !b) return;
    arr[i] = b;
    arr[j] = a;
    await Promise.all(
      arr.map((x, idx) =>
        x.position !== idx + 1 ? save.mutateAsync({ ...x, position: idx + 1 }) : null,
      ),
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Links"
        title="Saved links"
        action={
          <Button size="sm" onClick={() => setEditing({ title: "", url: "", note: "" })}>
            <Plus /> New
          </Button>
        }
      />
      {links.length === 0 ? (
        <Empty>No links yet. Save your Google Drive folders, protocols, and references here.</Empty>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {links.map((l, i) => (
            <li key={l.id} className="flex items-center gap-2 px-3 py-2.5">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 rounded px-1 py-1 hover:bg-accent/50"
              >
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  {l.title} <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                </p>
                {l.note && <p className="truncate text-xs text-muted-foreground">{l.note}</p>}
              </a>
              <div className="flex shrink-0 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={i === 0}
                  onClick={() => move(l, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={i === links.length - 1}
                  onClick={() => move(l, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit"
                  onClick={() =>
                    setEditing({
                      id: l.id,
                      title: l.title,
                      url: l.url,
                      note: l.note,
                      position: l.position,
                    })
                  }
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete"
                  onClick={() => confirm(`Delete "${l.title}"?`) && remove.mutate(l.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <LinkDialog
        draft={editing}
        nextPosition={Math.max(0, ...links.map((l) => l.position)) + 1}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function LinkDialog({
  draft,
  nextPosition,
  onClose,
}: {
  draft: Draft | null;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = useSave("saved_links");
  const [d, setD] = useState<Draft>({ title: "", url: "", note: "" });
  const [openFor, setOpenFor] = useState<Draft | null>(null);
  if (draft !== openFor) {
    setOpenFor(draft);
    if (draft) setD(draft);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    let url = d.url.trim();
    if (!d.title.trim() || !url) {
      toast.error("Add a title and URL");
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    await save.mutateAsync({
      ...d,
      title: d.title.trim(),
      url,
      position: d.position ?? nextPosition,
    });
    toast.success("Saved");
    onClose();
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            {d.id ? "Edit link" : "New link"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <input
              className="field"
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
            />
          </Field>
          <Field label="URL">
            <input
              className="field"
              type="url"
              inputMode="url"
              value={d.url}
              onChange={(e) => setD({ ...d, url: e.target.value })}
              placeholder="https://drive.google.com/…"
            />
          </Field>
          <Field label="Note (optional)">
            <input
              className="field"
              value={d.note}
              onChange={(e) => setD({ ...d, note: e.target.value })}
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
