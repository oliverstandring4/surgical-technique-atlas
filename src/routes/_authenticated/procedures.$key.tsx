import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ENTRY_SECTIONS, performedLabel, procedureKey, useTable } from "@/lib/atlas";
import { RichView } from "@/components/RichEditor";
import { Empty, PageHeader } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/procedures/$key")({
  head: () => ({
    meta: [
      { title: "Compare versions — Operative Atlas" },
      { name: "description", content: "Compare how different attendings do the same procedure." },
      { property: "og:title", content: "Compare versions — Operative Atlas" },
      { property: "og:description", content: "Compare how different attendings do the same procedure." },
    ],
  }),
  component: Procedure,
});

function Procedure() {
  const { key } = Route.useParams();
  const q = useTable("entries");
  const [section, setSection] = useState<(typeof ENTRY_SECTIONS)[number]["key"] | "all">("all");
  if (q.isLoading) return null;
  const list = (q.data ?? []).filter((e) => procedureKey(e.title) === key);
  if (!list.length) return <Empty>No entries for this procedure.</Empty>;
  const shown = section === "all" ? ENTRY_SECTIONS : ENTRY_SECTIONS.filter((s) => s.key === section);

  return (
    <div>
      <PageHeader
        eyebrow={`${list.length} versions`}
        title={list[0].title}
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/entries/new" search={{ title: list[0].title, category: list[0].category_id ?? undefined, subsection: list[0].subsection_id ?? undefined }}><Plus /> Add</Link>
          </Button>
        }
      />
      <div className="-mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
        {[{ key: "all", label: "All sections" }, ...ENTRY_SECTIONS].map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key as typeof section)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${section === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {/* Horizontally scrollable columns: swipe on mobile, side-by-side on desktop */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {list.map((e) => (
          <div key={e.id} className="w-[85vw] max-w-sm shrink-0 snap-start rounded-lg border border-border bg-card p-4 shadow-soft md:w-80">
            <Link to="/entries/$id" params={{ id: e.id }} className="block">
              <p className="font-serif text-lg">{e.attending || "Unknown attending"}</p>
              <p className="text-xs text-muted-foreground">
                {[e.hospital, performedLabel(e), e.approach].filter(Boolean).join(" · ")}
              </p>
            </Link>
            <div className="mt-4 space-y-5">
              {shown.map((s) => (
                <div key={s.key}>
                  <p className="eyebrow mb-1">{s.label}</p>
                  <RichView html={e[s.key]} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
