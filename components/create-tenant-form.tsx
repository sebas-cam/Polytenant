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
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

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
          required
        />
      </div>
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Create tenant
      </Button>
      {error ? (
        <p className="ml-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
