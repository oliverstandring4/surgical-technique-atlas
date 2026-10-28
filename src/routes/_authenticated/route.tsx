import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { Home, Search, Plus, Menu, FileText, Hash, Link2, Settings } from "lucide-react";
import { useTable } from "@/lib/atlas";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Shell,
});

const TOOLS = [
  { to: "/templates", label: "Op Note Templates", icon: FileText },
  { to: "/phrases", label: "Dot Phrases", icon: Hash },
  { to: "/links", label: "Links", icon: Link2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function GlobalSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/search", search: { q } });
      }}
    >
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search everything"
        className="field pl-9"
      />
    </form>
  );
}

function Shell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const operations = useTable("operations").data ?? [];
  const conditions = useTable("conditions").data ?? [];
  const activeCat = activeCategory(path, subsections, operations, conditions);

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-5 py-8 md:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="" width={30} height={30} className="rounded-md" />
          <span className="font-serif text-xl">Operative Atlas</span>
        </Link>
        <Link
          to="/new"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
        >
          <Plus size={16} /> New
        </Link>
        <nav className="mt-8 space-y-0.5 overflow-y-auto">
          <NavItem to="/" label="Home" icon={Home} active={isActive("/")} />
          <p className="eyebrow px-3 pb-1 pt-5">Atlas</p>
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/category/$id"
              params={{ id: c.id }}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                activeCat === c.id && "bg-accent text-accent-foreground",
              )}
            >
              {c.name}
            </Link>
          ))}
          <p className="eyebrow px-3 pb-1 pt-5">Tools</p>
          {TOOLS.map((n) => (
            <NavItem key={n.to} to={n.to} label={n.label} icon={n.icon} active={isActive(n.to)} />
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur safe-top">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 md:px-8">
            <Link to="/" className="md:hidden">
              <img src="/icon-192.png" alt="Home" width={30} height={30} className="rounded-md" />
            </Link>
            <GlobalSearch className="flex-1" />
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 pb-36 pt-6 md:px-8 md:pb-16">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom md:hidden">
        <div className="grid grid-cols-4">
          {[
            { to: "/", label: "Home", icon: Home },
            { to: "/search", label: "Search", icon: Search },
            { to: "/new", label: "New", icon: Plus },
            { to: "/more", label: "Atlas", icon: Menu },
          ].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground",
                (isActive(n.to) ||
                  (n.to === "/more" &&
                    /^\/(more|templates|phrases|links|settings|category|sub|operations|conditions)/.test(
                      path,
                    ))) &&
                  "text-primary",
              )}
            >
              <n.icon size={20} />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      <Icon size={16} /> {label}
    </Link>
  );
}

type WithCat = { id: string; category_id: string | null };
function activeCategory(path: string, subs: WithCat[], ops: WithCat[], conds: WithCat[]) {
  const [, kind, id] = path.split("/");
  if (!id) return null;
  if (kind === "category") return id;
  if (kind === "sub") return subs.find((s) => s.id === id)?.category_id ?? null;
  if (kind === "operations") return ops.find((o) => o.id === id)?.category_id ?? null;
  if (kind === "conditions") return conds.find((c) => c.id === id)?.category_id ?? null;
  return null;
}
