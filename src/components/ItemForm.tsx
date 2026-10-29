import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ClipboardPaste, Copy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  APPROACHES,
  CONDITION_SECTIONS,
  OPERATION_SECTIONS,
  useSave,
  useTable,
  type Condition,
  type Operation,
} from "@/lib/atlas";
import { findPhi, type PhiWarning } from "@/lib/phi-check";
import { CONDITION_RULES, OPERATION_RULES, parseSections } from "@/lib/parse-sections";
import { plainToHtml } from "@/lib/parse-note";
import { RichEditor, RichView } from "./RichEditor";
import { Field } from "./atlas-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export type ItemKind = "operations" | "conditions";

type Draft = {
  id?: string;
  title: string;
  category_id: string | null;
  subsection_id: string | null;
  tags: string[];
  is_shared: boolean;
  approach: string | null;
  condition_ids: string[];
  sections: Record<string, string>;
};

export type ItemPrefill = {
  title?: string;
  category_id?: string | null;
  subsection_id?: string | null;
};

function sectionsFor(kind: ItemKind) {
  return kind === "operations" ? OPERATION_SECTIONS : CONDITION_SECTIONS;
}

function toDraft(
  kind: ItemKind,
  item: Operation | Condition | undefined,
  prefill: ItemPrefill | undefined,
): Draft {
  const secs = sectionsFor(kind);
  const rec = item as unknown as Record<string, unknown> | undefined;
  return {
    ...(item ? { id: item.id } : {}),
    title: item?.title ?? prefill?.title ?? "",
    category_id: item?.category_id ?? prefill?.category_id ?? null,
    subsection_id: item?.subsection_id ?? prefill?.subsection_id ?? null,
    tags: item?.tags ?? [],
    is_shared: item?.is_shared ?? false,
    approach: (rec?.["approach"] as string | null | undefined) ?? null,
    condition_ids: (rec?.["condition_ids"] as string[] | undefined) ?? [],
    sections: Object.fromEntries(
      secs.map((s) => [s.key, (rec?.[s.key] as string | undefined) ?? ""]),
    ),
  };
}

