import { Link } from "@tanstack/react-router";

export function Breadcrumb({
  cat,
  sub,
  tab,
}: {
  cat?: { id: string; name: string } | undefined;
  sub?: { id: string; name: string } | undefined;
  tab: "operations" | "conditions";
}) {
  if (!cat && !sub) return <p className="eyebrow">Unfiled</p>;
  return (
    <p className="eyebrow flex flex-wrap gap-1">
      {cat && (
        <Link to="/category/$id" params={{ id: cat.id }} className="hover:text-foreground">
          {cat.name}
        </Link>
      )}
      {cat && sub && <span>/</span>}
      {sub && (
        <Link
          to="/sub/$id"
          params={{ id: sub.id }}
          search={{ tab }}
          className="hover:text-foreground"
        >
          {sub.name}
        </Link>
      )}
    </p>
  );
}

export function JumpNav({ items }: { items: { key: string; label: string }[] }) {
  return (
    <nav className="sticky top-[57px] z-10 -mx-4 mt-6 flex gap-1.5 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:mx-0 md:px-0">
      {items.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() =>
            document
              .getElementById(`sec-${s.key}`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-accent"
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
