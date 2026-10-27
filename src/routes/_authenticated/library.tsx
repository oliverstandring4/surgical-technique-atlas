import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { APPROACHES, useRemove, useSave, useTable, type Subsection } from "@/lib/atlas";
import { EntryCard } from "@/components/EntryCard";
import { Empty, PageHeader } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type LibSearch = {
  category?: string;
  subsection?: string;
  attending?: string;
  approach?: string;
  tag?: string;
  q?: string;
};

export const Route = createFileRoute("/_authenticated/library")({
  validateSearch: (s: Record<string, unknown>): LibSearch => {
    const out: LibSearch = {};
    for (const k of ["category", "subsection", "attending", "approach", "tag", "q"] as const) {
      if (typeof s[k] === "string" && s[k]) out[k] = s[k] as string;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Library — Operative Atlas" },
      { name: "description", content: "Browse and filter case entries by category, attending, approach and tag." },
      { property: "og:title", content: "Library — Operative Atlas" },
      { property: "og:description", content: "Browse and filter case entries." },
    ],
  }),
  component: Library,
});

function Library() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/library" });
  const entries = useTable("entries").data ?? [];
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const [manageOpen, setManageOpen] = useState(false);

  const set = (k: keyof LibSearch, v: string) =>
    navigate({
      search: (p: LibSearch) => {
        const n = { ...p, [k]: v || undefined };
        if (k === "category") n.subsection = undefined;
        return n;
      },
      replace: true,
    });

  const attendings = useMemo(() => [...new Set(entries.map((e) => e.attending).filter(Boolean))].sort(), [entries]);
  const tags = useMemo(() => [...new Set(entries.flatMap((e) => e.tags))].sort(), [entries]);
  const subsFor = subsections.filter((s) => s.category_id === search.category);

  const filtered = entries.filter(
    (e) =>
      (!search.category || e.category_id === search.category) &&
      (!search.subsection || e.subsection_id === search.subsection) &&
      (!search.attending || e.attending === search.attending) &&
      (!search.approach || e.approach === search.approach) &&
      (!search.tag || e.tags.includes(search.tag)) &&
      (!search.q || e.title.toLowerCase().includes(search.q.toLowerCase())),
  );
  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  const active = Object.values(search).some(Boolean);
  const catName = categories.find((c) => c.id === search.category)?.name;

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title={catName ?? "All entries"}
        action={
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
            <Settings2 /> Sections
          </Button>
        }
      />

      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Pill active={!search.category} onClick={() => set("category", "")}>All</Pill>
        {categories.map((c) => (
          <Pill key={c.id} active={search.category === c.id} onClick={() => set("category", c.id)}>
            {c.name}
          </Pill>
        ))}
      </div>
      {subsFor.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {subsFor.map((s) => (
            <Pill key={s.id} small active={search.subsection === s.id} onClick={() => set("subsection", search.subsection === s.id ? "" : s.id)}>
              {s.name}
            </Pill>
          ))}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        <input className="field col-span-2 md:col-span-1" placeholder="Filter by title" value={search.q ?? ""} onChange={(e) => set("q", e.target.value)} />
        <select className="field" value={search.attending ?? ""} onChange={(e) => set("attending", e.target.value)}>
          <option value="">Any attending</option>
          {attendings.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select className="field" value={search.approach ?? ""} onChange={(e) => set("approach", e.target.value)}>
          <option value="">Any approach</option>
          {APPROACHES.map((a) => <option key={a} value={a}>{a[0].toUpperCase() + a.slice(1)}</option>)}
        </select>
        <select className="field col-span-2 md:col-span-1" value={search.tag ?? ""} onChange={(e) => set("tag", e.target.value)}>
          <option value="">Any tag</option>
          {tags.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      {active && (
        <button className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate({ search: {} })}>
          <X size={12} /> Clear filters · {sorted.length} results
        </button>
      )}

      {sorted.length === 0 ? (
        <Empty>No entries match.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sorted.map((e) => <EntryCard key={e.id} entry={e} categories={categories} subsections={subsections} />)}
        </div>
      )}

      <ManageSections open={manageOpen} onOpenChange={setManageOpen} initialCategory={search.category} />
    </div>
  );
}

function Pill({ active, onClick, children, small }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 ${small ? "py-1 text-xs" : "py-1.5 text-sm"} transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function ManageSections({ open, onOpenChange, initialCategory }: { open: boolean; onOpenChange: (o: boolean) => void; initialCategory?: string }) {
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const save = useSave("subsections");
  const remove = useRemove("subsections");
  const [catId, setCatId] = useState(initialCategory ?? "");
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const cid = catId || categories[0]?.id;
  const list = subsections.filter((s) => s.category_id === cid);

  const move = async (s: Subsection, dir: -1 | 1) => {
    const arr = [...list];
    const i = arr.findIndex((x) => x.id === s.id);
    if (!arr[i + dir]) return;
    [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]];
    await Promise.all(arr.map((x, idx) => (x.position !== idx + 1 ? save.mutateAsync({ ...x, position: idx + 1 }) : null)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">Subsections</DialogTitle>
        </DialogHeader>
        <select className="field" value={cid} onChange={(e) => setCatId(e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <ul className="divide-y divide-border rounded-md border border-border">
          {list.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">No subsections</li>}
          {list.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1 px-2 py-1.5">
              {editing?.id === s.id ? (
                <form
                  className="flex flex-1 gap-1"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await save.mutateAsync({ ...s, name: editing.name });
                    setEditing(null);
                  }}
                >
                  <input autoFocus className="field py-1" value={editing.name} onChange={(e) => setEditing({ id: s.id, name: e.target.value })} />
                  <Button size="sm" type="submit">Save</Button>
                </form>
              ) : (
                <>
                  <span className="flex-1 px-1 text-sm">{s.name}</span>
                  <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(s, -1)} aria-label="Move up"><ArrowUp /></Button>
                  <Button variant="ghost" size="icon" disabled={i === list.length - 1} onClick={() => move(s, 1)} aria-label="Move down"><ArrowDown /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditing({ id: s.id, name: s.name })} aria-label="Rename"><Pencil /></Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => confirm(`Delete "${s.name}"? Entries keep their content but lose this subsection.`) && remove.mutate(s.id)}
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
            if (!newName.trim() || !cid) return;
            const max = Math.max(0, ...list.map((s) => s.position));
            await save.mutateAsync({ category_id: cid, name: newName.trim(), position: max + 1 });
            setNewName("");
          }}
        >
          <input className="field" placeholder="New subsection" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button type="submit"><Plus /> Add</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
