'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge, Button } from '@meridian/ui';
import type { PlatformDistributorSummary } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

export function DistributorsTable({
  distributors,
  token,
}: {
  distributors: PlatformDistributorSummary[];
  token: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rate, setRate] = useState('10');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiFetch(
        '/platform/distributors',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            email: email || undefined,
            commissionRate: Number(rate),
            commissionType: 'PERCENT',
          }),
        },
        token,
      );
      setName('');
      setEmail('');
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-xl ring-1 ring-border p-4"
      >
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Name</label>
          <input
            className="flex h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <input
            type="email"
            className="flex h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Commission %</label>
          <input
            type="number"
            className="flex h-9 w-24 rounded-md border border-border bg-background px-3 text-sm"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? 'Creating…' : 'Create distributor'}
        </Button>
      </form>

      <div className="rounded-xl ring-1 ring-border divide-y divide-border">
        {distributors.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <Link href={`/distributors/${d.id}`} className="font-medium hover:underline">
                {d.name}
              </Link>
              <p className="text-xs text-muted-foreground">{d.email ?? '—'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={d.isActive ? 'default' : 'secondary'}>
                {d.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="tabular-nums">{d.recruitedMerchantCount} branches</span>
              <span className="tabular-nums">{Number(d.commissionRate)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
