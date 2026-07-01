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
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { MerchantSettingsDto, TeamMember } from '@meridian/shared';
import { CommissionType, MerchantRole } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

interface SettingsPanelsProps {
  settings: MerchantSettingsDto;
  team: TeamMember[];
  isOwner: boolean;
  token: string;
}

function SaveStatus({ error, saved, savedLabel }: { error: string; saved: boolean; savedLabel: string }) {
  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }
  if (saved) {
    return (
      <p className="text-sm text-emerald-600" role="status">
        {savedLabel}
      </p>
    );
  }
  return null;
}

export function SettingsPanels({ settings, team, isOwner, token }: SettingsPanelsProps) {
  const router = useRouter();
  const t = useTranslations('merchant.settings');
  const tCommon = useTranslations('common');

  const [businessName, setBusinessName] = useState(settings.profile.businessName);
  const [contactEmail, setContactEmail] = useState(settings.profile.contactEmail);
  const [contactPhone, setContactPhone] = useState(settings.profile.contactPhone ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [commissionRate, setCommissionRate] = useState(
    settings.defaultCommissionRate != null ? String(settings.defaultCommissionRate) : '',
  );
  const [commissionType, setCommissionType] = useState<CommissionType>(
    settings.defaultCommissionType ?? CommissionType.PERCENT,
  );
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionError, setCommissionError] = useState('');
  const [commissionSaved, setCommissionSaved] = useState(false);

  const [notifyOnBinding, setNotifyOnBinding] = useState(settings.notifyOnBinding);
  const [notifyOnCommission, setNotifyOnCommission] = useState(settings.notifyOnCommission);
  const [notifySaving, setNotifySaving] = useState(false);
  const [notifyError, setNotifyError] = useState('');
  const [notifySaved, setNotifySaved] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);

  async function patchSettings(body: Record<string, unknown>) {
    await apiFetch('/merchant/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }, token);
    router.refresh();
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await patchSettings({ businessName, contactEmail, contactPhone: contactPhone || undefined });
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleCommissionSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    setCommissionSaving(true);
    setCommissionError('');
    setCommissionSaved(false);
    try {
      await patchSettings({
        defaultCommissionRate: commissionRate === '' ? null : Number(commissionRate),
        defaultCommissionType: commissionType,
      });
      setCommissionSaved(true);
    } catch (err) {
      setCommissionError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    } finally {
      setCommissionSaving(false);
    }
  }

  async function handleNotifySave(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    setNotifySaving(true);
    setNotifyError('');
    setNotifySaved(false);
    try {
      await patchSettings({ notifyOnBinding, notifyOnCommission });
      setNotifySaved(true);
    } catch (err) {
      setNotifyError(err instanceof Error ? err.message : tCommon('errors.saveFailed'));
    } finally {
      setNotifySaving(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteSaving(true);
    setInviteError('');
    try {
      await apiFetch('/merchant/team', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, password: invitePassword }),
      }, token);
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

  const readOnlyHint = !isOwner ? (
    <p className="text-xs text-muted-foreground">{t('ownerOnlyHint')}</p>
  ) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('profile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="max-w-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">{t('businessName')}</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={!isOwner}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">{t('contactEmail')}</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!isOwner}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">{t('contactPhone')}</Label>
              <Input
                id="contact-phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!isOwner}
              />
            </div>
            {readOnlyHint}
            <SaveStatus error={profileError} saved={profileSaved} savedLabel={tCommon('saved')} />
            {isOwner ? (
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? tCommon('saving') : t('saveProfile')}
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>{t('commissionDefaults')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCommissionSave} className="max-w-lg space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">{t('defaultRate')}</Label>
              <Input
                id="commission-rate"
                type="number"
                min={0}
                step="0.01"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                disabled={!isOwner}
                placeholder="e.g. 10"
              />
              <p className="text-xs text-muted-foreground">{t('defaultRateHelp')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission-type">{t('defaultType')}</Label>
              <Select
                id="commission-type"
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value as CommissionType)}
                disabled={!isOwner}
              >
                <option value="PERCENT">{t('commissionPercent')}</option>
                <option value="FIXED">{t('commissionFixedAmount')}</option>
              </Select>
            </div>
            {readOnlyHint}
            <SaveStatus error={commissionError} saved={commissionSaved} savedLabel={tCommon('saved')} />
            {isOwner ? (
              <Button type="submit" disabled={commissionSaving}>
                {commissionSaving ? tCommon('saving') : t('saveDefaults')}
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notifications')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNotifySave} className="max-w-lg space-y-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={notifyOnBinding}
                onChange={(e) => setNotifyOnBinding(e.target.checked)}
                disabled={!isOwner}
                className="size-4 rounded border"
              />
              {t('notifyOnBinding')}
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={notifyOnCommission}
                onChange={(e) => setNotifyOnCommission(e.target.checked)}
                disabled={!isOwner}
                className="size-4 rounded border"
              />
              {t('notifyOnCommission')}
            </label>
            {readOnlyHint}
            <SaveStatus error={notifyError} saved={notifySaved} savedLabel={tCommon('saved')} />
            {isOwner ? (
              <Button type="submit" disabled={notifySaving}>
                {notifySaving ? tCommon('saving') : t('saveNotifications')}
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('storePayments')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground">{t('storeUrl')}</p>
            <p className="font-mono text-sm">{settings.storeUrl}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('stripeMode')}</p>
            <Badge variant={settings.stripeMode === 'live' ? 'default' : 'secondary'}>
              {settings.stripeMode === 'live' ? t('stripeLive') : t('stripeMock')}
            </Badge>
          </div>
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
