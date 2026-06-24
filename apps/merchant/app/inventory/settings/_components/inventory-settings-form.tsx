'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@meridian/ui';

import { apiFetch } from '@/lib/api';

interface InventorySettingsFormProps {
  defaultReorderThreshold: number;
  token: string;
}

export function InventorySettingsForm({
  defaultReorderThreshold: initial,
  token,
}: InventorySettingsFormProps) {
  const router = useRouter();
  const [threshold, setThreshold] = useState(String(initial));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await apiFetch('/merchant/inventory/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          defaultReorderThreshold: Math.max(0, parseInt(threshold, 10) || 0),
        }),
      }, token);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Reorder defaults</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-threshold">Default reorder threshold</Label>
            <Input
              id="default-threshold"
              type="number"
              min={0}
              inputMode="numeric"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Applied when a variant has no per-variant threshold.
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? <p className="text-sm text-emerald-600">Settings saved</p> : null}
          <Button type="submit">Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function StaffForbidden() {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <p className="text-muted-foreground">Inventory settings are owner-only.</p>
      <Link href="/inventory/alerts" className="mt-4 inline-block text-sm text-primary hover:underline">
        Back to alerts
      </Link>
    </div>
  );
}
