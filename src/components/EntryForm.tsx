import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardPaste, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { APPROACHES, ENTRY_SECTIONS, MONTHS, useSave, useTable, type Entry } from "@/lib/atlas";
import { findPhi, type PhiWarning } from "@/lib/phi-check";
import { parseFormattedNote, plainToHtml, type SectionKey } from "@/lib/parse-note";
import { RichEditor } from "./RichEditor";
import { Field } from "./atlas-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type Draft = Omit<Entry, "id" | "user_id" | "created_at" | "updated_at"> & { id?: string };

const blank: Draft = {
  title: "",
  category_id: null,
  subsection_id: null,
  attending: "",
  hospital: "",
  performed_month: null,
  performed_year: null,
  approach: null,
  tags: [],
  indications: "",
  setup: "",
  key_steps: "",
  pearls: "",
  pitfalls: "",
  is_shared: false,
};

export function EntryForm({ initial, prefill }: { initial?: Entry; prefill?: Partial<Draft> }) {
  const navigate = useNavigate();
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const entries = useTable("entries").data ?? [];
  const save = useSave("entries");
  const [d, setD] = useState<Draft>(() => (initial ? { ...initial } : { ...blank, ...prefill }));
  const [tagText, setTagText] = useState((initial?.tags ?? prefill?.tags ?? []).join(", "));
  const [editorKey, setEditorKey] = useState(0);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [warnings, setWarnings] = useState<PhiWarning[] | null>(null);

  const up = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const subs = subsections.filter((s) => s.category_id === d.category_id);
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => thisYear + 1 - i);
  const titles = [...new Set(entries.map((e) => e.title))];
  const attendings = [...new Set(entries.map((e) => e.attending).filter(Boolean))];
  const hospitals = [...new Set(entries.map((e) => e.hospital).filter(Boolean))];

  async function doSave() {
    const tags = tagText
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
    const row = { ...d, title: d.title.trim(), tags };
    const saved = await save.mutateAsync(row);
    toast.success("Saved");
    navigate({ to: "/entries/$id", params: { id: saved.id }, replace: true });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      toast.error("Add a case title");
      return;
    }
    const w = findPhi([d.title, d.attending, d.hospital, tagText, d.indications, d.setup, d.key_steps, d.pearls, d.pitfalls]);
    if (w.length) setWarnings(w);
    else void doSave();
  }

  function applyPaste() {
    const parsed = parseFormattedNote(pasteText);
    const keys = Object.keys(parsed) as SectionKey[];
    if (!keys.length) {
      toast.error("No headings found (Indications, Setup, Key Steps, Pearls, Pitfalls)");
      return;
    }
    setD((p) => {
      const n = { ...p };
      keys.forEach((k) => (n[k] = plainToHtml(parsed[k]!)));
      return n;
    });
    setEditorKey((k) => k + 1);
    setPasteOpen(false);
    setPasteText("");
    toast.success(`Filled ${keys.length} section${keys.length > 1 ? "s" : ""}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="flex items-start gap-2.5 rounded-md border border-border bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <span>Technique only. No names, MRNs, DOBs, or identifying details.</span>
      </div>

      <section className="space-y-4">
        <Field label="Case title (procedure)">
          <input className="field font-serif text-lg" list="titles" value={d.title} onChange={(e) => up("title", e.target.value)} placeholder="e.g. Pancreaticoduodenectomy" />
          <datalist id="titles">{titles.map((t) => <option key={t} value={t} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className="field" value={d.category_id ?? ""} onChange={(e) => setD((p) => ({ ...p, category_id: e.target.value || null, subsection_id: null }))}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Subsection">
            <select className="field" value={d.subsection_id ?? ""} onChange={(e) => up("subsection_id", e.target.value || null)} disabled={!subs.length}>
              <option value="">—</option>
              {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Attending">
            <input className="field" list="attendings" value={d.attending} onChange={(e) => up("attending", e.target.value)} />
            <datalist id="attendings">{attendings.map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Hospital">
            <input className="field" list="hospitals" value={d.hospital} onChange={(e) => up("hospital", e.target.value)} />
            <datalist id="hospitals">{hospitals.map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Month">
            <select className="field" value={d.performed_month ?? ""} onChange={(e) => up("performed_month", e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </Field>
          <Field label="Year">
            <select className="field" value={d.performed_year ?? ""} onChange={(e) => up("performed_year", e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Approach">
          <div className="grid grid-cols-4 gap-1 rounded-md border border-input bg-paper p-1">
            {APPROACHES.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => up("approach", d.approach === a ? null : a)}
                className={`rounded px-1 py-2 text-xs capitalize transition-colors sm:text-sm ${d.approach === a ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              >
                {a === "laparoscopic" ? "Lap" : a}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Tags" hint="Comma separated">
          <input className="field" value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="whipple, PV resection" />
        </Field>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Technique</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => setPasteOpen(true)}>
            <ClipboardPaste /> Paste formatted note
          </Button>
        </div>
        {ENTRY_SECTIONS.map((s) => (
          <div key={s.key}>
            <h3 className="text-base">{s.label}</h3>
            {s.hint && <p className="mb-1.5 text-xs text-muted-foreground">{s.hint}</p>}
            <div className={s.hint ? "" : "mt-1.5"}>
              <RichEditor key={`${s.key}-${editorKey}`} value={d[s.key]} onChange={(v) => up(s.key, v)} />
            </div>
          </div>
        ))}
      </section>

      <label className="flex items-center justify-between rounded-md border border-border px-3 py-3">
        <span>
          <span className="block text-sm">Shared</span>
          <span className="block text-xs text-muted-foreground">Sharing with co-fellows is coming later. For now, only you can see this.</span>
        </span>
        <Switch checked={d.is_shared} onCheckedChange={(v) => up("is_shared", v)} />
      </label>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex gap-2 rounded-lg border border-border bg-background/95 p-2 backdrop-blur md:bottom-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={() => history.back()}>Cancel</Button>
        <Button type="submit" className="flex-[2]" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save entry"}</Button>
      </div>

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">Paste formatted note</DialogTitle>
            <DialogDescription>Use headings: Indications, Setup, Key Steps, Pearls, Pitfalls. Matching sections will be replaced.</DialogDescription>
          </DialogHeader>
          <textarea className="field min-h-64 font-mono text-sm" value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"Indications:\n...\n\nSetup:\n...\n\nKey Steps:\n1. ...\n\nPearls:\n- ...\n\nPitfalls:\n- ..."} />
          <DialogFooter>
            <Button type="button" onClick={applyPaste}>Split into fields</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!warnings} onOpenChange={(o) => !o && setWarnings(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">Possible identifiers</DialogTitle>
            <DialogDescription>This text looks like it may contain patient details. Check before saving.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {warnings?.map((w, i) => (
              <li key={i} className="flex justify-between gap-3 rounded bg-warning-soft px-3 py-1.5">
                <span className="text-warning">{w.kind}</span>
                <code className="truncate">{w.match}</code>
              </li>
            ))}
          </ul>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setWarnings(null)}>Go back and edit</Button>
            <Button type="button" onClick={() => { setWarnings(null); void doSave(); }}>Save anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
