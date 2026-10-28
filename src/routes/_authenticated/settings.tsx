import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Download, FileJson, LogOut, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ALL_TABLES, useTable, type TableName } from "@/lib/atlas";
import {
  buildBackup,
  download,
  parseBackup,
  planImport,
  runImport,
  TABLE_LABELS,
  toCsv,
  type Backup,
} from "@/lib/backup";
import { Card, PageHeader } from "@/components/atlas-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Operative Atlas" }] }),
  component: SettingsPage,
});

const stamp = () => new Date().toISOString().slice(0, 10);

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const categories = useTable("categories").data ?? [];
  const subsections = useTable("subsections").data ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<{ tables: Backup["tables"]; name: string } | null>(null);

  async function exportJson() {
    setBusy("json");
    try {
      const b = await buildBackup();
      download(`operative-atlas-${stamp()}.json`, JSON.stringify(b, null, 2), "application/json");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function exportCsv(t: TableName) {
    setBusy(t);
    try {
      const b = await buildBackup();
      const rows = b.tables[t] ?? [];
      if (!rows.length) {
        toast.info(`No ${TABLE_LABELS[t].toLowerCase()} to export`);
        return;
      }
      download(`operative-atlas-${t}-${stamp()}.csv`, toCsv(rows), "text/csv");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onFile(f: File) {
    try {
      setPending({ tables: parseBackup(await f.text()), name: f.name });
    } catch (e) {
      toast.error(`Couldn't read file: ${(e as Error).message}`);
    }
  }

  async function confirmImport() {
    if (!pending) return;
    setBusy("import");
    try {
      const plan = planImport(pending.tables, { categories, subsections }, user.id);
      const added = await runImport(plan);
      await qc.invalidateQueries({ queryKey: ["atlas"] });
      const total = Object.values(added).reduce((a, b) => a + b, 0);
      toast.success(`Imported ${total} new item${total === 1 ? "" : "s"}`);
      setPending(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Settings" />

      <Card>
        <p className="eyebrow">Account</p>
        <p className="mt-1 text-sm">{user.email}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await supabase.auth.signOut();
            qc.clear();
            navigate({ to: "/auth", replace: true });
          }}
        >
          <LogOut /> Sign out
        </Button>
      </Card>

      <Card>
        <p className="eyebrow">Backup</p>
        <h2 className="mt-1 text-xl">Export</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          JSON is a complete backup that can be imported again. CSV is for spreadsheets.
        </p>
        <Button className="mt-3" onClick={exportJson} disabled={!!busy}>
          <FileJson /> {busy === "json" ? "Preparing…" : "Export everything (JSON)"}
        </Button>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ALL_TABLES.filter((t) => t !== "entries" && t !== "order_sets").map((t) => (
            <Button
              key={t}
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => exportCsv(t)}
              disabled={!!busy}
            >
              <Download /> {busy === t ? "Preparing…" : `${TABLE_LABELS[t]} (CSV)`}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Restore</p>
        <h2 className="mt-1 text-xl">Import from JSON</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Adds items from an Operative Atlas JSON export. Existing items are never changed or
          deleted; anything already present is skipped.
        </p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
        >
          <Upload /> Choose file
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void onFile(f);
          }}
        />
      </Card>

      <ImportPreview
        pending={pending}
        busy={busy === "import"}
        onCancel={() => setPending(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}

function ImportPreview({
  pending,
  busy,
  onCancel,
  onConfirm,
}: {
  pending: { tables: Backup["tables"]; name: string } | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const current = {
    categories: useTable("categories").data ?? [],
    subsections: useTable("subsections").data ?? [],
    conditions: useTable("conditions").data ?? [],
    operations: useTable("operations").data ?? [],
    preference_cards: useTable("preference_cards").data ?? [],
    entries: useTable("entries").data ?? [],
    op_note_templates: useTable("op_note_templates").data ?? [],
    dot_phrases: useTable("dot_phrases").data ?? [],
    order_sets: useTable("order_sets").data ?? [],
    saved_links: useTable("saved_links").data ?? [],
  } satisfies Record<TableName, { id: string }[]>;

  const rows = pending
    ? ALL_TABLES.map((t) => {
        const incoming = pending.tables[t] ?? [];
        const have = new Set(current[t].map((r) => r.id));
        const dup = incoming.filter((r) => have.has(r["id"] as string)).length;
        return { t, total: incoming.length, dup };
      }).filter((r) => r.total)
    : [];

  return (
    <Dialog open={!!pending} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-medium">Import preview</DialogTitle>
          <DialogDescription className="break-all">{pending?.name}</DialogDescription>
        </DialogHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 font-normal">Type</th>
              <th className="py-1 text-right font-normal">In file</th>
              <th className="py-1 text-right font-normal">Already here</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.t} className="border-t border-border">
                <td className="py-1.5">{TABLE_LABELS[r.t]}</td>
                <td className="py-1.5 text-right tabular-nums">{r.total}</td>
                <td className="py-1.5 text-right tabular-nums text-muted-foreground">{r.dup}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground">
          Categories and subsections with the same name as yours are merged rather than duplicated.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
