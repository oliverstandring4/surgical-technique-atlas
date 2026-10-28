import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ClipboardList, Scissors } from "lucide-react";
import { PageHeader } from "@/components/atlas-ui";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({ meta: [{ title: "Add — Operative Atlas" }] }),
  component: NewChooser,
});

function NewChooser() {
  return (
    <div>
      <PageHeader eyebrow="Add" title="What are you adding?" />
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        <li>
          <Link
            to="/operations/new"
            className="flex items-center gap-4 px-4 py-5 hover:bg-accent/50"
          >
            <Scissors size={20} className="text-primary" />
            <span className="flex-1">
              <span className="block font-serif text-lg">Operation</span>
              <span className="block text-xs text-muted-foreground">
                Pre-op, setup, intra-op, pearls, post-op, preference cards
              </span>
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link
            to="/conditions/new"
            className="flex items-center gap-4 px-4 py-5 hover:bg-accent/50"
          >
            <ClipboardList size={20} className="text-primary" />
            <span className="flex-1">
              <span className="block font-serif text-lg">Condition</span>
              <span className="block text-xs text-muted-foreground">
                Workup: H&amp;P, labs, imaging, data, recommendations
              </span>
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        </li>
      </ul>
    </div>
  );
}
