import { notFound } from 'next/navigation';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';
import type { Contact } from '@/lib/api';

import { ContactDetail } from './_components/contact-detail';

interface ContactDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const token = await getToken();
  if (!token) return null;

  const { id } = await params;

  let contact: Contact;
  try {
    contact = await apiFetch<Contact>(`/merchant/contacts/${id}`, {}, token);
  } catch {
    notFound();
  }

  return (
    <MerchantShellWrapper>
      <ContactDetail contact={contact} token={token} />
    </MerchantShellWrapper>
  );
}
