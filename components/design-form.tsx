"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TenantDesign } from "@/lib/design";

export function DesignForm({
  tenantName,
  initial,
}: {
  tenantName: string;
  initial: TenantDesign;
}) {
  const router = useRouter();
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initial.secondaryColor);
  const [headline, setHeadline] = useState(initial.headline);
  const [description, setDescription] = useState(initial.description);
  const [saving, setSaving] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const loading = saving || refreshing;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/tenants/${tenantName}/design`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ primaryColor, secondaryColor, headline, description }),
      });

      if (!res.ok) {
        const { error: msg } = (await res.json().catch(() => ({}))) as { error?: string };
        setError(msg ?? "Save failed");
        return;
      }

      setSavedAt(new Date());
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="primary">Primary color</Label>
            <div className="flex items-center gap-2">
              <input
                id="primary"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent"
                disabled={loading}
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="secondary">Secondary color</Label>
            <div className="flex items-center gap-2">
              <input
                id="secondary"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent"
                disabled={loading}
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            disabled={loading}
            maxLength={120}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={5}
            maxLength={1000}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || !headline.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Saving…" : refreshing ? "Refreshing…" : "Save changes"}
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : savedAt ? (
            <p className="text-sm text-muted-foreground">Saved at {savedAt.toLocaleTimeString()}</p>
          ) : null}
        </div>
      </div>

      <DesignPreview
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        headline={headline}
        description={description}
      />
    </form>
  );
}

function DesignPreview({
  primaryColor,
  secondaryColor,
  headline,
  description,
}: TenantDesign) {
  return (
    <div className="space-y-2">
      <Label>Live preview</Label>
      <div
        className="overflow-hidden rounded-lg border shadow-sm"
        style={{ background: secondaryColor }}
      >
        <div className="space-y-3 p-6">
          <div
            className="inline-block rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: primaryColor, color: secondaryColor }}
          >
            Landing
          </div>
          <h2 className="text-xl font-semibold leading-tight" style={{ color: primaryColor }}>
            {headline || "Headline"}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: primaryColor, opacity: 0.8 }}>
            {description || "Description appears here."}
          </p>
          <div
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
            style={{ background: primaryColor, color: secondaryColor }}
          >
            Get started
          </div>
        </div>
      </div>
    </div>
  );
}
