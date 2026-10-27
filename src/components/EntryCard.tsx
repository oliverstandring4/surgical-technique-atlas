import { Link } from "@tanstack/react-router";
import type { Category, Entry, Subsection } from "@/lib/atlas";
import { performedLabel } from "@/lib/atlas";
import { Chip } from "./atlas-ui";

export function EntryCard({
  entry,
  categories,
  subsections,
}: {
  entry: Entry;
  categories: Category[];
  subsections: Subsection[];
}) {
  const cat = categories.find((c) => c.id === entry.category_id)?.name;
  const sub = subsections.find((s) => s.id === entry.subsection_id)?.name;
  const meta = [entry.attending && `Dr. ${entry.attending.replace(/^dr\.?\s*/i, "")}`, entry.hospital, performedLabel(entry)]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      to="/entries/$id"
      params={{ id: entry.id }}
      className="block rounded-lg border border-border bg-card px-4 py-3.5 shadow-soft transition-colors hover:border-primary/40"
    >
      <p className="eyebrow">{[cat, sub].filter(Boolean).join(" / ") || "Uncategorized"}</p>
      <h3 className="mt-1 text-lg leading-snug">{entry.title}</h3>
      {meta && <p className="mt-1 text-sm text-muted-foreground">{meta}</p>}
      {(entry.approach || entry.tags.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {entry.approach && <Chip>{entry.approach}</Chip>}
          {entry.tags.map((t) => (
            <Chip key={t}>#{t}</Chip>
          ))}
        </div>
      )}
    </Link>
  );
}
