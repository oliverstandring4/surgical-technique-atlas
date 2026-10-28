import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRemove, useSave, useTable, type PreferenceCard } from "@/lib/atlas";
import { cardValue, useCardFields, type CardField } from "@/lib/card-fields";
import { phiConfirm } from "@/lib/phi-confirm";
import { CopyButton, Empty, Field } from "./atlas-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Draft = {
  id?: string;
  attending: string;
  hospital: string;
  position?: number;
  values: Record<string, string>;
  /** Existing custom values, kept so hidden/removed fields aren't lost. */
  custom: Record<string, unknown>;
};

const blank = (): Draft => ({ attending: "", hospital: "", values: {}, custom: {} });

function customOf(c: PreferenceCard): Record<string, unknown> {
  return c.custom && typeof c.custom === "object" && !Array.isArray(c.custom)
    ? (c.custom as Record<string, unknown>)
    : {};
}

function toDraft(c: PreferenceCard, fields: CardField[]): Draft {
  return {
    id: c.id,
    attending: c.attending,
    hospital: c.hospital,
    position: c.position,
    values: Object.fromEntries(fields.map((f) => [f.key, cardValue(c, f)])),
    custom: customOf(c),
  };
}

export function attendingName(name: string) {
  const n = name.trim().replace(/^dr\.?\s*/i, "");
  return n ? `Dr. ${n}` : "Unnamed attending";
}

export function cardText(title: string, c: PreferenceCard, fields: CardField[]) {
  const lines = [`${title} | ${attendingName(c.attending)}${c.hospital ? ` (${c.hospital})` : ""}`];
  for (const f of fields) {
    const v = cardValue(c, f).trim();
    if (v) lines.push(`\n${f.label.toUpperCase()}\n${v}`);
  }
  return lines.join("\n");
}

export function PreferenceCards({
  operationId,
  operationTitle,
}: {
  operationId: string;
  operationTitle: string;
}) {
  const cards = (useTable("preference_cards").data ?? []).filter(
    (c) => c.operation_id === operationId,
  );
  const { visible } = useCardFields();
  const remove = useRemove("preference_cards");
  const [editing, setEditing] = useState<Draft | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {cards.length
            ? `${cards.length} attending${cards.length > 1 ? "s" : ""}. Swipe to compare.`
            : "How each attending likes it done."}
        </p>
        <Button size="sm" variant="outline" onClick={() => setEditing(blank())}>
          <Plus /> Add attending
        </Button>
      </div>
      {cards.length === 0 ? (
        <Empty>No preference cards yet.</Empty>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
          {cards.map((c) => (
            <div
              key={c.id}
              className="w-[85vw] max-w-sm shrink-0 snap-start rounded-lg border border-border bg-card p-4 shadow-soft md:w-80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg">{attendingName(c.attending)}</p>
                  {c.hospital && <p className="text-xs text-muted-foreground">{c.hospital}</p>}
                </div>
                <CopyButton text={cardText(operationTitle, c, visible)} />
              </div>
              <dl className="mt-3 space-y-3">
                {visible
                  .filter((f) => cardValue(c, f).trim())
                  .map((f) => (
                    <div key={f.key}>
                      <dt className="eyebrow">{f.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap text-sm">{cardValue(c, f)}</dd>
                    </div>
                  ))}
              </dl>
              <div className="mt-3 flex gap-1 border-t border-border pt-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(toDraft(c, visible))}>
                  <Pencil /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    confirm(`Delete ${attendingName(c.attending)}'s card?`) && remove.mutate(c.id)
                  }
                >
                  <Trash2 /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <CardDialog
        draft={editing}
        fields={visible}
        operationId={operationId}
        nextPosition={Math.max(0, ...cards.map((c) => c.position)) + 1}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function CardDialog({
  draft,
  fields,
  operationId,
  nextPosition,
  onClose,
}: {
  draft: Draft | null;
  fields: CardField[];
  operationId: string;
  nextPosition: number;
  onClose: () => void;
}) {
  const save = useSave("preference_cards");
  const all = useTable("preference_cards").data ?? [];
  const attendings = [...new Set(all.map((c) => c.attending).filter(Boolean))].sort();
  const hospitals = [...new Set(all.map((c) => c.hospital).filter(Boolean))].sort();
  const [d, setD] = useState<Draft>(blank);
  const [openFor, setOpenFor] = useState<Draft | null>(null);
  if (draft !== openFor) {
    setOpenFor(draft);
    if (draft) setD(draft);
  }
  const setValue = (k: string, v: string) =>
    setD((p) => ({ ...p, values: { ...p.values, [k]: v } }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.attending.trim()) {
      toast.error("Add the attending's name");
      return;
    }
    if (!phiConfirm(Object.values(d.values))) return;
    const builtins = Object.fromEntries(
      fields.filter((f) => f.builtin).map((f) => [f.key, d.values[f.key] ?? ""]),
    );
    const custom = {
      ...d.custom,
      ...Object.fromEntries(
        fields.filter((f) => !f.builtin).map((f) => [f.key, d.values[f.key] ?? ""]),
      ),
    };
    await save.mutateAsync({
      ...(d.id ? { id: d.id } : {}),
      attending: d.attending.trim(),
      hospital: d.hospital.trim(),
      operation_id: operationId,
      position: d.position ?? nextPosition,
      ...builtins,
      custom: custom as never,
    });
    toast.success("Saved");
    onClose();
  }

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            {d.id ? "Edit preference card" : "New preference card"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Attending">
              <input
                className="field"
                list="card-attendings"
                value={d.attending}
                onChange={(e) => setD({ ...d, attending: e.target.value })}
              />
              <datalist id="card-attendings">
                {attendings.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>
            <Field label="Hospital">
              <input
                className="field"
                list="card-hospitals"
                value={d.hospital}
                onChange={(e) => setD({ ...d, hospital: e.target.value })}
              />
              <datalist id="card-hospitals">
                {hospitals.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </Field>
          </div>
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              <textarea
                className="field min-h-20"
                value={d.values[f.key] ?? ""}
                onChange={(e) => setValue(f.key, e.target.value)}
              />
            </Field>
          ))}
          <Link
            to="/settings"
            hash="card-fields"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <Settings2 size={12} /> Change which fields cards have
          </Link>
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
