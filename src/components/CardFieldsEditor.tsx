import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_CARD_FIELDS,
  newCustomKey,
  useCardFields,
  useSaveCardFields,
  type CardField,
} from "@/lib/card-fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Rename, reorder, hide, add and remove the fields shown on every attending preference card. */
export function CardFieldsEditor() {
  const { all, row } = useCardFields();
  const save = useSaveCardFields();
  const [draft, setDraft] = useState<CardField[] | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const list = draft ?? all;
  const dirty = draft !== null;
  const edit = (fn: (l: CardField[]) => CardField[]) => setDraft(fn([...list]));

  const move = (i: number, dir: -1 | 1) =>
    edit((l) => {
      const a = l[i];
      const b = l[i + dir];
      if (!a || !b) return l;
      l[i] = b;
      l[i + dir] = a;
      return l;
    });

  return (
    <div>
      <ul className="divide-y divide-border rounded-md border border-border">
        {list.map((f, i) => (
          <li
            key={f.key}
            className={cn("flex items-center gap-1 px-2 py-1.5", f.hidden && "opacity-50")}
          >
            <input
              className="field flex-1 py-1"
              value={f.label}
              aria-label="Field name"
              onChange={(e) =>
                edit((l) => l.map((x) => (x.key === f.key ? { ...x, label: e.target.value } : x)))
              }
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label="Move up"
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={i === list.length - 1}
              onClick={() => move(i, 1)}
              aria-label="Move down"
            >
              <ArrowDown />
            </Button>
            {f.builtin ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={f.hidden ? "Show" : "Hide"}
                title={f.hidden ? "Hidden. Tap to show" : "Hide (existing text is kept)"}
                onClick={() =>
                  edit((l) => l.map((x) => (x.key === f.key ? { ...x, hidden: !x.hidden } : x)))
                }
              >
                {f.hidden ? <EyeOff /> : <Eye />}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() =>
                  confirm(
                    `Remove "${f.label}" from cards? Text already saved in it is kept but no longer shown.`,
                  ) && edit((l) => l.filter((x) => x.key !== f.key))
                }
              >
                <Trash2 />
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newLabel.trim()) return;
          edit((l) => [...l, { key: newCustomKey(), label: newLabel.trim(), builtin: false }]);
          setNewLabel("");
        }}
      >
        <input
          className="field"
          placeholder="New field, e.g. Antibiotics"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Plus /> Add
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={!dirty || save.isPending}
          onClick={async () => {
            if (list.some((f) => !f.label.trim())) {
              toast.error("Every field needs a name");
              return;
            }
            await save.mutateAsync(list.map((f) => ({ ...f, label: f.label.trim() })));
            setDraft(null);
            toast.success("Card fields saved");
          }}
        >
          {save.isPending ? "Saving…" : "Save fields"}
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => setDraft(null)}>
            Cancel
          </Button>
        )}
        {!dirty && row && (
          <Button
            variant="ghost"
            onClick={() =>
              confirm(
                "Reset card fields to the defaults? Custom fields are hidden; nothing is deleted.",
              ) && setDraft(DEFAULT_CARD_FIELDS)
            }
          >
            <RotateCcw /> Reset to defaults
          </Button>
        )}
      </div>
    </div>
  );
}
