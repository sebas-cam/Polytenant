"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type Result =
  | { kind: "ok"; synced: number; tenants: string[]; durationMs: number }
  | { kind: "err"; message: string };

export function SyncTenantsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onClick() {
    setBusy(true);
    setResult(null);

    const res = await fetch("/api/tenants/sync", { method: "POST" });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setResult({ kind: "err", message: body?.error ?? "Sync failed" });
      setBusy(false);
      return;
    }

    setResult({
      kind: "ok",
      synced: body.synced,
      tenants: body.tenants ?? [],
      durationMs: body.durationMs,
    });
    setBusy(false);
    startTransition(() => router.refresh());
  }

  const loading = busy || pending;

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onClick} disabled={loading} variant="outline">
        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        Sync all tenants
      </Button>
      {result?.kind === "ok" ? (
        <p className="text-sm text-muted-foreground">
          Synced {result.synced} tenant(s) in {result.durationMs} ms
          {result.tenants.length > 0 ? `: ${result.tenants.join(", ")}` : ""}
        </p>
      ) : null}
      {result?.kind === "err" ? (
        <p className="text-sm text-destructive" role="alert">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
