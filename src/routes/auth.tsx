import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Operative Atlas" },
      { name: "description", content: "Sign in to your Operative Atlas library." },
      { property: "og:title", content: "Sign in — Operative Atlas" },
      { property: "og:description", content: "Sign in to your Operative Atlas library." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/", replace: true });
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email for a reset link");
      setMode("signin");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 safe-top">
      <div className="w-full max-w-sm">
        <img src="/icon-192.png" alt="" width={56} height={56} className="mb-6 rounded-xl" />
        <p className="eyebrow">Private library</p>
        <h1 className="mt-1 text-4xl">Operative Atlas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Technique only. Access is by invitation.</p>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            className="field"
            type="email"
            autoComplete="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode === "signin" && (
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Send reset link"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "forgot" : "signin")}
        >
          {mode === "signin" ? "Forgot password?" : "Back to sign in"}
        </button>
      </div>
    </div>
  );
}
