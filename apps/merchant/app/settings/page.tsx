import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';

export default function SettingsPage() {
  return (
    <MerchantShellWrapper>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Merchant settings coming in a future release.</p>
      </div>
    </MerchantShellWrapper>
  );
}
