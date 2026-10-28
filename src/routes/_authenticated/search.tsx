import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardList, FileText, Hash, Link2, Scissors } from "lucide-react";
import { CARD_FIELDS, CONDITION_SECTIONS, OPERATION_SECTIONS, useTable } from "@/lib/atlas";
import { attendingName } from "@/components/PreferenceCards";
import { stripHtml } from "@/lib/phi-check";
import { CopyButton, Empty, PageHeader } from "@/components/atlas-ui";

type S = { q?: string };

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>): S =>
    typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {},
  head: () => ({ meta: [{ title: "Search — Operative Atlas" }] }),
  component: SearchPage,
});

/** Every whitespace-separated term must appear somewhere in the haystack. */
function matches(hay: string, terms: string[]) {
  return terms.every((t) => hay.includes(t));
}

function snippet(text: string, terms: string[]) {
  const clean = text.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  const first = terms
    .map((t) => lower.indexOf(t))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)[0];
  if (first === undefined) return "";
  const start = Math.max(0, first - 50);
  return (
    (start > 0 ? "…" : "") +
    clean.slice(start, start + 160) +
    (start + 160 < clean.length ? "…" : "")
  );
}

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [text, setText] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setText(q);
  }

  const operations = useTable("operations").data ?? [];
  const conditions = useTable("conditions").data ?? [];
  const cards = useTable("preference_cards").data ?? [];
  const templates = useTable("op_note_templates").data ?? [];
  const phrases = useTable("dot_phrases").data ?? [];
  const links = useTable("saved_links").data ?? [];
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];

  const terms = useMemo(() => text.toLowerCase().split(/\s+/).filter(Boolean), [text]);

  const results = useMemo(() => {
    if (!terms.length) return null;
    const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "";
    const subName = (id: string | null) => subsections.find((s) => s.id === id)?.name ?? "";
    const cardText = (opId: string) =>
      cards
        .filter((c) => c.operation_id === opId)
        .map((c) => [c.attending, c.hospital, ...CARD_FIELDS.map((f) => c[f.key])].join(" "))
        .join(" ");
    return {
      operations: operations.flatMap((o) => {
        const body = OPERATION_SECTIONS.map((s) => stripHtml(o[s.key])).join(" ");
        const extra = cardText(o.id);
        const hay = [
          o.title,
          o.approach ?? "",
          o.tags.join(" "),
          catName(o.category_id),
          subName(o.subsection_id),
          body,
          extra,
        ]
          .join(" ")
          .toLowerCase();
        return matches(hay, terms) ? [{ o, snip: snippet(`${body} ${extra}`, terms) }] : [];
      }),
      conditions: conditions.flatMap((c) => {
        const body = CONDITION_SECTIONS.map((s) => stripHtml(c[s.key])).join(" ");
        const hay = [
          c.title,
          c.tags.join(" "),
          catName(c.category_id),
          subName(c.subsection_id),
          body,
        ]
          .join(" ")
          .toLowerCase();
        return matches(hay, terms) ? [{ c, snip: snippet(body, terms) }] : [];
      }),
      templates: templates.filter((t) =>
        matches([t.title, t.body, catName(t.category_id)].join(" ").toLowerCase(), terms),
      ),
      phrases: phrases.filter((p) => matches([p.name, p.expansion].join(" ").toLowerCase(), terms)),
      links: links.filter((l) => matches([l.title, l.url, l.note].join(" ").toLowerCase(), terms)),
    };
  }, [terms, operations, conditions, cards, templates, phrases, links, categories, subsections]);

  const total = results ? Object.values(results).reduce((n, r) => n + r.length, 0) : 0;

  return (
    <div>
      <PageHeader eyebrow="Search" title="Search everything" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: text ? { q: text } : {}, replace: true });
        }}
      >
        <input
          type="search"
          autoFocus
          className="field mb-6 text-base"
          placeholder="Procedure, attending, instrument, tag…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </form>

      {!results ? (
        <Empty>
          Searches operations (including preference cards), conditions, templates, dot phrases and
          links.
        </Empty>
      ) : total === 0 ? (
        <Empty>No results for “{text}”.</Empty>
      ) : (
        <div className="space-y-8">
          <Group icon={Scissors} label="Operations" count={results.operations.length}>
            {results.operations.map(({ o, snip }) => {
              const who = cards
                .filter((c) => c.operation_id === o.id)
                .map((c) => attendingName(c.attending));
              return (
                <li key={o.id}>
                  <Link
                    to="/operations/$id"
                    params={{ id: o.id }}
                    className="block px-4 py-3 hover:bg-accent/50"
                  >
                    <p className="font-serif text-base">{o.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[
                        subsections.find((s) => s.id === o.subsection_id)?.name,
                        o.approach,
                        who.join(", "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {snip && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snip}</p>
                    )}
                  </Link>
                </li>
              );
            })}
          </Group>
          <Group icon={ClipboardList} label="Conditions" count={results.conditions.length}>
            {results.conditions.map(({ c, snip }) => (
              <li key={c.id}>
                <Link
                  to="/conditions/$id"
                  params={{ id: c.id }}
                  className="block px-4 py-3 hover:bg-accent/50"
                >
                  <p className="font-serif text-base">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {subsections.find((s) => s.id === c.subsection_id)?.name}
                  </p>
                  {snip && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snip}</p>
                  )}
                </Link>
              </li>
            ))}
          </Group>
          <Group icon={FileText} label="Op note templates" count={results.templates.length}>
            {results.templates.map((t) => (
              <li key={t.id} className="flex items-center gap-2 px-4 py-3">
                <Link
                  to="/templates"
                  search={{ open: t.id }}
                  className="min-w-0 flex-1 hover:underline"
                >
                  <p className="truncate font-serif text-base">{t.title}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {snippet(t.body, terms)}
                  </p>
                </Link>
                <CopyButton text={t.body} />
              </li>
            ))}
          </Group>
          <Group icon={Hash} label="Dot phrases" count={results.phrases.length}>
            {results.phrases.map((p) => (
              <li key={p.id} className="flex items-center gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium">.{p.name}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{p.expansion}</p>
                </div>
                <CopyButton text={p.expansion} />
              </li>
            ))}
          </Group>
          <Group icon={Link2} label="Links" count={results.links.length}>
            {results.links.map((l) => (
              <li key={l.id}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 hover:bg-accent/50"
                >
                  <p className="text-sm font-medium">{l.title}</p>
                  {l.note && <p className="truncate text-xs text-muted-foreground">{l.note}</p>}
                </a>
              </li>
            ))}
          </Group>
        </div>
      )}
    </div>
  );
}

function Group({
  icon: Icon,
  label,
  count,
  children,
}: {
  icon: typeof Scissors;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  if (!count) return null;
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-lg">
        <Icon size={16} className="text-muted-foreground" /> {label}
        <span className="text-sm text-muted-foreground">{count}</span>
      </h2>
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">{children}</ul>
    </section>
  );
}
