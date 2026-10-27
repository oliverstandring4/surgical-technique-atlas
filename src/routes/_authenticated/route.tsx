import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Home, Search, Plus, Menu, FileText, Hash, ClipboardList, Link2, Settings } from "lucide-react";
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

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/templates", label: "Op Note Templates", icon: FileText },
  { to: "/phrases", label: "Dot Phrases", icon: Hash },
  { to: "/orders", label: "Post-Op Orders", icon: ClipboardList },
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
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  const hideFab = path.startsWith("/entries/new") || path.endsWith("/edit");

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-5 py-8 md:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="" width={30} height={30} className="rounded-md" />
          <span className="font-serif text-xl">Operative Atlas</span>
        </Link>
        <Link
          to="/entries/new"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
        >
          <Plus size={16} /> New entry
        </Link>
        <nav className="mt-8 space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(n.to) && "bg-accent text-accent-foreground",
              )}
            >
              <n.icon size={16} /> {n.label}
            </Link>
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

      {/* Mobile FAB */}
      {!hideFab && (
        <Link
          to="/entries/new"
          aria-label="New entry"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab md:hidden"
        >
          <Plus size={24} />
        </Link>
      )}

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom md:hidden">
        <div className="grid grid-cols-4">
          {[
            { to: "/", label: "Home", icon: Home },
            { to: "/library", label: "Library", icon: BookOpen },
            { to: "/search", label: "Search", icon: Search },
            { to: "/more", label: "More", icon: Menu },
          ].map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground",
                (isActive(n.to) ||
                  (n.to === "/more" && /^\/(more|templates|phrases|orders|links|settings)/.test(path))) &&
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
