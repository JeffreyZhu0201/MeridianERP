'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogCloseButton,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { TeamMember } from '@meridian/shared';
import { MerchantRole } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface TeamManagementPanelProps {
  team: TeamMember[];
  isOwner: boolean;
  token: string;
}

export function TeamManagementPanel({ team, isOwner, token }: TeamManagementPanelProps) {
  const router = useRouter();
  const t = useTranslations('merchant.settings');
  const tCommon = useTranslations('common');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteSaving(true);
    setInviteError('');
    try {
      await apiFetch(
        '/merchant/team',
        {
          method: 'POST',
          body: JSON.stringify({ email: inviteEmail, password: invitePassword }),
        },
        token,
      );
      setInviteOpen(false);
      setInviteEmail('');
      setInvitePassword('');
      router.refresh();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : t('inviteFailed'));
    } finally {
      setInviteSaving(false);
    }
  }

  async function handleRemoveMember(id: string) {
    if (!confirm(t('removeMemberConfirm'))) return;
    try {
      await apiFetch(`/merchant/team/${id}`, { method: 'DELETE' }, token);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('removeFailed'));
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{t('team')}</CardTitle>
          {isOwner ? (
            <Button type="button" size="sm" onClick={() => setInviteOpen(true)}>
              {t('inviteStaff')}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('email')}</TableHead>
                <TableHead>{t('role')}</TableHead>
                <TableHead>{t('joined')}</TableHead>
                {isOwner ? <TableHead className="w-24" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === MerchantRole.MERCHANT_OWNER ? 'default' : 'secondary'}>
                      {member.role === MerchantRole.MERCHANT_OWNER ? t('roleOwner') : t('roleStaff')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  {isOwner ? (
                    <TableCell>
                      {member.role !== MerchantRole.MERCHANT_OWNER ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          {tCommon('remove')}
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title={t('inviteTitle')}
        description={t('inviteDescription')}
        footer={
          <>
            <DialogCloseButton onClose={() => setInviteOpen(false)} />
            <Button type="submit" form="invite-staff-form" disabled={inviteSaving}>
              {inviteSaving ? tCommon('creating') : t('createAccount')}
            </Button>
          </>
        }
      >
        <form id="invite-staff-form" onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{tCommon('email')}</Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">{t('temporaryPassword')}</Label>
            <Input
              id="invite-password"
              type="password"
              minLength={8}
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              required
            />
          </div>
          {inviteError ? (
            <p className="text-sm text-destructive" role="alert">
              {inviteError}
            </p>
          ) : null}
        </form>
      </Dialog>
    </>
  );
}