export function ItemForm({
  kind,
  initial,
  prefill,
}: {
  kind: ItemKind;
  initial?: Operation | Condition;
  prefill?: ItemPrefill;
}) {
  const navigate = useNavigate();
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const conditions = useTable("conditions").data ?? [];
  const peers = useTable(kind).data ?? [];
  const saveOp = useSave("operations");
  const saveCond = useSave("conditions");
  const save = kind === "operations" ? saveOp : saveCond;
  const secs = sectionsFor(kind);
  const isOp = kind === "operations";

  const [d, setD] = useState<Draft>(() => toDraft(kind, initial, prefill));
  const [tagText, setTagText] = useState(d.tags.join(", "));
  const [editorKey, setEditorKey] = useState(0);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [warnings, setWarnings] = useState<PhiWarning[] | null>(null);
  const [condFilter, setCondFilter] = useState("");
  const [copyTarget, setCopyTarget] = useState<{ key: string; label: string } | null>(null);

  const subs = subsections.filter((s) => s.category_id === d.category_id);
  const titles = [...new Set(peers.map((p) => p.title))];
  const setSection = (k: string, v: string) =>
    setD((p) => ({ ...p, sections: { ...p.sections, [k]: v } }));

  async function doSave() {
    const tags = tagText
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    const base = {
      ...(d.id ? { id: d.id } : {}),
      title: d.title.trim(),
      category_id: d.category_id,
      subsection_id: d.subsection_id,
      tags,
      is_shared: d.is_shared,
      ...d.sections,
    };
    if (isOp) {
      const saved = await saveOp.mutateAsync({
        ...base,
        approach: d.approach,
        condition_ids: d.condition_ids,
      });
      toast.success("Saved");
      navigate({ to: "/operations/$id", params: { id: saved.id }, replace: true });
    } else {
      const saved = await saveCond.mutateAsync(base);
      toast.success("Saved");
      navigate({ to: "/conditions/$id", params: { id: saved.id }, replace: true });
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      toast.error(isOp ? "Add the operation name" : "Add the condition name");
      return;
    }
    const w = findPhi([d.title, tagText, ...Object.values(d.sections)]);
    if (w.length) setWarnings(w);
    else void doSave();
  }

  function applyPaste() {
    const parsed = parseSections(
      pasteText,
      (isOp ? OPERATION_RULES : CONDITION_RULES) as {
        key: string;
        re: RegExp;
        keepHeading?: boolean;
      }[],
    );
    const keys = Object.keys(parsed);
    if (!keys.length) {
      toast.error(`No headings found (${secs.map((s) => s.label).join(", ")})`);
      return;
    }
    setD((p) => ({
      ...p,
      sections: {
        ...p.sections,
        ...Object.fromEntries(keys.map((k) => [k, plainToHtml(parsed[k]!)])),
      },
    }));
    setEditorKey((k) => k + 1);
    setPasteOpen(false);
    setPasteText("");
    toast.success(`Filled ${keys.length} section${keys.length > 1 ? "s" : ""}`);
  }

  const cf = condFilter.toLowerCase();
  const condOptions = conditions
    .filter(
      (c) =>
        d.condition_ids.includes(c.id) ||
        (!cf ? c.subsection_id === d.subsection_id : c.title.toLowerCase().includes(cf)),
    )
    .sort(
      (a, b) =>
        Number(d.condition_ids.includes(b.id)) - Number(d.condition_ids.includes(a.id)) ||
        a.title.localeCompare(b.title),
    );

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <span>
          No names, MRNs, DOBs, or identifying details{isOp ? ", including in photos" : ""}.
        </span>
      </div>

      <section className="space-y-4">
        <Field label={isOp ? "Operation" : "Condition"}>
          <input
            className="field font-serif text-lg"
            list="item-titles"
            value={d.title}
            onChange={(e) => setD({ ...d, title: e.target.value })}
            placeholder={isOp ? "e.g. Pancreaticoduodenectomy" : "e.g. Thyroid nodule"}
          />
          <datalist id="item-titles">
            {titles.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select
              className="field"
              value={d.category_id ?? ""}
              onChange={(e) =>
                setD({ ...d, category_id: e.target.value || null, subsection_id: null })
              }
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subdivision">
            <select
              className="field"
              value={d.subsection_id ?? ""}
              onChange={(e) => setD({ ...d, subsection_id: e.target.value || null })}
              disabled={!subs.length}
            >
              <option value="">—</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {isOp && (
          <Field label="Approach">
            <div className="grid grid-cols-4 gap-1 rounded-md border border-input bg-paper p-1">
              {APPROACHES.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setD({ ...d, approach: d.approach === a ? null : a })}
                  className={`rounded px-1 py-2 text-xs capitalize transition-colors sm:text-sm ${d.approach === a ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                >
                  {a === "laparoscopic" ? "Lap" : a}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Tags" hint="Comma separated">
          <input
            className="field"
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            placeholder={isOp ? "PV resection, drain" : "Bethesda, RAS"}
          />
        </Field>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">{isOp ? "Operation" : "Workup"}</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setPasteOpen(true)}>
            <ClipboardPaste /> Paste note
          </Button>
        </div>
        {secs.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base">{s.label}</h3>
              <button
                type="button"
                onClick={() => setCopyTarget({ key: s.key, label: s.label })}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy size={13} /> Copy from…
              </button>
            </div>
            {s.hint && <p className="mb-1.5 text-xs text-muted-foreground">{s.hint}</p>}
            <div className={s.hint ? "" : "mt-1.5"}>
              <RichEditor
                key={`${s.key}-${editorKey}`}
                value={d.sections[s.key] ?? ""}
                onChange={(v) => setSection(s.key, v)}
              />
            </div>
          </div>
        ))}
      </section>

      {isOp && (
        <Field
          label={`Treats conditions${d.condition_ids.length ? ` (${d.condition_ids.length} linked)` : ""}`}
        >
          <div className="rounded-md border border-border">
            <input
              className="field rounded-b-none border-0 border-b"
              placeholder="Find any condition"
              value={condFilter}
              onChange={(e) => setCondFilter(e.target.value)}
            />
            <ul className="max-h-48 overflow-y-auto">
              {condOptions.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {conditions.length
                    ? "No conditions in this subdivision. Search to find others."
                    : "No conditions yet."}
                </li>
              )}
              {condOptions.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50">
                    <input
                      type="checkbox"
                      checked={d.condition_ids.includes(c.id)}
                      onChange={() =>
                        setD((p) => ({
                          ...p,
                          condition_ids: p.condition_ids.includes(c.id)
                            ? p.condition_ids.filter((x) => x !== c.id)
                            : [...p.condition_ids, c.id],
                        }))
                      }
                    />
                    <span className="truncate">{c.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </Field>
      )}

      <label className="flex items-center justify-between rounded-md border border-border px-3 py-3">
        <span>
          <span className="block text-sm">Shared</span>
          <span className="block text-xs text-muted-foreground">
            Sharing with co-fellows is coming later. For now, only you can see this.
          </span>
        </span>
        <Switch checked={d.is_shared} onCheckedChange={(v) => setD({ ...d, is_shared: v })} />
      </label>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex gap-2 rounded-lg border border-border bg-background/95 p-2 backdrop-blur md:bottom-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" className="flex-[2]" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <CopyFromDialog
        target={copyTarget}
        sources={peers
          .filter((p) => p.id !== d.id)
          .map((p) => ({ id: p.id, title: p.title, rec: p as unknown as Record<string, unknown> }))}
        sections={secs}
        hasContent={!!copyTarget && !!d.sections[copyTarget.key]}
        onClose={() => setCopyTarget(null)}
        onApply={(html, mode) => {
          if (!copyTarget) return;
          const cur = d.sections[copyTarget.key] ?? "";
          setSection(copyTarget.key, mode === "append" && cur ? cur + html : html);
          setEditorKey((k) => k + 1);
          setCopyTarget(null);
          toast.success(`Copied into ${copyTarget.label}`);
        }}
      />

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">Paste note</DialogTitle>
            <DialogDescription>
              Use headings: {secs.map((s) => s.label).join(", ")}. Matching sections will be
              replaced.
            </DialogDescription>
          </DialogHeader>
          <textarea
            className="field min-h-64 font-mono text-sm"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={secs.map((s) => `${s.label}:\n...`).join("\n\n")}
          />
          <DialogFooter>
            <Button type="button" onClick={applyPaste}>
              Split into sections
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!warnings} onOpenChange={(o) => !o && setWarnings(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">
              Possible identifiers
            </DialogTitle>
            <DialogDescription>
              This text looks like it may contain patient details. Check before saving.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {warnings?.map((w, i) => (
              <li
                key={i}
                className="flex justify-between gap-3 rounded bg-warning-soft px-3 py-1.5"
              >
                <span className="text-warning">{w.kind}</span>
                <code className="truncate">{w.match}</code>
              </li>
            ))}
          </ul>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setWarnings(null)}>
              Go back and edit
            </Button>
            <Button
              type="button"
              onClick={() => {
                setWarnings(null);
                void doSave();
              }}
            >
              Save anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

type CopySource = { id: string; title: string; rec: Record<string, unknown> };

/** Pick another operation's (or condition's) section and copy its content into this one. */
function CopyFromDialog({
  target,
  sources,
  sections,
  hasContent,
  onClose,
  onApply,
}: {
  target: { key: string; label: string } | null;
  sources: CopySource[];
  sections: readonly { key: string; label: string }[];
  hasContent: boolean;
  onClose: () => void;
  onApply: (html: string, mode: "replace" | "append") => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<{ title: string; label: string; html: string } | null>(null);
  const [openFor, setOpenFor] = useState(target);
  if (target !== openFor) {
    setOpenFor(target);
    setQ("");
    setPicked(null);
  }

  const ql = q.trim().toLowerCase();
  const options = sources
    .flatMap((src) =>
      sections.map((sec) => ({
        id: `${src.id}-${sec.key}`,
        title: src.title,
        label: sec.label,
        same: sec.key === target?.key,
        html: (src.rec[sec.key] as string | undefined) ?? "",
      })),
    )
    .filter((o) => o.html && (!ql || `${o.title} ${o.label}`.toLowerCase().includes(ql)))
    .sort((a, b) => Number(b.same) - Number(a.same) || a.title.localeCompare(b.title));

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">
            Copy into {target?.label}
          </DialogTitle>
          <DialogDescription>
            {picked
              ? `From ${picked.title} · ${picked.label}`
              : "Pick a section to copy. Edits afterward won't affect the original."}
          </DialogDescription>
        </DialogHeader>
        {picked ? (
          <>
            <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border px-3 py-2">
              <RichView html={picked.html} />
            </div>
            <DialogFooter className="flex-row flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => setPicked(null)}>
                <ArrowLeft /> Back
              </Button>
              {hasContent && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onApply(picked.html, "append")}
                >
                  Add below current
                </Button>
              )}
              <Button type="button" onClick={() => onApply(picked.html, "replace")}>
                {hasContent ? "Replace current" : "Copy in"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <input
              className="field"
              placeholder="Search, e.g. thyroid intra-op"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <ul className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
              {options.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Nothing to copy yet{ql ? " for that search" : ""}.
                </li>
              )}
              {options.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(o)}
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent/50"
                  >
                    <span className="truncate">{o.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{o.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
