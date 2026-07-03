'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogCloseButton,
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
} from '@meridian/ui';
import type { AdminPlatformRole } from '@meridian/shared';

import { apiFetch, type PlatformAdmin } from '@/lib/api';

const ADMIN_ROLES: AdminPlatformRole[] = [
  'SUPER_ADMIN',
  'FINANCE',
  'FULFILLMENT',
  'REVIEWER',
];

interface AdminsViewProps {
  admins: PlatformAdmin[];
  token: string;
  currentAdminId: string;
}

export function AdminsView({ admins: initialAdmins, token, currentAdminId }: AdminsViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.admins');
  const tr = useTranslations('admin.roles');
  const tc = useTranslations('common');

  const [admins, setAdmins] = useState(initialAdmins);
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [createRole, setCreateRole] = useState<AdminPlatformRole>('FINANCE');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  async function handleCreate() {
    setCreating(true);
    setCreateError('');
    try {
      const created = await apiFetch<PlatformAdmin>(
        '/platform/admins',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, role: createRole }),
        },
        token,
      );
      setAdmins((prev) => [created, ...prev]);
      setCreateOpen(false);
      setEmail('');
      setPassword('');
      setCreateRole('FINANCE');
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('createFailed'));
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(admin: PlatformAdmin, role: AdminPlatformRole) {
    if (admin.role === role) return;
    setUpdatingId(admin.id);
    setActionError('');
    try {
      const updated = await apiFetch<PlatformAdmin>(
        `/platform/admins/${admin.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ role }),
        },
        token,
      );
      setAdmins((prev) => prev.map((item) => (item.id === admin.id ? updated : item)));
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('updateFailed'));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(admin: PlatformAdmin) {
    if (!confirm(t('deleteConfirm', { email: admin.email }))) return;
    setUpdatingId(admin.id);
    setActionError('');
    try {
      await apiFetch(`/platform/admins/${admin.id}`, { method: 'DELETE' }, token);
      setAdmins((prev) => prev.filter((item) => item.id !== admin.id));
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('deleteFailed'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>{t('create')}</Button>
      </div>

      {actionError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {admins.length === 0 ? (
        <EmptyState title={t('empty')} description={t('emptyDescription')} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columns.email')}</TableHead>
              <TableHead>{t('columns.role')}</TableHead>
              <TableHead>{t('columns.created')}</TableHead>
              <TableHead className="text-right">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.email}</TableCell>
                <TableCell>
                  <Select
                    value={admin.role}
                    disabled={updatingId === admin.id}
                    onChange={(e) =>
                      handleRoleChange(admin, e.target.value as AdminPlatformRole)
                    }
                    aria-label={t('columns.role')}
                  >
                    {ADMIN_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {tr(role)}
                      </option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(admin.createdAt).toLocaleDateString(locale)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={admin.id === currentAdminId || updatingId === admin.id}
                    onClick={() => handleDelete(admin)}
                  >
                    {tc('delete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t('createTitle')}
        description={t('createDescription')}
        footer={
          <>
            <DialogCloseButton onClose={() => setCreateOpen(false)}>
              {tc('cancel')}
            </DialogCloseButton>
            <Button
              onClick={handleCreate}
              disabled={creating || !email || password.length < 8}
            >
              {creating ? t('creating') : t('createSubmit')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">{t('form.email')}</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">{t('form.password')}</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-role">{t('form.role')}</Label>
            <Select
              id="admin-role"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as AdminPlatformRole)}
            >
              {ADMIN_ROLES.map((role) => (
                <option key={role} value={role}>
                  {tr(role)}
                </option>
              ))}
            </Select>
          </div>
          {createError ? (
            <p className="text-sm text-destructive" role="alert">
              {createError}
            </p>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
