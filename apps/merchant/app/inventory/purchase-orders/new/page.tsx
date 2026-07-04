import { redirect } from 'next/navigation';

export default function NewPurchaseOrderPage() {
  redirect('/inventory/stock');
}
