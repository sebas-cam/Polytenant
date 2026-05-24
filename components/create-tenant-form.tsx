"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, startTransition] = useTransition();

  // submitting covers the fetch (CREATE DATABASE + migrate deploy — the slow part).
  // refreshing covers the router.refresh() that re-renders the list afterwards.
  const loading = submitting || refreshing;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const { error: msg } = (await res.json().catch(() => ({ error: "Request failed" }))) as {
          error?: string;
        };
        setError(msg ?? "Request failed");
        return;
      }

      setName("");
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="tenant-name">Tenant name</Label>
        <Input
          id="tenant-name"
          placeholder="empresa_x"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? <Loader2 className="animate-spin" /> : null}
        {submitting ? "Creating…" : refreshing ? "Refreshing…" : "Create tenant"}
      </Button>
      {error ? (
        <p className="ml-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
