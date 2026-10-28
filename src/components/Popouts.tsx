import { useState } from "react";
import { Copy, Pencil, PanelTop, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { copyText, htmlToText, useRemove, useSave, useTable, type Popout } from "@/lib/atlas";
import { findPhi } from "@/lib/phi-check";
import { RichEditor, RichView } from "./RichEditor";
import { Field } from "./atlas-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ParentType = "operation" | "condition";

/** Suggested pop-out names per section, shown as one-tap chips when adding. */
const SUGGESTIONS: Record<string, string[]> = {
  pre_op: ["Biopsy criteria", "Workup checklist", "Consent points"],
  setup: ["Port map", "Instrument list"],
  intra_op: ["Bailout options"],
  pearls_pitfalls: ["Complications"],
  post_op: ["Orders", "Discharge instructions", "ERAS pathway"],
  history_physical: ["Risk factors"],
  labs: ["Lab panel"],
  imaging: ["Imaging protocol"],
  data: ["Key trials", "Staging table"],
  recommendations: ["Algorithm", "Surveillance schedule"],
};

type Draft = { id?: string; title: string; body: string; position?: number };

/** Buttons under a section that open longer content (tables, orders, instructions) in a pop-up. */
export function Popouts({
  parentType,
  parentId,
  section,
}: {
  parentType: ParentType;
  parentId: string;
  section: string;
}) {
  const items = (useTable("popouts").data ?? []).filter(
    (p) => p.parent_id === parentId && p.section === section,
  );
  const [viewing, setViewing] = useState<Popout | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const remove = useRemove("popouts");

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => setViewing(p)}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-accent/60 px-3 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent active:scale-[0.98]"
        >
          <PanelTop size={14} className="text-primary" /> {p.title}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setEditing({ title: "", body: "" })}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Plus size={13} /> Pop-out
      </button>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing && <RichView html={viewing.body} />}
          <DialogFooter className="flex-row flex-wrap gap-2 sm:justify-start">
            <Button size="sm" onClick={() => viewing && copyText(htmlToText(viewing.body))}>
              <Copy /> Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!viewing) return;
                setEditing({
                  id: viewing.id,
                  title: viewing.title,
                  body: viewing.body,
                  position: viewing.position,
                });
                setViewing(null);
              }}
            >
              <Pencil /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                if (!viewing || !confirm(`Delete "${viewing.title}"?`)) return;
                await remove.mutateAsync(viewing.id);
                setViewing(null);
              }}
            >
              <Trash2 /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PopoutEditor
        draft={editing}
        suggestions={(SUGGESTIONS[section] ?? []).filter(
          (s) => !items.some((i) => i.title.toLowerCase() === s.toLowerCase()),
        )}
        nextPosition={Math.max(0, ...items.map((i) => i.position)) + 1}
        parentType={parentType}
        parentId={parentId}
        section={section}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function PopoutEditor({
  draft,
  suggestions,
  nextPosition,
  parentType,
  parentId,
  section,
  onClose,
}: {
  draft: Draft | null;
  suggestions: string[];
  nextPosition: number;
  parentType: ParentType;
  parentId: string;
  section: string;
  onClose: () => void;
}) {
  const save = useSave("popouts");
  const [d, setD] = useState<Draft>({ title: "", body: "" });
  const [openFor, setOpenFor] = useState<Draft | null>(null);
  const [nonce, setNonce] = useState(0);
  if (draft !== openFor) {
    setOpenFor(draft);
    if (draft) {
      setD(draft);
      setNonce((n) => n + 1);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      toast.error("Give it a name, e.g. Orders");
      return;
    }
    const w = findPhi([d.title, d.body]);
    if (
      w.length &&
      !confirm(
        `This may contain patient details:\n\n${w.map((x) => `• ${x.kind}: ${x.match}`).join("\n")}\n\nSave anyway?`,
      )
    )
      return;
    await save.mutateAsync({
      ...(d.id ? { id: d.id } : {}),
      parent_type: parentType,
      parent_id: parentId,
      section,
      title: d.title.trim(),
      body: d.body,
      position: d.position ?? nextPosition,
    });
    toast.success("Saved");
    onClose();
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            {d.id ? "Edit pop-out" : "New pop-out"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Button name">
            <input
              className="field"
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              placeholder="e.g. Orders"
            />
          </Field>
          {!d.id && suggestions.length > 0 && (
            <div className="-mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setD({ ...d, title: s })}
                  className="rounded-full border border-border bg-paper px-2.5 py-1 text-xs hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Content</span>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Paste a table straight from OpenEvidence, or use the table button.
            </p>
            <RichEditor
              key={nonce}
              value={d.body}
              onChange={(v) => setD((p) => ({ ...p, body: v }))}
            />
          </div>
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
