import type { ReactNode } from "react";
import { Copy } from "lucide-react";
import { copyText } from "@/lib/atlas";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl md:text-4xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-border bg-card p-4 shadow-soft", className)}>{children}</div>;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => copyText(text)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-paper px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent active:scale-95"
    >
      <Copy size={13} /> {label}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
      {children}
    </span>
  );
}
