import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRemove, useSave, useTable, type Category } from "@/lib/atlas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Add, rename, reorder and delete the top-level categories (HPB, GI, …). */
export function ManageCategories({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const categories = useTable("categories").data ?? [];
  const operations = useTable("operations").data ?? [];
  const conditions = useTable("conditions").data ?? [];
  const save = useSave("categories");
  const remove = useRemove("categories");
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const move = async (c: Category, dir: -1 | 1) => {
    const arr = [...categories];
    const i = arr.findIndex((x) => x.id === c.id);
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

  const tryDelete = (c: Category) => {
    const n =
      operations.filter((o) => o.category_id === c.id).length +
      conditions.filter((x) => x.category_id === c.id).length;
    if (n > 0) {
      toast.error(
        `"${c.name}" still has ${n} operation${n === 1 ? "" : "s"}/condition${n === 1 ? "" : "s"}. Move or delete them first.`,
      );
      return;
    }
    if (confirm(`Delete "${c.name}" and its subdivisions?`)) remove.mutate(c.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">Categories</DialogTitle>
          <DialogDescription>
            The top-level menu. Subdivisions are edited inside each category.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-border rounded-md border border-border">
          {categories.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">No categories</li>
          )}
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-1 px-2 py-1.5">
              {editing?.id === c.id ? (
                <form
                  className="flex flex-1 gap-1"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (editing.name.trim())
                      await save.mutateAsync({ ...c, name: editing.name.trim() });
                    setEditing(null);
                  }}
                >
                  <input
                    autoFocus
                    className="field py-1"
                    value={editing.name}
                    onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
                  />
                  <Button size="sm" type="submit">
                    Save
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 px-1 text-sm">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={i === 0}
                    onClick={() => move(c, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={i === categories.length - 1}
                    onClick={() => move(c, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ id: c.id, name: c.name })}
                    aria-label="Rename"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => tryDelete(c)}
                    aria-label="Delete"
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
            const max = Math.max(0, ...categories.map((c) => c.position));
            await save.mutateAsync({ name: newName.trim(), position: max + 1 });
            setNewName("");
          }}
        >
          <input
            className="field"
            placeholder="New category, e.g. Thoracic"
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
