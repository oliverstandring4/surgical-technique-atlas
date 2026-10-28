import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useRemove, useSave, useTable, type Subsection } from "@/lib/atlas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Add, rename, reorder and delete the subdivisions of one category. */
export function ManageSubdivisions({
  categoryId,
  open,
  onOpenChange,
}: {
  categoryId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const save = useSave("subsections");
  const remove = useRemove("subsections");
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const list = subsections.filter((s) => s.category_id === categoryId);
  const catName = categories.find((c) => c.id === categoryId)?.name ?? "";

  const move = async (s: Subsection, dir: -1 | 1) => {
    const arr = [...list];
    const i = arr.findIndex((x) => x.id === s.id);
    const a = arr[i];
    const b = arr[i + dir];
    if (!a || !b) return;
    arr[i] = b;
    arr[i + dir] = a;
    await Promise.all(
      arr.map((x, idx) =>
        x.position !== idx + 1 ? save.mutateAsync({ ...x, position: idx + 1 }) : null,
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            {catName} subdivisions
          </DialogTitle>
          <DialogDescription>
            Deleting a subdivision keeps its operations and conditions; they just become unfiled.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-border rounded-md border border-border">
          {list.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">No subdivisions</li>
          )}
          {list.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1 px-2 py-1.5">
              {editing?.id === s.id ? (
                <form
                  className="flex flex-1 gap-1"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (editing.name.trim())
                      await save.mutateAsync({ ...s, name: editing.name.trim() });
                    setEditing(null);
                  }}
                >
                  <input
                    autoFocus
                    className="field py-1"
                    value={editing.name}
                    onChange={(e) => setEditing({ id: s.id, name: e.target.value })}
                  />
                  <Button size="sm" type="submit">
                    Save
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 px-1 text-sm">{s.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={i === 0}
                    onClick={() => move(s, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={i === list.length - 1}
                    onClick={() => move(s, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ id: s.id, name: s.name })}
                    aria-label="Rename"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => confirm(`Delete "${s.name}"?`) && remove.mutate(s.id)}
                  >
                    <Trash2 />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            const max = Math.max(0, ...list.map((s) => s.position));
            await save.mutateAsync({
              category_id: categoryId,
              name: newName.trim(),
              position: max + 1,
            });
            setNewName("");
          }}
        >
          <input
            className="field"
            placeholder="New subdivision"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit">
            <Plus /> Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
