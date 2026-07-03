'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@meridian/ui';

import {
  apiFetch,
  type PaginatedResponse,
  type PlatformAccountListItem,
  type PlatformDistributor,
} from '@/lib/api';

interface CreateMerchantFormProps {
  token: string;
  distributors: PlatformDistributor[];
}

export function CreateMerchantForm({ token, distributors }: CreateMerchantFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.merchants');
  const tu = useTranslations('admin.users');
  const tc = useTranslations('common');

  const [businessName, setBusinessName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerAccountId, setOwnerAccountId] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwnerEmail, setSelectedOwnerEmail] = useState('');
  const [ownerOptions, setOwnerOptions] = useState<PlatformAccountListItem[]>([]);
  const [recruitedByDistributorId, setRecruitedByDistributorId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ownerSearch.trim()) {
      setOwnerOptions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await apiFetch<PaginatedResponse<PlatformAccountListItem>>(
          `/platform/users?search=${encodeURIComponent(ownerSearch.trim())}&limit=10`,
          {},
          token,
        );
        setOwnerOptions(res.data);
      } catch {
        setOwnerOptions([]);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [ownerSearch, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await apiFetch<{ id: string }>(
        '/platform/merchants',
        {
          method: 'POST',
          body: JSON.stringify({
            businessName,
            legalName: legalName || undefined,
            contactEmail,
            contactPhone: contactPhone || undefined,
            slug: slug || undefined,
            ownerAccountId,
            recruitedByDistributorId: recruitedByDistributorId || undefined,
          }),
        },
        token,
      );
      router.push(`/merchants/${created.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('createFailed'));
    } finally {
      setLoading(false);
    }
  }

  const selectedOwnerLabel = selectedOwnerEmail || ownerSearch;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4 rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="businessName">{t('columns.businessName')}</Label>
        <Input
          id="businessName"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="legalName">{t('detail.legalName')}</Label>
        <Input id="legalName" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactEmail">{t('columns.contactEmail')}</Label>
        <Input
          id="contactEmail"
          type="email"
          required
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactPhone">{t('detail.contactPhone')}</Label>
        <Input
          id="contactPhone"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">{t('slug')}</Label>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <p className="text-xs text-muted-foreground">{t('slugHint')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ownerSearch">{t('owner')}</Label>
        <Input
          id="ownerSearch"
          placeholder={t('ownerSearch')}
          value={ownerSearch}
          onChange={(e) => {
            setOwnerSearch(e.target.value);
            setOwnerAccountId('');
          }}
        />
        {ownerOptions.length > 0 ? (
          <div className="rounded-md border">
            {ownerOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setOwnerAccountId(option.id);
                  setOwnerSearch(option.email);
                  setSelectedOwnerEmail(option.email);
                  setOwnerOptions([]);
                }}
              >
                {option.email}
                {option.firstName || option.lastName
                  ? ` (${[option.firstName, option.lastName].filter(Boolean).join(' ')})`
                  : ''}
              </button>
            ))}
          </div>
        ) : null}
        {ownerAccountId ? (
          <p className="text-xs text-muted-foreground">
            {tu('columns.email')}: {selectedOwnerLabel}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>{t('recruitedBy')}</Label>
        <Select
          value={recruitedByDistributorId || 'none'}
          onValueChange={(value) =>
            setRecruitedByDistributorId(value === 'none' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('recruitedByNone')}</SelectItem>
            {distributors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !ownerAccountId}>
          {loading ? tc('saving') : t('createSubmit')}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/merchants">{tc('cancel')}</Link>
        </Button>
      </div>
    </form>
  );
}
