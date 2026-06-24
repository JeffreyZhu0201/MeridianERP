'use client';

import Link from 'next/link';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import { CommissionType } from '@meridian/shared';

import { type Binding, type Distributor } from '@/lib/api';
import { QrDisplay } from './qr-display';

interface DistributorDetailProps {
  distributor: Distributor;
  bindings: Binding[];
  token: string;
}

export function DistributorDetail({ distributor, bindings, token }: DistributorDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href="/distributors" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to distributors
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{distributor.name}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Rate:</span>{' '}
              {distributor.commissionRate}
              {distributor.commissionType === CommissionType.PERCENT ? '%' : ' (fixed)'}
            </p>
            <p>
              <span className="text-muted-foreground">Type:</span> {distributor.commissionType}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{' '}
              {distributor.isActive ? 'Active' : 'Inactive'}
            </p>
          </CardContent>
        </Card>

        <QrDisplay distributorId={distributor.id} token={token} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bindings</CardTitle>
        </CardHeader>
        <CardContent>
          {bindings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bindings yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Bound At</TableHead>
                  <TableHead>Linked Lead</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bindings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.bindableType}</TableCell>
                    <TableCell>{new Date(b.boundAt).toLocaleString()}</TableCell>
                    <TableCell>{b.lead?.title ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
