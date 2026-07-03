'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Alert,
  AlertDescription,
  Badge,
  BentoDetailHero,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DetailPageFrame,
  EmptyState,
  Input,
  Label,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { UserIdentity } from '@meridian/shared';

import {
  apiFetch,
  type ApprovedMerchantOption,
  type PlatformAccountDetail,
} from '@/lib/api';

interface UserDetailViewProps {
  user: PlatformAccountDetail;
  token: string;
  approvedMerchants: ApprovedMerchantOption[];
}

type PlatformAdminRole = 'SUPER_ADMIN' | 'PLATFORM_OPS';

function identityBadgeVariant(identity: UserIdentity) {
  switch (identity) {
    case 'MERCHANT_OWNER':
      return 'default' as const;
    case 'MERCHANT_STAFF':
      return 'secondary' as const;
    case 'DISTRIBUTOR':
      return 'outline' as const;
    case 'PLATFORM_ADMIN':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

function isStaffRoleForTenant(
  user: PlatformAccountDetail,
  tenantId: string,
): boolean {
  return user.merchantRoles.some(
    (role) => role.tenantId === tenantId && role.role === 'MERCHANT_STAFF',
  );
}

export function UserDetailView({
  user: initialUser,
  token,
  approvedMerchants,
}: UserDetailViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.users');
  const td = useTranslations('admin.users.detail');
  const te = useTranslations('admin.users.edit');
  const tc = useTranslations('common');

  const [user, setUser] = useState(initialUser);
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');

  const hasPlatformAdmin = user.identities.includes('PLATFORM_ADMIN');
  const hasDistributor = user.identities.includes('DISTRIBUTOR');

  const [platformAdminEnabled, setPlatformAdminEnabled] = useState(hasPlatformAdmin);
  const [platformAdminRole, setPlatformAdminRole] = useState<PlatformAdminRole>(
    initialUser.platformAdminRole ?? 'PLATFORM_OPS',
  );
  const [platformAdminRoleDirty, setPlatformAdminRoleDirty] = useState(false);
  const [distributorEnabled, setDistributorEnabled] = useState(hasDistributor);
  const [distributorCommission, setDistributorCommission] = useState(
    initialUser.distributorCommissionRate != null
      ? String(initialUser.distributorCommissionRate * 100)
      : '10',
  );
  const [staffByTenant, setStaffByTenant] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      approvedMerchants.map((merchant) => [
        merchant.tenantId,
        isStaffRoleForTenant(initialUser, merchant.tenantId),
      ]),
    ),
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingIdentities, setSavingIdentities] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [identitiesError, setIdentitiesError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [identitiesSuccess, setIdentitiesSuccess] = useState(false);

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || tc('emptyDash');
  const registeredAt = new Date(user.createdAt).toLocaleString(locale);

  const readOnlyIdentities = user.identities.filter((identity) =>
    ['CONSUMER', 'MERCHANT_OWNER'].includes(identity),
  );

  function syncUserState(next: PlatformAccountDetail) {
    setUser(next);
    setFirstName(next.firstName ?? '');
    setLastName(next.lastName ?? '');
    setPhone(next.phone ?? '');
    setPlatformAdminEnabled(next.identities.includes('PLATFORM_ADMIN'));
    setPlatformAdminRole(next.platformAdminRole ?? 'PLATFORM_OPS');
    setPlatformAdminRoleDirty(false);
    setDistributorEnabled(next.identities.includes('DISTRIBUTOR'));
    if (next.distributorCommissionRate != null) {
      setDistributorCommission(String(next.distributorCommissionRate * 100));
    }
    const nextStaff = Object.fromEntries(
      approvedMerchants.map((merchant) => [
        merchant.tenantId,
        isStaffRoleForTenant(next, merchant.tenantId),
      ]),
    );
    setStaffByTenant(nextStaff);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      const updated = await apiFetch<PlatformAccountDetail>(
        `/platform/users/${user.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            firstName: firstName.trim() || null,
            lastName: lastName.trim() || null,
            phone: phone.trim() || null,
          }),
        },
        token,
      );
      syncUserState(updated);
      setProfileSuccess(true);
      router.refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : te('profileFailed'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveIdentities(e: React.FormEvent) {
    e.preventDefault();
    setSavingIdentities(true);
    setIdentitiesError('');
    setIdentitiesSuccess(false);

    const merchantStaff = approvedMerchants
      .filter((merchant) => staffByTenant[merchant.tenantId] !== isStaffRoleForTenant(user, merchant.tenantId))
      .map((merchant) => ({
        tenantId: merchant.tenantId,
        enabled: staffByTenant[merchant.tenantId] ?? false,
      }));

    const payload: {
      platformAdminRole?: PlatformAdminRole | null;
      distributor?: { enabled: boolean; commissionRate?: number };
      merchantStaff?: Array<{ tenantId: string; enabled: boolean }>;
    } = {};

    const isPlatformAdmin = user.identities.includes('PLATFORM_ADMIN');
    if (platformAdminEnabled !== isPlatformAdmin) {
      payload.platformAdminRole = platformAdminEnabled ? platformAdminRole : null;
    } else if (platformAdminEnabled && platformAdminRoleDirty) {
      payload.platformAdminRole = platformAdminRole;
    }

    const isDistributor = user.identities.includes('DISTRIBUTOR');
    if (distributorEnabled !== isDistributor) {
      payload.distributor = distributorEnabled
        ? { enabled: true, commissionRate: Number(distributorCommission) / 100 }
        : { enabled: false };
    }

    if (merchantStaff.length > 0) {
      payload.merchantStaff = merchantStaff;
    }

    if (
      payload.platformAdminRole === undefined &&
      payload.distributor === undefined &&
      !payload.merchantStaff?.length
    ) {
      setSavingIdentities(false);
      return;
    }

    try {
      const updated = await apiFetch<PlatformAccountDetail>(
        `/platform/users/${user.id}/identities`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
        token,
      );
      syncUserState(updated);
      setIdentitiesSuccess(true);
      router.refresh();
    } catch (err) {
      setIdentitiesError(err instanceof Error ? err.message : te('identitiesFailed'));
    } finally {
      setSavingIdentities(false);
    }
  }

  return (
    <DetailPageFrame
      title={user.email}
      description={`${fullName} · ${td('registered')}: ${registeredAt}`}
      backHref="/users"
      backLabel={t('title')}
      badges={
        <div className="flex flex-wrap gap-1">
          {user.identities.map((identity) => (
            <Badge key={identity} variant={identityBadgeVariant(identity)}>
              {t(`identities.${identity}`)}
            </Badge>
          ))}
        </div>
      }
    >
      <BentoDetailHero
        metrics={[
          { title: td('consumerProfiles'), value: user.consumerProfiles.length },
          { title: td('merchantRoles'), value: user.merchantRoles.length },
          { title: t('columns.identities'), value: user.identities.length },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{te('profileTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileError ? (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            ) : null}
            {profileSuccess ? (
              <Alert>
                <AlertDescription>{te('profileSuccess')}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-email">{te('email')}</Label>
                <Input id="user-email" value={user.email} readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">{te('phone')}</Label>
                <Input
                  id="user-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-first-name">{te('firstName')}</Label>
                <Input
                  id="user-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-last-name">{te('lastName')}</Label>
                <Input
                  id="user-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? tc('saving') : te('saveProfile')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{te('identitiesTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveIdentities} className="space-y-6">
            {identitiesError ? (
              <Alert variant="destructive">
                <AlertDescription>{identitiesError}</AlertDescription>
              </Alert>
            ) : null}
            {identitiesSuccess ? (
              <Alert>
                <AlertDescription>{te('identitiesSuccess')}</AlertDescription>
              </Alert>
            ) : null}

            {readOnlyIdentities.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{te('readOnlyIdentity')}</p>
                <div className="flex flex-wrap gap-1">
                  {readOnlyIdentities.map((identity) => (
                    <Badge key={identity} variant={identityBadgeVariant(identity)}>
                      {t(`identities.${identity}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{te('platformAdmin')}</p>
                </div>
                <Switch
                  checked={platformAdminEnabled}
                  onCheckedChange={setPlatformAdminEnabled}
                  aria-label={te('platformAdmin')}
                />
              </div>
              {platformAdminEnabled ? (
                <div className="space-y-2">
                  <Label htmlFor="platform-admin-role">{te('platformAdminRole')}</Label>
                  <Select
                    id="platform-admin-role"
                    value={platformAdminRole}
                    onChange={(e) => {
                      setPlatformAdminRole(e.target.value as PlatformAdminRole);
                      setPlatformAdminRoleDirty(true);
                    }}
                  >
                    <option value="SUPER_ADMIN">{te('platformRoles.SUPER_ADMIN')}</option>
                    <option value="PLATFORM_OPS">{te('platformRoles.PLATFORM_OPS')}</option>
                  </Select>
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{te('distributor')}</p>
                </div>
                <Switch
                  checked={distributorEnabled}
                  onCheckedChange={setDistributorEnabled}
                  aria-label={te('distributor')}
                />
              </div>
              {distributorEnabled ? (
                <div className="space-y-2">
                  <Label htmlFor="distributor-commission">{te('distributorCommission')}</Label>
                  <Input
                    id="distributor-commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={distributorCommission}
                    onChange={(e) => setDistributorCommission(e.target.value)}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <p className="text-sm font-medium">{te('merchantStaff')}</p>
                <p className="text-sm text-muted-foreground">{te('merchantStaffHint')}</p>
              </div>
              {approvedMerchants.length === 0 ? (
                <p className="text-sm text-muted-foreground">{te('noApprovedMerchants')}</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {approvedMerchants.map((merchant) => {
                    const ownerRole = user.merchantRoles.find(
                      (role) =>
                        role.tenantId === merchant.tenantId &&
                        role.role === 'MERCHANT_OWNER',
                    );
                    if (ownerRole) {
                      return (
                        <div
                          key={merchant.tenantId}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{merchant.businessName}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('identities.MERCHANT_OWNER')}
                            </p>
                          </div>
                          <Badge variant="default">{t('identities.MERCHANT_OWNER')}</Badge>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={merchant.tenantId}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <p className="text-sm font-medium">{merchant.businessName}</p>
                        <Switch
                          checked={staffByTenant[merchant.tenantId] ?? false}
                          onCheckedChange={(checked) =>
                            setStaffByTenant((prev) => ({
                              ...prev,
                              [merchant.tenantId]: checked,
                            }))
                          }
                          aria-label={merchant.businessName}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button type="submit" disabled={savingIdentities}>
              {savingIdentities ? tc('saving') : te('saveIdentities')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{td('consumerProfiles')}</CardTitle>
        </CardHeader>
        <CardContent>
          {user.consumerProfiles.length === 0 ? (
            <EmptyState title={td('noConsumerProfiles')} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{td('columns.tenant')}</TableHead>
                  <TableHead>{td('columns.business')}</TableHead>
                  <TableHead>{td('columns.orders')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.consumerProfiles.map((profile) => (
                  <TableRow key={profile.customerId}>
                    <TableCell>{profile.tenantSlug}</TableCell>
                    <TableCell>{profile.businessName}</TableCell>
                    <TableCell>{profile.orderCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{td('merchantRoles')}</CardTitle>
        </CardHeader>
        <CardContent>
          {user.merchantRoles.length === 0 ? (
            <EmptyState title={td('noMerchantRoles')} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{td('columns.business')}</TableHead>
                  <TableHead>{td('columns.role')}</TableHead>
                  <TableHead>{td('columns.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.merchantRoles.map((role) => (
                  <TableRow key={`${role.tenantId}-${role.role}`}>
                    <TableCell>{role.businessName}</TableCell>
                    <TableCell>{role.role}</TableCell>
                    <TableCell>{role.onboardingStatus}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DetailPageFrame>
  );
}
