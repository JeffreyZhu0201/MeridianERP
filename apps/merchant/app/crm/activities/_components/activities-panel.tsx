'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@meridian/ui';
import type { CrmActivity, CreateActivityRequest } from '@meridian/shared';
import { ActivityType } from '@meridian/shared';

import { apiFetch, type Contact, type Lead } from '@/lib/api';

interface ActivitiesPanelProps {
  activities: CrmActivity[];
  contacts: Contact[];
  leads: Lead[];
  token: string;
}

const ACTIVITY_TYPES = [ActivityType.NOTE, ActivityType.CALL, ActivityType.MEETING];

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function ActivitiesPanel({
  activities: initial,
  contacts,
  leads,
  token,
}: ActivitiesPanelProps) {
  const router = useRouter();
  const t = useTranslations('merchant.crm.activities');
  const tCommon = useTranslations('common');
  const [activities, setActivities] = useState(initial);
  const [type, setType] = useState<ActivityType>(ActivityType.NOTE);
  const [note, setNote] = useState('');
  const [contactId, setContactId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function typeLabel(activityType: ActivityType): string {
    return t(`typeLabels.${activityType}`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload: CreateActivityRequest = {
      type,
      note: note.trim(),
      ...(contactId ? { contactId } : {}),
      ...(leadId ? { leadId } : {}),
    };

    try {
      const created = await apiFetch<CrmActivity>(
        '/merchant/activities',
        { method: 'POST', body: JSON.stringify(payload) },
        token,
      );
      setActivities((prev) => [created, ...prev]);
      setNote('');
      setContactId('');
      setLeadId('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return;
    setDeletingId(id);
    try {
      await apiFetch(`/merchant/activities/${id}`, { method: 'DELETE' }, token);
      setActivities((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <form onSubmit={handleCreate} className="space-y-4 rounded-xl ring-1 ring-border p-4 lg:col-span-1 lg:h-fit">
        <p className="text-sm font-medium">{t('logActivity')}</p>
        <div className="space-y-2">
          <Label htmlFor="activity-type">{t('type')}</Label>
          <Select
            id="activity-type"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
          >
            {ACTIVITY_TYPES.map((activityType) => (
              <option key={activityType} value={activityType}>
                {typeLabel(activityType)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-note">{t('note')}</Label>
          <Textarea
            id="activity-note"
            required
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('notePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-contact">{t('contactOptional')}</Label>
          <Select
            id="activity-contact"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
          >
            <option value="">{tCommon('none')}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activity-lead">{t('leadOptional')}</Label>
          <Select id="activity-lead" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            <option value="">{tCommon('none')}</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? tCommon('saving') : t('addActivity')}
        </Button>
      </form>

      <div className="lg:col-span-2">
        {activities.length === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : (
          <div className="rounded-xl ring-1 ring-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableType')}</TableHead>
                  <TableHead>{t('tableNote')}</TableHead>
                  <TableHead>{t('tableContact')}</TableHead>
                  <TableHead>{t('tableWhen')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Badge variant="secondary">{typeLabel(activity.type)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{activity.note}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {activity.contact
                        ? `${activity.contact.firstName} ${activity.contact.lastName}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deletingId === activity.id}
                        onClick={() => handleDelete(activity.id)}
                      >
                        {tCommon('delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
